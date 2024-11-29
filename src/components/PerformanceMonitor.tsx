import { useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";

export const PerformanceStats = () => {
	// This component goes INSIDE the Canvas
	const { gl } = useThree();
	const [perfInfo, setPerfInfo] = useState({
		fps: 0,
		triangles: 0,
		calls: 0,
	});

	useFrame((state) => {
		setPerfInfo({
			fps: Math.round(state.clock.getDelta() * 1000),
			triangles: gl.info.render.triangles,
			calls: gl.info.render.calls,
		});
	});

	return null; // This component doesn't render anything visual
};

// This component goes OUTSIDE the Canvas
export const PerformanceMonitor = () => {
	const [stats, setStats] = useState({
		fps: 0,
		memory: "0 MB",
	});

	const formatBytes = (bytes: number) => {
		if (bytes === 0) return "0 B";
		const k = 1024;
		const sizes = ["B", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
	};

	useEffect(() => {
		let frameCount = 0;
		let lastTime = performance.now();
		let frameId: number;

		const updateStats = () => {
			const now = performance.now();
			const delta = now - lastTime;

			if (delta >= 1000) {
				// Update FPS
				const fps = Math.round((frameCount * 1000) / delta);

				// Update Memory
				const memory = (performance as any).memory?.usedJSHeapSize;
				const memoryStr = memory ? formatBytes(memory) : "N/A";

				setStats({
					fps,
					memory: memoryStr,
				});

				frameCount = 0;
				lastTime = now;
			}

			frameCount++;
			frameId = requestAnimationFrame(updateStats);
		};

		frameId = requestAnimationFrame(updateStats);

		return () => {
			cancelAnimationFrame(frameId);
		};
	}, []);

	return (
		<div className="fixed top-4 left-4 bg-black/50 text-white px-4 py-2 rounded-lg font-mono text-sm z-50">
			<div className="flex flex-col gap-1">
				<div className="flex items-center gap-2">
					<div
						className={`w-2 h-2 rounded-full ${
							stats.fps > 30 ? "bg-green-500" : "bg-red-500"
						}`}
					/>
					<span>FPS: {stats.fps}</span>
				</div>
				<div className="flex items-center gap-2">
					<div className="w-2 h-2 rounded-full bg-blue-500" />
					<span>Memory: {stats.memory}</span>
				</div>
			</div>
		</div>
	);
};
