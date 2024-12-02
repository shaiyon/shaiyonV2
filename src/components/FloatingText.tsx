import { Text3D } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef, useState, useEffect } from "react";
import { Mesh, Vector3 } from "three";
import { RigidBody } from "@react-three/rapier";

export const FloatingText = ({
	isTrapDoorTriggered,
}: {
	isTrapDoorTriggered: boolean;
}) => {
	const initialTextPosition = new Vector3(0, 2, 0);
	const initialSubtextPosition = new Vector3(0, 1.2, 0);

	const textRef = useRef<Mesh>(null);
	const subtextRef = useRef<Mesh>(null);
	const textBodyRef = useRef<RigidBody>(null);
	const subtextBodyRef = useRef<RigidBody>(null);
	const [opacity, setOpacity] = useState(1);
	const previousTriggerState = useRef(isTrapDoorTriggered);
	const fadeAnimationRef = useRef<number>();
	const [isResetting, setIsResetting] = useState(false);

	// Center the text meshes within their RigidBodies
	useEffect(() => {
		if (textRef.current) {
			textRef.current.geometry.center();
		}
		if (subtextRef.current) {
			subtextRef.current.geometry.center();
		}
	}, []);

	// FloatingText component
	useFrame((state) => {
		if (textRef.current && subtextRef.current && !isTrapDoorTriggered) {
			// Always keep floating, regardless of reset state
			const wave = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
			textRef.current.position.y = wave;
			subtextRef.current.position.y = wave;
		}
	});
	useEffect(() => {
		if (previousTriggerState.current && !isTrapDoorTriggered) {
			setIsResetting(true);
			setOpacity(0);

			setTimeout(() => {
				if (textBodyRef.current && subtextBodyRef.current) {
					// Reset positions
					textBodyRef.current.setTranslation(
						{ x: 0, y: 2, z: 0 },
						true
					);
					subtextBodyRef.current.setTranslation(
						{ x: 0, y: 1.2, z: 0 },
						true
					);

					// Reset rotations
					textBodyRef.current.setRotation(
						{ x: 0, y: 0, z: 0, w: 1 },
						true
					);
					subtextBodyRef.current.setRotation(
						{ x: 0, y: 0, z: 0, w: 1 },
						true
					);

					// Reset velocities
					textBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
					textBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
					subtextBodyRef.current.setLinvel(
						{ x: 0, y: 0, z: 0 },
						true
					);
					subtextBodyRef.current.setAngvel(
						{ x: 0, y: 0, z: 0 },
						true
					);
				}

				// Fade in animation
				let startTime = Date.now();
				const fadeInDuration = 2000;

				const animate = () => {
					const elapsed = Date.now() - startTime;
					const progress = Math.min(elapsed / fadeInDuration, 1);
					setOpacity(progress);

					if (progress < 1) {
						fadeAnimationRef.current =
							requestAnimationFrame(animate);
					} else {
						setIsResetting(false);
					}
				};

				fadeAnimationRef.current = requestAnimationFrame(animate);
			}, 500);
		}

		previousTriggerState.current = isTrapDoorTriggered;

		return () => {
			if (fadeAnimationRef.current) {
				cancelAnimationFrame(fadeAnimationRef.current);
			}
		};
	}, [isTrapDoorTriggered]);

	return (
		<>
			<RigidBody
				ref={textBodyRef}
				type={isTrapDoorTriggered ? "dynamic" : "fixed"}
				position={initialTextPosition}
			>
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
						transparent
						opacity={opacity}
					/>
				</Text3D>
			</RigidBody>

			<RigidBody
				ref={subtextBodyRef}
				type={isTrapDoorTriggered ? "dynamic" : "fixed"}
				position={initialSubtextPosition}
			>
				<Text3D
					ref={subtextRef}
					font="/fonts/helvetiker_regular.json"
					size={0.3}
					height={0.1}
					curveSegments={12}
				>
					software engineer
					<meshStandardMaterial
						color="black"
						metalness={0.1}
						roughness={0.2}
						transparent
						opacity={opacity}
					/>
				</Text3D>
			</RigidBody>
		</>
	);
};
