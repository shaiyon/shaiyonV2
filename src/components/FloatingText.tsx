import { Text3D, Center } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Mesh } from "three";
import { RigidBody } from "@react-three/rapier";

export const FloatingText = () => {
	const textRef = useRef<Mesh>(null);
	const subtextRef = useRef<Mesh>(null);

	useFrame((state) => {
		if (textRef.current && subtextRef.current) {
			const wave = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
			textRef.current.position.y = wave + 2;
			subtextRef.current.position.y = wave + 1.2;
		}
	});

	return (
		<>
			<Center>
				<RigidBody type="fixed">
					<Text3D
						ref={textRef}
						font="/fonts/helvetiker_regular.json"
						size={0.8}
						height={0.2}
						curveSegments={12}
					>
						shaiyon hariri
						<meshStandardMaterial
							color="black"
							metalness={0.1}
							roughness={0.2}
						/>
					</Text3D>
				</RigidBody>
			</Center>
			<Center>
				<RigidBody type="fixed">
					<Text3D
						ref={subtextRef}
						font="/fonts/helvetiker_regular.json"
						size={0.3}
						height={0.1}
						curveSegments={12}
					>
						full stack ai engineer
						<meshStandardMaterial
							color="black"
							metalness={0.1}
							roughness={0.2}
						/>
					</Text3D>
				</RigidBody>
			</Center>
		</>
	);
};
