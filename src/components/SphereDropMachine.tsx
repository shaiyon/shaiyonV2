import { useState, useEffect } from "react";
import { Vector3, Plane, Matrix4, Euler } from "three";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { useTexture } from "@react-three/drei";
import { usePauseContext } from "../contexts/PauseContext";
import { defaultFloorProps } from "./floors/types";
import type { SphereTextureType } from "../textureTypes";

export const TEXTURE_SETS = {
	RUBBER: {
		diff: "/textures/rubberized_track_diff_1k.jpg",
		disp: "/textures/rubberized_track_disp_1k.png",
		normal: "/textures/rubberized_track_nor_gl_1k.png",
		rough: "/textures/rubberized_track_rough_1k.png",
	},
	DENIM: {
		diff: "/textures/denim_fabric_diff_1k.jpg",
		disp: "/textures/denim_fabric_disp_1k.png",
		normal: "/textures/denim_fabric_nor_gl_1k.png",
		rough: "/textures/denim_fabric_rough_1k.jpg",
	},
	SNOW: {
		diff: "/textures/snow_02_diff_1k.jpg",
		disp: "/textures/snow_02_disp_1k.png",
		normal: "/textures/snow_02_nor_gl_1k.png",
		rough: "/textures/snow_02_rough_1k.jpg",
		translucent: "/textures/snow_02_translucent_1k.png",
	},
} as const;

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
	const textureSet = TEXTURE_SETS[textureType];
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

export const SphereDropMachine: React.FC<SphereDropMachineProps> = ({
	selectedTextureType,
}) => {
	const { isPaused } = usePauseContext();
	const [spheres, setSpheres] = useState<Sphere[]>([]);
	const { camera, raycaster, pointer } = useThree();

	// Regular falling spheres
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

	// Impact spheres
	const createImpactSpheres = (impactPoint: Vector3) => {
		if (isPaused) return;

		// Ensure the impact point is slightly above the floor
		const floorY = defaultFloorProps.position[1];
		const adjustedY = Math.max(impactPoint.y, floorY + 0.5);

		const numSpheres = 8;
		const newSpheres: Sphere[] = [];

		for (let i = 0; i < numSpheres; i++) {
			const angle = (i / numSpheres) * Math.PI * 2;
			const speed = 5 + Math.random() * 5;
			const velocityX = Math.cos(angle) * speed;
			const velocityY = 5 + Math.random() * 5;
			const velocityZ = Math.sin(angle) * speed;

			newSpheres.push({
				id: Date.now() + i,
				position: [impactPoint.x, adjustedY, impactPoint.z],
				velocity: [velocityX, velocityY, velocityZ],
			});
		}

		setSpheres((prev) => [...prev, ...newSpheres]);
	};

	const handleSceneClick = (event: MouseEvent) => {
		if (!event || event.defaultPrevented) return;

		raycaster.setFromCamera(pointer, camera);

		// Create transformation matrix for the floor
		const floorMatrix = new Matrix4();
		const floorEuler = new Euler(...defaultFloorProps.rotation);
		floorMatrix.makeRotationFromEuler(floorEuler);
		floorMatrix.setPosition(new Vector3(...defaultFloorProps.position));

		// Create and transform floor plane
		const floorPlane = new Plane(new Vector3(0, 1, 0));
		floorPlane.applyMatrix4(floorMatrix);

		// Find intersection with transformed floor plane
		const intersectionPoint = new Vector3();
		const intersected = raycaster.ray.intersectPlane(
			floorPlane,
			intersectionPoint
		);

		if (intersected) {
			createImpactSpheres(intersectionPoint);
		} else {
			// Fallback: project ray to reasonable distance
			const point = raycaster.ray.at(10, new Vector3());
			point.y = defaultFloorProps.position[1] + 0.5;
			createImpactSpheres(point);
		}
	};

	const cleanupSpheres = () => {
		setSpheres((prev) =>
			prev.filter((sphere) => {
				const posY = sphere.position[1];
				return posY > -10;
			})
		);

		if (spheres.length > 100) {
			setSpheres((prev) => prev.slice(-100));
		}
	};

	useEffect(() => {
		if (isPaused) return;

		const fallInterval = setInterval(spawnFallingSphere, 200);
		const cleanupInterval = setInterval(cleanupSpheres, 1000);

		document.addEventListener("click", handleSceneClick);

		return () => {
			clearInterval(fallInterval);
			clearInterval(cleanupInterval);
			document.removeEventListener("click", handleSceneClick);
		};
	}, [isPaused]);

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
