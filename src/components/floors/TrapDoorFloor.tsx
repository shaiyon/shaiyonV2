import { useRef, useEffect, useState } from "react";
import {
	RigidBody,
	CuboidCollider,
	useRevoluteJoint,
} from "@react-three/rapier";
import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { FloorProps } from "./types";
import { FLOOR_TEXTURE_SETS } from "./floorTextures";

export type TextureSetType = keyof typeof FLOOR_TEXTURE_SETS;

const RESET_DELAY_MS = 3500;
const RESET_DURATION_MS = 1500;

interface TrapDoorFloorProps extends FloorProps {
	textureSet: TextureSetType;
	isTriggered?: boolean;
	side: "left" | "right";
}

const TrapDoorFloor: React.FC<TrapDoorFloorProps> = ({
	position = [0, -2, 0],
	rotation = [0.1, 0, 0],
	textureSet,
	isTriggered = false,
	side = "right",
}) => {
	const floorRef = useRef(null);
	const anchorRef = useRef(null);
	const [isPhysicsEnabled, setIsPhysicsEnabled] = useState(false);
	const [isResetting, setIsResetting] = useState(false);
	const resetStartTime = useRef<number | null>(null);

	// Keep mesh positions as they were (hinges on inner edges)
	const meshPosition = side === "right" ? [-5, 0, 0] : [5, 0, 0];

	const initialState = useRef({
		position: [...position],
		rotation: [...rotation],
		meshPosition,
	});

	const texturePaths = FLOOR_TEXTURE_SETS[textureSet];
	const textures = useTexture({
		map: texturePaths.diff,
		displacementMap: texturePaths.disp,
		normalMap: texturePaths.normal,
		roughnessMap: texturePaths.rough,
	});

	Object.values(textures).forEach((texture) => {
		if (texture) {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set(2, 2);
			texture.minFilter = THREE.LinearMipMapLinearFilter;
			texture.magFilter = THREE.LinearFilter;
			texture.anisotropy = 16;
		}
	});

	// Keep joint configurations as they were, but we'll modify the torque direction
	const jointConfig =
		side === "right"
			? [
					[0, 0, 0],
					[0, 0, 0],
					[0, 0, 1],
					[-Math.PI / 2, 0],
			  ]
			: [
					[0, 0, 0],
					[0, 0, 0],
					[0, 0, 1],
					[Math.PI / 2, 0],
			  ];

	useRevoluteJoint(anchorRef, floorRef, jointConfig);

	const resetToInitialState = () => {
		if (floorRef.current) {
			// Add the anchor offset to the reset position
			const anchorOffset = side === "right" ? 10 : -10;
			floorRef.current.setTranslation(
				{
					x: initialState.current.position[0] + anchorOffset,
					y: initialState.current.position[1],
					z: initialState.current.position[2],
				},
				true
			);

			// Rest of the reset logic stays the same...
			const initialQuat = new THREE.Quaternion().setFromEuler(
				new THREE.Euler(
					initialState.current.rotation[0],
					initialState.current.rotation[1],
					initialState.current.rotation[2]
				)
			);
			floorRef.current.setRotation(initialQuat, true);
			floorRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
			floorRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
		}
	};

	useEffect(() => {
		if (isTriggered && !isPhysicsEnabled && !isResetting) {
			setIsPhysicsEnabled(true);

			setTimeout(() => {
				if (floorRef.current) {
					// Reverse torque directions for outward opening
					// const torqueZ = side === "right" ? -2000 : 2000;
					// floorRef.current.applyTorqueImpulse({
					// 	x: 0,
					// 	y: 0,
					// 	z: torqueZ,
					// });
					// floorRef.current.applyImpulse(
					// 	{ x: 0, y: -1000, z: 0 },
					// 	true
					// );
				}
			}, 0);

			setTimeout(() => {
				setIsResetting(true);
				resetStartTime.current = Date.now();
			}, RESET_DELAY_MS);
		}
	}, [isTriggered, isPhysicsEnabled, isResetting, side]);

	useFrame(() => {
		if (isResetting && resetStartTime.current !== null) {
			const elapsed = Date.now() - resetStartTime.current;
			const progress = Math.min(elapsed / RESET_DURATION_MS, 1);

			if (progress === 1) {
				resetToInitialState();
				setIsResetting(false);
				setIsPhysicsEnabled(false);
				resetStartTime.current = null;
			} else if (floorRef.current) {
				const currentPos = floorRef.current.translation();
				const targetPos = initialState.current.position;

				const currentRot = floorRef.current.rotation();
				const currentQuat = new THREE.Quaternion(
					currentRot.x,
					currentRot.y,
					currentRot.z,
					currentRot.w
				);
				const targetQuat = new THREE.Quaternion().setFromEuler(
					new THREE.Euler(
						initialState.current.rotation[0],
						initialState.current.rotation[1],
						initialState.current.rotation[2]
					)
				);

				floorRef.current.setTranslation(
					{
						x:
							currentPos.x +
							(targetPos[0] +
								(side === "right" ? 10 : -10) -
								currentPos.x) *
								progress,
						y:
							currentPos.y +
							(targetPos[1] - currentPos.y) * progress,
						z:
							currentPos.z +
							(targetPos[2] - currentPos.z) * progress,
					},
					true
				);

				currentQuat.slerp(targetQuat, progress);
				floorRef.current.setRotation(currentQuat, true);

				floorRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
				floorRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
			}
		}
	});

	return (
		<group position={position} rotation={rotation}>
			<RigidBody
				ref={anchorRef}
				type="fixed"
				colliders={false}
				position={side === "right" ? [10, 0, 0] : [-10, 0, 0]}
			>
				<CuboidCollider args={[0.1, 0.1, 0.1]} sensor />
			</RigidBody>

			<RigidBody
				ref={floorRef}
				type={isPhysicsEnabled ? "dynamic" : "fixed"}
				colliders="cuboid"
				mass={100}
				angularDamping={2}
				linearDamping={0.2}
				friction={1.0}
				restitution={0.2}
			>
				<mesh
					receiveShadow
					position={initialState.current.meshPosition}
				>
					<boxGeometry args={[10, 0.2, 20]} />
					<meshStandardMaterial
						{...textures}
						normalScale={new THREE.Vector2(0.5, 0.5)}
						roughness={0.8}
						metalness={0.0}
						displacementScale={0.1}
						side={THREE.DoubleSide}
					/>
				</mesh>
			</RigidBody>
		</group>
	);
};

export default TrapDoorFloor;
