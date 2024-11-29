import { useState, useEffect } from "react";
import * as THREE from "three";
import { RigidBody } from "@react-three/rapier";
import { useTexture } from "@react-three/drei";
import { SPHERE_TEXTURE_SETS } from "./sphereTextures";
import type { SphereTextureType } from "../../textureTypes";
import { usePauseContext } from "../../contexts/PauseContext";

const MAX_SPHERES = 75;
const SPAWN_INTERVAL = 0.2 * 1000;
const CLEANUP_INTERVAL = 1 * 1000;
const Y_THRESHOLD = -5;

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

interface SphereDropMachineProps {
	selectedTextureType: SphereTextureType;
}

export const SphereDropMachine = ({
	selectedTextureType,
}: SphereDropMachineProps) => {
	const { isPaused } = usePauseContext();
	const [spheres, setSpheres] = useState<Sphere[]>([]);

	const spawnFallingSphere = () => {
		const randomX = Math.random() * 6 - 3;
		setSpheres((prev) => [
			...prev,
			{
				id: Date.now(),
				position: [randomX, 12, -1],
				velocity: [0, -0.1, 0],
			},
		]);
	};

	useEffect(() => {
		if (isPaused) return;

		const spawnInterval = setInterval(spawnFallingSphere, SPAWN_INTERVAL);

		const cleanupInterval = setInterval(() => {
			console.log(`sphere count ${spheres.length}`);

			setSpheres((prev) => {
				const remainingSpheres = prev.filter(
					(sphere) => sphere.position[1] > Y_THRESHOLD
				);

				// If we're over MAX_SPHERES, remove the oldest ones
				if (remainingSpheres.length > MAX_SPHERES) {
					return remainingSpheres.slice(-MAX_SPHERES);
				}

				return remainingSpheres;
			});
		}, CLEANUP_INTERVAL);

		// Prevent context menu
		const handleContextMenu = (e: Event) => e.preventDefault();
		document.addEventListener("contextmenu", handleContextMenu);

		return () => {
			clearInterval(spawnInterval);
			clearInterval(cleanupInterval);
			document.removeEventListener("contextmenu", handleContextMenu);
		};
	}, [isPaused, spheres.length]);

	return (
		<>
			{spheres.map((sphere) => (
				<RigidBody
					key={sphere.id}
					position={sphere.position}
					linearVelocity={sphere.velocity}
					colliders="ball"
					restitution={0.7}
				>
					<mesh castShadow receiveShadow>
						<sphereGeometry args={[0.3]} />
						<TexturedSphereMaterial
							textureType={selectedTextureType}
						/>
					</mesh>
				</RigidBody>
			))}
		</>
	);
};
