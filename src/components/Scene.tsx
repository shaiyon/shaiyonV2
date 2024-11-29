import { Environment, Sky } from "@react-three/drei";
import { useRef, useState, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

import { loadFloor } from "./floors";
import { defaultFloorProps } from "./floors/types";
import { FloatingText } from "./FloatingText";
import { SocialLinks } from "./SocialLinks";
import { SphereDropMachine } from "./SphereDropMachine";
import { ModelDropMachine } from "./models/ModelDropMachine";
import type { SelectedTextures } from "../textureTypes";
import { ShockwaveHandler } from "./ShockwaveHandler";

interface SceneProps {
	selectedTextures: SelectedTextures;
}

export const Scene: React.FC<SceneProps> = ({ selectedTextures }) => {
	const { camera } = useThree();
	const skyRef = useRef<THREE.Group>(null);
	const [Floor, setFloor] = useState<React.ComponentType<any> | null>(null);

	useEffect(() => {
		let mounted = true;

		const loadFloorComponent = async () => {
			try {
				const FloorComponent = await loadFloor(
					selectedTextures.floorType
				);
				if (mounted && FloorComponent) {
					setFloor(() => FloorComponent);
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
			<FloatingText />
			<SocialLinks />
			<SphereDropMachine
				selectedTextureType={selectedTextures.sphereType}
			/>
			<ModelDropMachine />
			{Floor && <Floor {...defaultFloorProps} />}
		</>
	);
};
