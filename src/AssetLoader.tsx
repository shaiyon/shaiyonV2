import { useState, useEffect } from "react";
import * as THREE from "three";
import { SPHERE_TEXTURE_SETS } from "./components/SphereDropMachine";
import { FLOOR_TEXTURE_SETS } from "./components/floors/floorTextures";
import type { SelectedTextures } from "./textureTypes";

const preloadTextureSet = (
	texturePaths: Record<string, string>,
	onProgress: (progress: number) => void
) => {
	return new Promise((resolve) => {
		const textureLoader = new THREE.TextureLoader();
		const totalTextures = Object.values(texturePaths).length;
		let loadedTextures = 0;

		Object.values(texturePaths).forEach((path) => {
			textureLoader.load(path, () => {
				loadedTextures++;
				onProgress((loadedTextures / totalTextures) * 100);
				if (loadedTextures === totalTextures) {
					resolve(true);
				}
			});
		});
	});
};

export const AssetLoader = ({
	children,
	selectedTextures,
	onLoadComplete,
}: {
	children: React.ReactNode;
	selectedTextures: SelectedTextures;
	onLoadComplete: () => void;
}) => {
	const [isLoading, setIsLoading] = useState(true);
	const [progress, setProgress] = useState(0);

	useEffect(() => {
		const loadTextures = async () => {
			const floorTextures =
				FLOOR_TEXTURE_SETS[selectedTextures.floorType];
			const sphereTextures =
				SPHERE_TEXTURE_SETS[selectedTextures.sphereType];

			// Track progress for both texture sets
			let floorProgress = 0;
			let sphereProgress = 0;

			const updateTotalProgress = () => {
				setProgress((floorProgress + sphereProgress) / 2);
			};

			await Promise.all([
				preloadTextureSet(floorTextures, (progress) => {
					floorProgress = progress;
					updateTotalProgress();
				}),
				preloadTextureSet(sphereTextures, (progress) => {
					sphereProgress = progress;
					updateTotalProgress();
				}),
			]);

			setIsLoading(false);
			onLoadComplete();
		};

		loadTextures();
	}, [selectedTextures, onLoadComplete]);

	if (!isLoading) return <>{children}</>;

	return (
		<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90 backdrop-blur-sm">
			<div className="text-center">
				<div className="w-64 h-2 bg-gray-800 rounded-full overflow-hidden">
					<div
						className="h-full bg-blue-500 transition-all duration-300 ease-out"
						style={{ width: `${progress}%` }}
					/>
				</div>
				<div className="mt-4 text-white font-medium">
					Loading 3D Scene...
				</div>
				<div className="text-blue-300 text-sm mt-1">
					{Math.round(progress)}%
				</div>
			</div>
		</div>
	);
};
