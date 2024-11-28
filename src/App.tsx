import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { OrbitControls, useProgress } from "@react-three/drei";
import { Suspense, useState, useEffect, useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { Vector3 } from "three";

import { CameraProvider, useCameraContext } from "./CameraContext";
import { Scene } from "./components/Scene";

const LoadingScreen = () => {
	const [progress, setProgress] = useState(0);
	const { progress: assetsProgress, active } = useProgress();
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		const interval = setInterval(() => {
			setProgress((prev) => (prev < 100 ? prev + 1 : 100));
		}, 20);

		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (progress === 100 && assetsProgress === 100 && !active) {
			const timer = setTimeout(() => {
				setIsLoading(false);
			}, 200); // Add a small delay to ensure smooth transition
			return () => clearTimeout(timer);
		}
	}, [progress, assetsProgress, active]);

	if (!isLoading) return null;

	const totalProgress = Math.min(
		Math.floor((progress + assetsProgress) / 2),
		100
	);

	return (
		<div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
			<div className="text-center">
				<div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
					<div
						className="h-full bg-blue-500 transition-all duration-200 ease-out"
						style={{
							width: `${totalProgress}%`,
						}}
					/>
				</div>
				<p className="mt-4 text-white font-medium">
					Loading 3D Scene... {totalProgress}%
				</p>
			</div>
		</div>
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

const Controls = () => {
	const { isEnabled } = useCameraContext();

	return (
		<OrbitControls
			enablePan={false}
			enableZoom={isEnabled}
			enableRotate={isEnabled}
			rotateSpeed={1}
			maxDistance={10}
			minPolarAngle={Math.PI / 6}
			maxPolarAngle={Math.PI / 1.95}
			mouseButtons={{
				LEFT: 0,
				MIDDLE: 1,
			}}
		/>
	);
};

const App = () => {
	const isMobile = useMemo(
		() => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
		[]
	);
	const defaultCameraPosition = isMobile
		? new Vector3(0, 4, 12)
		: new Vector3(0, 2, 8);
	const [isPageVisible, setIsPageVisible] = useState(true);

	useEffect(() => {
		// Handle visibility change
		const handleVisibilityChange = () => {
			setIsPageVisible(!document.hidden);
		};

		// Handle mobile blur/focus events
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

	return (
		<div className="w-screen h-screen">
			<ResetButton />
			<CameraProvider>
				<Suspense fallback={<LoadingScreen />}>
					<Canvas
						shadows
						camera={{ position: defaultCameraPosition, fov: 75 }}
					>
						<Controls />
						<Physics
							paused={!isPageVisible}
							timeStep={isPageVisible ? 1 / 60 : 0}
						>
							<Scene />
						</Physics>
					</Canvas>
				</Suspense>
			</CameraProvider>
		</div>
	);
};

export default App;
