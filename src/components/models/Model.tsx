import React, {
	useState,
	useEffect,
	useRef,
	useMemo,
	useCallback,
} from "react";
import { OBJLoader, SVGLoader } from "three-stdlib";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import * as THREE from "three";
import { Vector3, Matrix4, Euler, Plane } from "three";

import {
	RigidBody,
	type RigidBody as RigidBodyType,
} from "@react-three/rapier";
import { useThree, useFrame } from "@react-three/fiber";
import { Text3D } from "@react-three/drei";

import { useCameraContext } from "../../contexts/CameraContext";
import { defaultFloorProps } from "../floors/types";
import { ModelConfig, SVGModelConfig } from "./types";
import { applyColorToModel, createExtrudedGeometry } from "./modelUtils";

interface ModelProps {
	config: ModelConfig;
	position: [number, number, number];
	rotation: [number, number, number];
	color?: string;
	onPositionUpdate: (id: number, position: [number, number, number]) => void;
	id: number;
}

const ModelDescription = ({
	text,
	rigidBodyRef,
	isDragging,
}: {
	text: string;
	rigidBodyRef: React.RefObject<RigidBodyType>;
	isDragging: boolean;
}) => {
	const { camera } = useThree();
	const [opacity, setOpacity] = useState(1);
	const fadeStartTimeRef = useRef(Date.now());
	const textRef = useRef<any>(null);

	// Center the text only once when it's first created
	useEffect(() => {
		if (textRef.current) {
			const bbox = new THREE.Box3().setFromObject(textRef.current);
			const offset = new THREE.Vector3();
			bbox.getSize(offset);
			textRef.current.geometry.translate(-offset.x / 2, -0.5, 0);
		}
	}, []);

	useEffect(() => {
		if (isDragging) {
			setOpacity(1);
		} else {
			fadeStartTimeRef.current = Date.now();
		}
	}, [isDragging]);

	useFrame(() => {
		if (textRef.current && rigidBodyRef.current) {
			const pos = rigidBodyRef.current.translation();
			textRef.current.position.set(pos.x, pos.y + 1, pos.z);

			// Make text face camera every frame
			textRef.current.quaternion.copy(camera.quaternion);

			if (!isDragging) {
				const elapsedTime =
					(Date.now() - fadeStartTimeRef.current) / 1000;
				if (elapsedTime > 3) {
					setOpacity((prev) => Math.max(0, prev - 0.05));
				}
			}
		}
	});

	if (opacity <= 0) return null;

	return (
		<Text3D
			ref={textRef}
			font="/fonts/helvetiker_regular.json"
			size={0.3}
			height={0.06}
			curveSegments={12}
		>
			{text}
			<meshStandardMaterial
				color="black"
				transparent
				opacity={opacity}
				metalness={0.1}
				roughness={0.2}
			/>
		</Text3D>
	);
};

export const Model: React.FC<ModelProps> = ({
	config,
	position,
	rotation,
	color,
	onPositionUpdate,
	id,
}) => {
	const isMobile = useMemo(
		() => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
		[]
	);

	const { setIsEnabled: setCameraEnabled } = useCameraContext();
	const { camera, raycaster, pointer } = useThree();
	const [showDescription, setShowDescription] = useState(false);
	const rigidBodyRef = useRef<RigidBodyType>(null);

	const objLoader = useMemo(() => new OBJLoader(), []);
	const svgLoader = useMemo(() => new SVGLoader(), []);
	const gltfLoader = useMemo(() => new GLTFLoader(), []);
	const [model, setModel] = useState<THREE.Object3D | null>(null);
	const [error, setError] = useState<string | null>(null);

	// Dragging state
	const [isDragging, setIsDragging] = useState(false);
	const dragStartOffset = useRef<THREE.Vector3>(new THREE.Vector3());
	const dragStartPosition = useRef<THREE.Vector3>(new THREE.Vector3());

	// Floor intersection setup
	const floorMatrix = useMemo(() => {
		const matrix = new Matrix4();
		const floorEuler = new Euler(...defaultFloorProps.rotation);
		matrix.makeRotationFromEuler(floorEuler);
		matrix.setPosition(new Vector3(...defaultFloorProps.position));
		return matrix;
	}, []);

	const floorPlane = useMemo(() => {
		const plane = new Plane(new Vector3(0, 1, 0));
		plane.applyMatrix4(floorMatrix);
		return plane;
	}, [floorMatrix]);

	useEffect(() => {
		const intervalId = setInterval(() => {
			if (rigidBodyRef.current && !isDragging) {
				const currentPosition = rigidBodyRef.current.translation();
				onPositionUpdate(id, [
					currentPosition.x,
					currentPosition.y,
					currentPosition.z,
				]);
			}
		}, 1000);

		return () => clearInterval(intervalId);
	}, [id, onPositionUpdate, isDragging]);

	const handlePointerDown = (e: any) => {
		e.stopPropagation();
		if (config.hoverText) {
			setShowDescription(true);
		}

		if (rigidBodyRef.current) {
			setIsDragging(true);
			setCameraEnabled(false);

			const currentPos = rigidBodyRef.current.translation();
			dragStartPosition.current.set(
				currentPos.x,
				currentPos.y,
				currentPos.z
			);
			dragStartOffset.current.set(
				currentPos.x - e.point.x,
				currentPos.y - e.point.y,
				currentPos.z - e.point.z
			);
		}
	};

	const handlePointerMove = useCallback(
		(e: any) => {
			if (isDragging && rigidBodyRef.current) {
				e.stopPropagation();

				// Update raycaster with current pointer position
				raycaster.setFromCamera(pointer, camera);

				// Find intersection with floor plane
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
					const floorNormal = new Vector3(0, 1, 0).applyMatrix4(
						floorMatrix
					);
					const pointOnFloor = intersectionPoint
						.clone()
						.projectOnPlane(floorNormal);

					// Apply the offset
					const newPosition = new Vector3(
						pointOnFloor.x + dragStartOffset.current.x,
						pointOnFloor.y + dragStartOffset.current.y,
						pointOnFloor.z + dragStartOffset.current.z
					);

					// Add hover height while dragging
					const HOVER_HEIGHT = 1;
					const currentPos = rigidBodyRef.current.translation();

					// Calculate distance to target
					const targetPos = {
						x: newPosition.x,
						y: defaultFloorProps.position[1] + HOVER_HEIGHT,
						z: newPosition.z,
					};

					// Calculate velocities based on distance
					const dx = targetPos.x - currentPos.x;
					const dz = targetPos.z - currentPos.z;

					// Speed increases with distance (capped at maxSpeed)
					const maxSpeed = 15;
					const distanceMultiplier = 3;
					const vx = Math.min(
						Math.max(dx * distanceMultiplier, -maxSpeed),
						maxSpeed
					);
					const vz = Math.min(
						Math.max(dz * distanceMultiplier, -maxSpeed),
						maxSpeed
					);

					// Calculate y velocity similar to x and z
					const dy = targetPos.y - currentPos.y;
					const vy = Math.min(
						Math.max(dy * distanceMultiplier, -maxSpeed),
						maxSpeed
					);

					// Set velocity for all axes
					rigidBodyRef.current.setLinvel({ x: vx, y: vy, z: vz });

					// No need to set translation anymore since we're using velocities for all axes
					rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }); // Keep it from rotating while being dragged
				}
			}
		},
		[isDragging, camera, raycaster, pointer, floorPlane, floorMatrix]
	);

	const handlePointerUp = useCallback(() => {
		if (isDragging && rigidBodyRef.current) {
			setIsDragging(false);
			setCameraEnabled(true);
		}
	}, [isDragging, setCameraEnabled]);

	// Add global pointer up listener
	useEffect(() => {
		if (isDragging) {
			window.addEventListener("pointerup", handlePointerUp);
			window.addEventListener("pointermove", handlePointerMove);
			return () => {
				window.removeEventListener("pointerup", handlePointerUp);
				window.removeEventListener("pointermove", handlePointerMove);
			};
		}
	}, [isDragging, handlePointerMove, handlePointerUp]);

	useEffect(() => {
		const loadModel = async () => {
			try {
				if (config.type === "obj") {
					const loadedModel = await objLoader.loadAsync(config.path);
					if ((color && config.randomizeColor) || config.color) {
						applyColorToModel(
							loadedModel,
							config.color || color,
							config
						);
					}
					setModel(loadedModel);
				} else if (config.type === "svg") {
					const svgData = await svgLoader.loadAsync(config.svgPath);
					const extrudedModel = createExtrudedGeometry(
						svgData,
						config as SVGModelConfig,
						(config as SVGModelConfig).depth
					);
					if (color && config.randomizeColor) {
						applyColorToModel(extrudedModel, color, config);
					}
					setModel(extrudedModel);
				} else if (config.type === "glb") {
					const loadedGLTF = await gltfLoader.loadAsync(
						config.glbPath
					);
					if ((color && config.randomizeColor) || config.color) {
						applyColorToModel(
							loadedGLTF.scene,
							config.color || color,
							config
						);
					}
					setModel(loadedGLTF.scene);
				}
			} catch (err) {
				console.error(`Error loading model ${config.id}:`, err);
				setError((err as Error).message);
			}
		};

		loadModel();
	}, [config, color, objLoader, svgLoader, gltfLoader]);

	if (error) return null;
	if (!model) return null;

	return (
		<>
			<RigidBody
				ref={rigidBodyRef}
				position={position}
				rotation={rotation}
				colliders={
					config.id === "brain"
						? "cuboid"
						: config.type === "obj"
						? "hull"
						: "cuboid"
				}
				restitution={0.3}
				friction={0.8}
				linearDamping={0.5}
				angularDamping={0.5}
				mass={config.id === "brain" ? 5 : 1}
			>
				<group
					onPointerDown={handlePointerDown}
					userData={{ isDraggableModel: true }} // Add this line
				>
					<primitive
						object={model}
						scale={config.scale ?? 1 * (isMobile ? 1.4 : 1)}
						receiveShadow
						castShadow
					/>
				</group>
			</RigidBody>

			{showDescription && config.hoverText && (
				<ModelDescription
					text={config.hoverText}
					rigidBodyRef={rigidBodyRef}
					isDragging={isDragging}
				/>
			)}
		</>
	);
};
