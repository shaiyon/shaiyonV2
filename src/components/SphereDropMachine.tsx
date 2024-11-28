import { useState, useEffect } from "react";
import { Vector3 } from "three";
import { useThree } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";

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
				position: [impactPoint.x, impactPoint.y, impactPoint.z],
				color: `hsl(${Math.random() * 360}, 70%, 50%)`,
				velocity: [velocityX, velocityY, velocityZ],
			});
		}

		setSpheres((prev) => [...prev, ...newSpheres]);
	};

	const handleSceneClick = (event: any) => {
		if (event.defaultPrevented) return;

		raycaster.setFromCamera(pointer, camera);
		const intersects = raycaster.intersectObjects([]);

		if (intersects.length > 0) {
			createImpactSpheres(intersects[0].point);
		} else {
			const point = new Vector3();
			raycaster.ray.at(10, point);
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
