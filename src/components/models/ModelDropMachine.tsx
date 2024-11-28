import React, { useState, useCallback, useEffect } from "react";
import { Suspense } from "react";
import { usePauseContext } from "../../contexts/PauseContext";
import { ModelConfig } from "./types";
import { Model } from "./Model";
import { MODEL_CONFIGS } from "./modelConfigs";

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

export const ModelDropMachine: React.FC = () => {
	const { isPaused } = usePauseContext();
	const [models, setModels] = useState<DropModel[]>([]);
	const [spawnQueue, setSpawnQueue] = useState<ModelConfig[]>([]);

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
			if (isPaused) return; // Don't update positions when paused

			setModels((prevModels) => {
				// Check if the model has fallen below -10
				if (newPosition[1] <= -10) {
					console.log(
						`[RESPAWN] Model ${id} has fallen below -10, respawning`
					);
					// Find the fallen model and its config
					const fallenModel = prevModels.find(
						(model) => model.id === id
					);
					if (!fallenModel) return prevModels;

					const config = MODEL_CONFIGS.find(
						(c) => c.id === fallenModel.configId
					);
					if (!config) return prevModels;

					// Replace the fallen model with a new instance of the same type
					return prevModels.map((model) =>
						model.id === id ? createModel(config) : model
					);
				}

				// Otherwise just update the position
				return prevModels.map((model) =>
					model.id === id
						? { ...model, position: newPosition }
						: model
				);
			});
		},
		[createModel, isPaused]
	);

	// Initial setup
	useEffect(() => {
		// Create a shuffled queue of configs
		const shuffledConfigs = [...MODEL_CONFIGS].sort(
			() => Math.random() - 0.5
		);
		setSpawnQueue(shuffledConfigs);
	}, []);

	// Handle spawning with pause support
	useEffect(() => {
		if (isPaused || spawnQueue.length === 0) return;

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
		}, 1500);

		return () => clearInterval(spawnInterval);
	}, [isPaused, createModel, spawnQueue]);

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
