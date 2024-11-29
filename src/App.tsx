import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { OrbitControls } from "@react-three/drei";
import { Suspense, useState, useEffect, useMemo } from "react";
import { RefreshCw } from "lucide-react";

import { CameraProvider, useCameraContext } from "./contexts/CameraContext";
import { PauseProvider } from "./contexts/PauseContext";
import { Scene } from "./components/Scene";
import { AssetLoader } from "./AssetLoader";
import { selectRandomTextures, type SelectedTextures } from "./textureTypes";

const Controls = () => {
	const { isEnabled } = useCameraContext();
	const isMobile = useMemo(
		() => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
		[]
	);

	return (
		<OrbitControls
			enablePan={false}
			enableZoom={isEnabled}
			enableRotate={isEnabled}
			rotateSpeed={1}
			maxDistance={isMobile ? 15 : 10}
			minPolarAngle={Math.PI / 6}
			maxPolarAngle={Math.PI / 1.95}
			mouseButtons={{
				LEFT: 0,
				MIDDLE: 1,
			}}
		/>
	);
};

const ResetButton = () => {
	const handleReset = () => {
		window.location.reload();
	};

	return (
		<button
			onClick={handleReset}
			className="absolute top-4 right-4 p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-colors duration-200 z-10"
			aria-label="Reset Scene"
		>
			<RefreshCw size={24} />
		</button>
	);
};

export const App = () => {
	const isMobile = useMemo(
		() => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
		[]
	);
	const defaultCameraPosition = isMobile ? [0, 4, 14] : [0, 2, 8];
	const [isPageVisible, setIsPageVisible] = useState(true);
	const [selectedTextures] = useState<SelectedTextures>(
		selectRandomTextures()
	);
	const [isSceneReady, setIsSceneReady] = useState(false);

	useEffect(() => {
		const handleVisibilityChange = () => {
			setIsPageVisible(!document.hidden);
		};

		const handleBlur = () => setIsPageVisible(false);
		const handleFocus = () => setIsPageVisible(true);

		document.addEventListener("visibilitychange", handleVisibilityChange);
		window.addEventListener("blur", handleBlur);
		window.addEventListener("focus", handleFocus);

		return () => {
			document.removeEventListener(
				"visibilitychange",
				handleVisibilityChange
			);
			window.removeEventListener("blur", handleBlur);
			window.removeEventListener("focus", handleFocus);
		};
	}, []);

	const handleLoadComplete = () => {
		setIsSceneReady(true);
	};

	return (
		<div className="w-screen h-screen">
			<ResetButton />
			<CameraProvider>
				<PauseProvider isPaused={!isPageVisible}>
					<AssetLoader
						selectedTextures={selectedTextures}
						onLoadComplete={handleLoadComplete}
					>
						{isSceneReady ? (
							<Canvas
								shadows
								camera={{
									position: defaultCameraPosition,
									fov: 75,
								}}
							>
								<Controls />
								<Physics
									paused={!isPageVisible}
									timeStep={isPageVisible ? 1 / 60 : 0}
								>
									<Scene
										selectedTextures={selectedTextures}
									/>
								</Physics>
							</Canvas>
						) : null}
					</AssetLoader>
				</PauseProvider>
			</CameraProvider>
		</div>
	);
};
