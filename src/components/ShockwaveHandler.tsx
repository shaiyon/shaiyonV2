import React, { useCallback, useEffect, useState, useRef } from "react";
import { Vector3, Plane, Matrix4, Euler } from "three";
import { useThree } from "@react-three/fiber";
import { useRapier } from "@react-three/rapier";
import { usePauseContext } from "../contexts/PauseContext";
import { defaultFloorProps } from "./floors/types";

// Constants for shockwave behavior
const SHOCKWAVE_RADIUS = 4;
const SHOCKWAVE_FORCE = 3;
const SHOCKWAVE_UPLIFT = 2;
const MIN_FORCE = 1;
const MAX_CLICK_DURATION = 150; // ms - threshold for what counts as a "quick" click

export const ShockwaveHandler: React.FC = () => {
	const { isPaused } = usePauseContext();
	const { camera, raycaster, pointer, scene } = useThree();
	const { world } = useRapier();
	const [isHoveringModel, setIsHoveringModel] = useState(false);
	const clickStartTime = useRef<number | null>(null);

	// Check if we're hovering over a model
	const checkHover = useCallback(() => {
		raycaster.setFromCamera(pointer, camera);
		const intersects = raycaster.intersectObjects(scene.children, true);

		const hoveringModel = intersects.some((intersect) => {
			let current = intersect.object;
			while (current) {
				if (current.userData.isDraggableModel) {
					return true;
				}
				current = current.parent;
			}
			return false;
		});

		setIsHoveringModel(hoveringModel);
	}, [scene, camera, raycaster, pointer]);

	// Shockwave effect
	const createShockwave = useCallback(
		(center: Vector3) => {
			if (isPaused || !world) return;

			const bodies = world.bodies;

			bodies.forEach((body: any) => {
				if (!body) return;

				const position = body.translation();
				const pos = new Vector3(position.x, position.y, position.z);

				const distance = pos.distanceTo(center);

				if (distance <= SHOCKWAVE_RADIUS) {
					const forceMagnitude = Math.max(
						MIN_FORCE,
						SHOCKWAVE_FORCE * (1 - distance / SHOCKWAVE_RADIUS) ** 2
					);

					const direction = pos.clone().sub(center).normalize();
					const upwardForce =
						SHOCKWAVE_UPLIFT * (1 - distance / SHOCKWAVE_RADIUS);
					direction.y += upwardForce;
					direction.normalize();

					const impulse = direction.multiplyScalar(forceMagnitude);
					body.applyImpulse(
						{
							x: impulse.x,
							y: impulse.y,
							z: impulse.z,
						},
						true
					);
				}
			});
		},
		[isPaused, world]
	);

	const handleMouseDown = useCallback(
		(event: MouseEvent) => {
			if (event.button !== 0 || isHoveringModel || event.defaultPrevented)
				return;
			clickStartTime.current = Date.now();
		},
		[isHoveringModel]
	);

	const handleMouseUp = useCallback(
		(event: MouseEvent) => {
			if (event.button !== 0 || isHoveringModel || event.defaultPrevented)
				return;

			// Check if this was a quick click
			if (
				clickStartTime.current &&
				Date.now() - clickStartTime.current <= MAX_CLICK_DURATION
			) {
				raycaster.setFromCamera(pointer, camera);

				// Create transformation matrix for the floor
				const floorMatrix = new Matrix4();
				const floorEuler = new Euler(...defaultFloorProps.rotation);
				floorMatrix.makeRotationFromEuler(floorEuler);
				floorMatrix.setPosition(
					new Vector3(...defaultFloorProps.position)
				);

				// Create and transform floor plane
				const floorPlane = new Plane(new Vector3(0, 1, 0));
				floorPlane.applyMatrix4(floorMatrix);

				// Find intersection with floor
				const intersectionPoint = new Vector3();
				const intersected = raycaster.ray.intersectPlane(
					floorPlane,
					intersectionPoint
				);

				if (intersected) {
					createShockwave(intersectionPoint);
				}
			}

			// Reset click timer
			clickStartTime.current = null;
		},
		[camera, raycaster, pointer, createShockwave, isHoveringModel]
	);

	// Track pointer movement to update hover state
	const handlePointerMove = useCallback(() => {
		checkHover();
	}, [checkHover]);

	useEffect(() => {
		if (isPaused) return;

		document.addEventListener("mousedown", handleMouseDown);
		document.addEventListener("mouseup", handleMouseUp);
		document.addEventListener("pointermove", handlePointerMove);

		return () => {
			document.removeEventListener("mousedown", handleMouseDown);
			document.removeEventListener("mouseup", handleMouseUp);
			document.removeEventListener("pointermove", handlePointerMove);
		};
	}, [isPaused, handleMouseDown, handleMouseUp, handlePointerMove]);

	return null;
};
