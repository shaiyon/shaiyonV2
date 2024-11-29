import { useState, useEffect } from "react";
import * as THREE from "three";
import { TEXTURE_SETS } from "./components/SphereDropMachine";
import { FLOOR_TEXTURE_SETS } from "./floorTextures";
import type { SelectedTextures } from "./textureTypes";

const preloadTextureSet = (texturePaths: Record<string, string>) => {
	return new Promise((resolve) => {
		const textureLoader = new THREE.TextureLoader();
		const totalTextures = Object.values(texturePaths).length;
		let loadedTextures = 0;

		Object.values(texturePaths).forEach((path) => {
			textureLoader.load(path, () => {
				loadedTextures++;
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

	useEffect(() => {
		const loadTextures = async () => {
			const floorTextures =
				FLOOR_TEXTURE_SETS[selectedTextures.floorType];
			const sphereTextures = TEXTURE_SETS[selectedTextures.sphereType];

			await Promise.all([
				preloadTextureSet(floorTextures),
				preloadTextureSet(sphereTextures),
			]);

			setIsLoading(false);
			onLoadComplete();
		};

		loadTextures();
	}, [selectedTextures, onLoadComplete]);

	if (!isLoading) return <>{children}</>;

	return (
		<div className="absolute inset-0 flex items-center justify-center bg-black">
			<div className="text-white">Loading...</div>
		</div>
	);
};
