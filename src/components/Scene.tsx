import { Environment, Sky } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { defaultFloorProps } from "./floors/types";
import { FloatingText } from "./FloatingText";
import { SocialLinks } from "./SocialLinks";
import { SphereDropMachine } from "./spheres/SphereDropMachine";
import { ModelDropMachine } from "./models/ModelDropMachine";
import type { SelectedTextures } from "../textureTypes";
import { ShockwaveHandler } from "./ShockwaveHandler";

interface SceneProps {
	selectedTextures: SelectedTextures;
	isTrapDoorTriggered: boolean;
	mode: "work" | "personal";
}

export const Scene: React.FC<SceneProps> = ({
	selectedTextures,
	isTrapDoorTriggered,
	mode,
}) => {
	const { camera } = useThree();
	const skyRef = useRef<THREE.Group>(null);
	const [Floor, setFloor] = useState<React.ComponentType<any> | null>(null);

	useEffect(() => {
		let mounted = true;

		const loadFloorComponent = async () => {
			try {
				const { default: TrapDoorFloor } = await import(
					"./floors/TrapDoorFloor"
				);
				if (mounted) {
					setFloor(() => TrapDoorFloor);
				}
			} catch (error) {
				console.error("Error loading floor:", error);
			}
		};

		loadFloorComponent();
		return () => {
			mounted = false;
		};
	}, [selectedTextures.floorType]);

	useFrame(() => {
		if (skyRef.current) {
			const rotation = camera.rotation;
			skyRef.current.rotation.x = rotation.x * 1;
			skyRef.current.rotation.y = rotation.y * 1;
			skyRef.current.rotation.z = rotation.z * 1;
		}
	});

	// Calculate positions for both trap doors
	const rightPosition = defaultFloorProps.position;
	const leftPosition = [
		-defaultFloorProps.position[0], // Mirror X coordinate
		defaultFloorProps.position[1], // Keep Y the same
		defaultFloorProps.position[2], // Keep Z the same
	];

	return (
		<>
			<group ref={skyRef}>
				<Sky
					distance={450000}
					sunPosition={[0, 1, 0]}
					inclination={0.6}
					azimuth={0.1}
					rayleigh={0.5}
					turbidity={8}
					mieCoefficient={0.005}
					mieDirectionalG={0.8}
				/>
			</group>
			<Environment preset="city" />
			<ambientLight intensity={0.5} />
			<directionalLight position={[10, 10, 5]} intensity={1} castShadow />
			<ShockwaveHandler />
			<FloatingText
				isTrapDoorTriggered={isTrapDoorTriggered}
				mode={mode}
			/>
			<SocialLinks isTrapDoorTriggered={isTrapDoorTriggered} />
			<SphereDropMachine
				selectedTextureType={selectedTextures.sphereType}
				isTrapDoorTriggered={isTrapDoorTriggered}
			/>
			<ModelDropMachine
				isTrapDoorTriggered={isTrapDoorTriggered}
				mode={mode}
			/>
			{Floor && (
				<>
					<Floor
						{...defaultFloorProps}
						position={rightPosition}
						textureSet={selectedTextures.floorType}
						isTriggered={isTrapDoorTriggered}
						side="right"
					/>
					<Floor
						{...defaultFloorProps}
						position={leftPosition}
						textureSet={selectedTextures.floorType}
						isTriggered={isTrapDoorTriggered}
						side="left"
					/>
				</>
			)}
		</>
	);
};
