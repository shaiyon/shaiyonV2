import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { OrbitControls, useProgress } from "@react-three/drei";
import { Suspense, useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";

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

export default function App() {
	return (
		<div className="w-screen h-screen">
			<ResetButton />
			<Suspense fallback={<LoadingScreen />}>
				<Canvas shadows camera={{ position: [0, 2, 8], fov: 75 }}>
					<OrbitControls
						enablePan={false}
						enableZoom={true}
						enableRotate={true}
						panSpeed={0.5}
						rotateSpeed={0.5}
						maxDistance={10}
						// Restrict vertical rotation (in radians)
						minPolarAngle={Math.PI / 6} // Can't look up more than 45° from horizontal
						maxPolarAngle={Math.PI / 1.95} // Can't look down below horizontal
						mouseButtons={{
							LEFT: 0, // Rotate
							MIDDLE: 1, // Zoom
							// RIGHT: 0, // Pan
						}}
					/>
					<Physics>
						<Scene />
					</Physics>
				</Canvas>
			</Suspense>
		</div>
	);
}
