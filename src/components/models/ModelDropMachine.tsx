import { useState, useCallback, useEffect, useRef } from "react";
import { Suspense } from "react";
import { usePauseContext } from "../../contexts/PauseContext";
import { ModelConfig } from "./types";
import { Model } from "./Model";
import { MODEL_CONFIGS } from "./modelConfigs";

const SPAWN_INTERVAL = 1 * 1000;
const Y_THRESHOLD = -20;

interface DropModel {
	id: number;
	configId: string;
	position: [number, number, number];
	rotation: [number, number, number];
	color?: string;
	hasSpawned: boolean;
}

const getRandomColor = () => {
	const h = Math.random();
	const s = 0.3 + Math.random() * 0.3;
	const l = 0.4 + Math.random() * 0.2;
	return `hsl(${h * 360}, ${s * 100}%, ${l * 100}%)`;
};

export const ModelDropMachine = ({
	isTrapDoorTriggered,
}: {
	isTrapDoorTriggered: boolean;
}) => {
	const { isPaused } = usePauseContext();
	const [models, setModels] = useState<DropModel[]>([]);
	const [spawnQueue, setSpawnQueue] = useState<ModelConfig[]>([]);
	const prevTrapDoorState = useRef(isTrapDoorTriggered);

	const createModel = useCallback((config: ModelConfig): DropModel => {
		return {
			id: Date.now() + Math.random(),
			configId: config.id,
			position: [Math.random() * 6 - 3, 10, Math.random() * 4 - 2],
			rotation: [
				Math.random() * Math.PI,
				Math.random() * Math.PI,
				Math.random() * Math.PI,
			],
			color: config.randomizeColor ? getRandomColor() : undefined,
			hasSpawned: true,
		};
	}, []);

	const handlePositionUpdate = useCallback(
		(id: number, newPosition: [number, number, number]) => {
			if (isPaused) return;

			setModels((prevModels) => {
				if (newPosition[1] <= Y_THRESHOLD) {
					console.log(`[FALL] Model ${id} has fallen`);

					// If trap door is triggered, remove the model without respawning
					if (isTrapDoorTriggered) {
						console.log(
							`[REMOVE] Removing model ${id} (trap door open)`
						);
						return prevModels.filter((model) => model.id !== id);
					}

					// Otherwise respawn as usual
					console.log(`[RESPAWN] Respawning model ${id}`);
					const fallenModel = prevModels.find(
						(model) => model.id === id
					);
					if (!fallenModel) return prevModels;

					const config = MODEL_CONFIGS.find(
						(c) => c.id === fallenModel.configId
					);
					if (!config) return prevModels;

					return prevModels.map((model) =>
						model.id === id ? createModel(config) : model
					);
				}

				return prevModels.map((model) =>
					model.id === id
						? { ...model, position: newPosition }
						: model
				);
			});
		},
		[createModel, isPaused, isTrapDoorTriggered]
	);

	// Reset function to shuffle configs and clear models
	const resetModels = useCallback(() => {
		console.log("[RESET] Clearing models and reshuffling queue");
		setModels([]); // Clear all existing models
		const shuffledConfigs = [...MODEL_CONFIGS].sort(
			() => Math.random() - 0.5
		);
		setSpawnQueue(shuffledConfigs);
	}, []);

	// Initial setup
	useEffect(() => {
		resetModels();
	}, [resetModels]);

	// Handle trap door state change
	useEffect(() => {
		// Check if transitioning from open to closed
		if (prevTrapDoorState.current && !isTrapDoorTriggered) {
			console.log(
				"[TRAP DOOR] Transitioning from open to closed, resetting models"
			);
			resetModels();
		}
		// Update the previous state
		prevTrapDoorState.current = isTrapDoorTriggered;
	}, [isTrapDoorTriggered, resetModels]);

	// Handle spawning with pause support
	useEffect(() => {
		console.log(`is trap door triggered: ${isTrapDoorTriggered}`);
		if (isPaused || isTrapDoorTriggered || spawnQueue.length === 0) return;

		const spawnInterval = setInterval(() => {
			setSpawnQueue((prevQueue) => {
				if (prevQueue.length === 0) return prevQueue;

				const [nextConfig, ...remainingConfigs] = prevQueue;
				console.log(`[SPAWN] Releasing ${nextConfig.id}`);

				setModels((prevModels) => [
					...prevModels,
					createModel(nextConfig),
				]);
				return remainingConfigs;
			});
		}, SPAWN_INTERVAL);

		return () => clearInterval(spawnInterval);
	}, [isPaused, isTrapDoorTriggered, createModel, spawnQueue]);

	return (
		<Suspense fallback={null}>
			{models.map((model) => {
				const config = MODEL_CONFIGS.find(
					(c) => c.id === model.configId
				);
				if (!config) return null;

				return (
					<Model
						key={model.id}
						id={model.id}
						config={config}
						position={model.position}
						rotation={model.rotation}
						color={model.color}
						onPositionUpdate={handlePositionUpdate}
					/>
				);
			})}
		</Suspense>
	);
};
