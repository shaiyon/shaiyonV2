import { useState, useEffect } from "react";
import { Vector3, Plane, Matrix4, Euler } from "three";
import { useThree } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";

import { defaultFloorProps } from "./floors/types";

interface Sphere {
	id: number;
	position: [number, number, number];
	color: string;
	velocity?: [number, number, number];
}

export const SphereDropMachine: React.FC = () => {
	const [spheres, setSpheres] = useState<Sphere[]>([]);
	const { camera, raycaster, pointer } = useThree();

	// Regular falling spheres
	const spawnFallingSphere = () => {
		const randomX = Math.random() * 6 - 3;
		const randomColor = `hsl(${Math.random() * 360}, 70%, 50%)`;

		setSpheres((prev) => [
			...prev,
			{
				id: Date.now(),
				position: [randomX, 12, -1],
				color: randomColor,
				velocity: [0, -0.1, 0], // Slight initial downward velocity
			},
		]);
	};

	// Impact spheres
	const createImpactSpheres = (impactPoint: Vector3) => {
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
				color: `hsl(${Math.random() * 360}, 70%, 50%)`,
				velocity: [velocityX, velocityY, velocityZ],
			});
		}

		setSpheres((prev) => [...prev, ...newSpheres]);
	};

	const handleSceneClick = (event: any) => {
		if (event.defaultPrevented) return;

		// Update raycaster with current pointer position
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
			// Transform intersection point back to world space
			const inverseFloorMatrix = floorMatrix.clone().invert();
			intersectionPoint.applyMatrix4(inverseFloorMatrix);

			// Project point onto floor plane while maintaining mouse position
			const floorNormal = new Vector3(0, 1, 0).applyMatrix4(floorMatrix);
			const pointOnFloor = intersectionPoint
				.clone()
				.projectOnPlane(floorNormal);

			// Adjust height to be slightly above floor
			pointOnFloor.y = defaultFloorProps.position[1] + 0.5;

			createImpactSpheres(pointOnFloor);
		} else {
			// Fallback: project ray to reasonable distance
			const point = raycaster.ray.at(10, new Vector3());
			point.y = defaultFloorProps.position[1] + 0.5;
			createImpactSpheres(point);
		}
	};

	// Cleanup old spheres
	const cleanupSpheres = () => {
		setSpheres((prev) =>
			prev.filter((sphere) => {
				const posY = sphere.position[1];
				return posY > -10; // Keep spheres above y = -10
			})
		);

		// Limit total number of spheres
		if (spheres.length > 100) {
			setSpheres((prev) => prev.slice(-100));
		}
	};

	useEffect(() => {
		// Set up regular falling spheres interval
		const fallInterval = setInterval(spawnFallingSphere, 200);

		// Set up cleanup interval
		const cleanupInterval = setInterval(cleanupSpheres, 1000);

		// Add click listener
		document.addEventListener("click", handleSceneClick);

		return () => {
			clearInterval(fallInterval);
			clearInterval(cleanupInterval);
			document.removeEventListener("click", handleSceneClick);
		};
	});

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
						<meshStandardMaterial color={sphere.color} />
					</mesh>
				</RigidBody>
			))}
		</>
	);
};
