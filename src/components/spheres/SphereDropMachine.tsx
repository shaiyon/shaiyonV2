import { useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import { useTexture } from "@react-three/drei";
import { SPHERE_TEXTURE_SETS } from "./sphereTextures";
import type { SphereTextureType } from "../../textureTypes";
import { usePauseContext } from "../../contexts/PauseContext";

const MAX_SPHERES = 75;
const SPAWN_INTERVAL = 0.2 * 1000;
const SPAWN_Y = 14;
const Y_THRESHOLD = -20;

interface Sphere {
	id: number;
	position: [number, number, number];
	velocity?: [number, number, number];
}

interface TexturedSphereMaterialProps {
	textureType: SphereTextureType;
}

const TexturedSphereMaterial: React.FC<TexturedSphereMaterialProps> = ({
	textureType,
}) => {
	const textureSet = SPHERE_TEXTURE_SETS[textureType];
	const textures = useTexture({
		map: textureSet.diff,
		displacementMap: textureSet.disp,
		normalMap: textureSet.normal,
		roughnessMap: textureSet.rough,
	});

	Object.values(textures).forEach((texture) => {
		if (texture) {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set(1, 1);
			texture.minFilter = THREE.LinearMipMapLinearFilter;
			texture.magFilter = THREE.LinearFilter;
			texture.anisotropy = 16;
		}
	});

	const getMaterialProps = () => {
		if (textureType === "RUBBER") {
			return {
				normalScale: new THREE.Vector2(0.3, 0.3),
				roughness: 0.9,
				metalness: 0.0,
				displacementScale: 0.05,
				envMapIntensity: 0.2,
			};
		} else {
			return {
				normalScale: new THREE.Vector2(0.6, 0.6),
				roughness: 1.0,
				metalness: 0.0,
				displacementScale: 0.1,
				envMapIntensity: 0.1,
			};
		}
	};

	return <meshStandardMaterial {...textures} {...getMaterialProps()} />;
};

const PhysicsSphere: React.FC<{
	sphere: Sphere;
	onRemove: (id: number) => void;
	textureType: SphereTextureType;
}> = ({ sphere, onRemove, textureType }) => {
	const rigidBodyRef = useRef<RigidBodyApi>(null);

	useEffect(() => {
		const checkPosition = () => {
			if (rigidBodyRef.current) {
				const position = rigidBodyRef.current.translation();
				if (position.y < Y_THRESHOLD) {
					// Remove the sphere from physics world and scene
					rigidBodyRef.current.sleep();
					onRemove(sphere.id);
				}
			}
		};

		const interval = setInterval(checkPosition, 100);
		return () => clearInterval(interval);
	}, [sphere.id, onRemove]);

	return (
		<RigidBody
			ref={rigidBodyRef}
			position={sphere.position}
			linearVelocity={sphere.velocity}
			colliders="ball"
			restitution={0.7}
		>
			<mesh castShadow receiveShadow>
				<sphereGeometry args={[0.3]} />
				<TexturedSphereMaterial textureType={textureType} />
			</mesh>
		</RigidBody>
	);
};

interface SphereDropMachineProps {
	selectedTextureType: SphereTextureType;
	isTrapDoorTriggered: boolean;
}

export const SphereDropMachine: React.FC<SphereDropMachineProps> = ({
	selectedTextureType,
	isTrapDoorTriggered,
}) => {
	const { isPaused } = usePauseContext();
	const [spheres, setSpheres] = useState<Sphere[]>([]);

	const spawnFallingSphere = () => {
		const randomX = Math.random() * 6 - 3;
		setSpheres((prev) => {
			// Only add new sphere if under MAX_SPHERES
			if (prev.length >= MAX_SPHERES) {
				return prev;
			}
			return [
				...prev,
				{
					id: Date.now(),
					position: [randomX, SPAWN_Y, -1],
					velocity: [0, -0.1, 0],
				},
			];
		});
	};

	// Handle sphere removal
	const handleRemoveSphere = (id: number) => {
		setSpheres((prev) => prev.filter((sphere) => sphere.id !== id));
	};

	// Spawn effect
	useEffect(() => {
		if (isPaused) return;
		const spawnInterval = setInterval(spawnFallingSphere, SPAWN_INTERVAL);
		return () => clearInterval(spawnInterval);
	}, [isPaused, isTrapDoorTriggered]);

	useEffect(() => {
		const handleContextMenu = (e: Event) => e.preventDefault();
		document.addEventListener("contextmenu", handleContextMenu);
		return () =>
			document.removeEventListener("contextmenu", handleContextMenu);
	}, []);

	return (
		<>
			{spheres.map((sphere) => (
				<PhysicsSphere
					key={sphere.id}
					sphere={sphere}
					onRemove={handleRemoveSphere}
					textureType={selectedTextureType}
				/>
			))}
		</>
	);
};
