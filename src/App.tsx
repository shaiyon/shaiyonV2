import { useState, useEffect, useRef } from "react";
import { RefreshCw, Crosshair, HelpCircle } from "lucide-react";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { OrbitControls } from "@react-three/drei";

import { useDevice } from "./utils/useDevice";
import { AssetLoader } from "./AssetLoader";
import { selectRandomTextures, type SelectedTextures } from "./textureTypes";
import { PauseProvider } from "./contexts/PauseContext";
import { CameraProvider, useCameraContext } from "./contexts/CameraContext";
import { ModeLever } from "./components/ModeLever";
import { Scene } from "./components/Scene";

interface ControlsProps {
	controlsRef: React.RefObject<OrbitControlsImpl>;
}

const Controls = ({ controlsRef }: ControlsProps) => {
	const { isEnabled } = useCameraContext();

	return (
		<OrbitControls
			ref={controlsRef}
			enablePan={true}
			enableZoom={isEnabled}
			enableRotate={isEnabled}
			rotateSpeed={1}
			minDistance={0.5}
			maxDistance={15}
			minPolarAngle={Math.PI / 6}
			maxPolarAngle={Math.PI / 1.9}
			mouseButtons={{
				LEFT: 0,
				MIDDLE: 1,
			}}
			touches={{
				ONE: 0,
				TWO: 2,
			}}
		/>
	);
};

export type DisplayMode = "work" | "personal";

interface ActionButtonsProps {
	defaultCameraPosition: [number, number, number];
	controlsRef: React.RefObject<OrbitControlsImpl>;
	onTriggerTrapDoor: () => void;
}

const ActionButtons = ({
	defaultCameraPosition,
	controlsRef,
	onTriggerTrapDoor,
}: ActionButtonsProps) => {
	const { isMobile } = useDevice();

	const handleReset = () => {
		window.location.reload();
	};

	const handleCenterCamera = () => {
		if (controlsRef.current) {
			controlsRef.current.reset();
			controlsRef.current.object.position.set(
				defaultCameraPosition[0],
				defaultCameraPosition[1],
				defaultCameraPosition[2]
			);
		}
	};

	const buttonClasses =
		"p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full shadow-lg transition-colors duration-200 z-10";

	return (
		<div
			className={`absolute ${
				isMobile ? "bottom-4" : "top-4"
			} right-4 flex flex-col gap-2`}
		>
			<button
				onClick={handleReset}
				className={buttonClasses}
				aria-label="Reset Scene"
			>
				<RefreshCw size={20} />
			</button>
			<button
				onClick={handleCenterCamera}
				className={buttonClasses}
				aria-label="Center Camera"
			>
				<Crosshair size={20} />
			</button>
		</div>
	);
};

export const App = () => {
	const controlsRef = useRef<OrbitControlsImpl>(null);
	const { isMobile } = useDevice();

	const defaultCameraPosition = isMobile ? [0, 4, 14] : [0, 2, 8];
	const [isPageVisible, setIsPageVisible] = useState(true);
	const [selectedTextures] = useState<SelectedTextures>(
		selectRandomTextures()
	);
	const [isSceneReady, setIsSceneReady] = useState(false);
	const [mode, setMode] = useState<DisplayMode>(() => {
		return window.location.pathname === "/me" ? "personal" : "work";
	});
	const [isTrapDoorTriggered, setIsTrapDoorTriggered] = useState(false);

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

	const handleTriggerTrapDoor = () => {
		setIsTrapDoorTriggered(true);
		setMode((prevMode) => (prevMode === "work" ? "personal" : "work"));
		setTimeout(() => {
			setIsTrapDoorTriggered(false);
		}, 3000);
	};

	return (
		<div className="w-screen h-screen select-none touch-none">
			<ModeLever
				mode={mode}
				onToggle={(newMode: DisplayMode) => {
					setMode(newMode);
					setIsTrapDoorTriggered(true);
					setTimeout(() => {
						setIsTrapDoorTriggered(false);
					}, 3000);
				}}
			/>
			<ActionButtons
				defaultCameraPosition={
					defaultCameraPosition as [number, number, number]
				}
				controlsRef={controlsRef}
				onTriggerTrapDoor={handleTriggerTrapDoor}
			/>
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
								<Controls controlsRef={controlsRef} />
								<Physics
									paused={!isPageVisible}
									timeStep={isPageVisible ? 1 / 60 : 0}
								>
									<Scene
										selectedTextures={selectedTextures}
										isTrapDoorTriggered={
											isTrapDoorTriggered
										}
										mode={mode}
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
