import { useState, useEffect, useMemo, useCallback, Suspense } from "react";
import { OBJLoader, SVGLoader } from "three-stdlib";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import {
	Shape,
	ExtrudeGeometry,
	Mesh,
	MeshStandardMaterial,
	Group,
	Color,
} from "three";

interface BaseModelConfig {
	id: string;
	scale?: number;
	randomizeColor?: boolean;
}

interface OBJModelConfig extends BaseModelConfig {
	type: "obj";
	path: string;
}

interface SVGModelConfig extends BaseModelConfig {
	type: "svg";
	svgPath: string;
	depth?: number;
	preserveColors?: boolean;
}

type ModelConfig = OBJModelConfig | SVGModelConfig;

interface DroppedModel {
	id: number;
	configId: string;
	position: [number, number, number];
	rotation: [number, number, number];
	color?: string;
	hasSpawned: boolean;
}

const MODEL_CONFIGS: ModelConfig[] = [
	{
		id: "california",
		type: "obj",
		path: "/models/california.obj",
		scale: 0.4,
		randomizeColor: true,
	},
	{
		id: "newyork",
		type: "obj",
		path: "/models/newyork.obj",
		scale: 0.4,
		randomizeColor: true,
	},
	{
		id: "python",
		type: "svg",
		svgPath: "/models/python.svg",
		scale: 0.005,
		depth: 20,
		preserveColors: false,
		randomizeColor: false,
	},
	{
		id: "gitlab",
		type: "svg",
		svgPath: "/models/gitlab.svg",
		scale: 0.005,
		depth: 10,
		preserveColors: true,
		randomizeColor: false,
	},
	{
		id: "aws",
		type: "svg",
		svgPath: "/models/aws.svg",
		scale: 0.004,
		depth: 25,
		preserveColors: true,
		randomizeColor: false,
	},
	{
		id: "gcp",
		type: "svg",
		svgPath: "/models/gcp.svg",
		scale: 0.0006,
		depth: 100,
		preserveColors: true,
		randomizeColor: false,
	},
	{
		id: "react",
		type: "svg",
		svgPath: "/models/react.svg",
		scale: 0.04,
		depth: 2,
		preserveColors: true,
		randomizeColor: false,
	},
	{
		id: "terraform",
		type: "svg",
		svgPath: "/models/terraform.svg",
		scale: 0.05,
		depth: 2,
		preserveColors: true,
		randomizeColor: false,
	},
	{
		id: "typescript",
		type: "svg",
		svgPath: "/models/typescript.svg",
		scale: 0.0016,
		depth: 50,
		preserveColors: true,
		randomizeColor: false,
	},
];

const getRandomColor = () => {
	const h = Math.random();
	const s = 0.3 + Math.random() * 0.3;
	const l = 0.4 + Math.random() * 0.2;
	return `hsl(${h * 360}, ${s * 100}%, ${l * 100}%)`;
};

const applyColorToModel = (
	model: THREE.Object3D,
	color: string,
	config: ModelConfig
) => {
	const adjustedColor = getPlatformAdjustedColor(color, config);

	const material = new MeshStandardMaterial({
		color: adjustedColor,
		metalness: 0.1,
		roughness: 0.8,
	});

	model.traverse((child) => {
		if (child instanceof Mesh) {
			child.material = material;
		}
	});
	return model;
};

const getPlatformAdjustedColor = (
	color: string | Color,
	config: ModelConfig
) => {
	const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

	// Convert Color object to string if needed
	const colorString =
		color instanceof Color ? `#${color.getHexString()}` : color;

	if (isMobile && config.preserveColors) {
		// Ensure colors are properly formatted for mobile
		return colorString.startsWith("#")
			? colorString
			: `#${new Color(colorString).getHexString()}`;
	}
	return colorString;
};

const createExtrudedGeometry = (
	svgData: any,
	config: SVGModelConfig,
	depth: number = 0.2
) => {
	const group = new Group();

	// Extract gradients from defs
	const gradients = new Map();
	if (svgData.xml) {
		const parser = new DOMParser();
		const xmlDoc = parser.parseFromString(svgData.xml, "text/xml");
		const defs = xmlDoc.getElementsByTagName("defs")[0];
		if (defs) {
			const linearGradients = defs.getElementsByTagName("linearGradient");
			for (let i = 0; i < linearGradients.length; i++) {
				const gradient = linearGradients[i];
				const id = gradient.getAttribute("id");
				const stops = gradient.getElementsByTagName("stop");
				const colors = [];
				for (let j = 0; j < stops.length; j++) {
					const color = stops[j].getAttribute("stop-color");
					if (color) colors.push(color);
				}
				if (id && colors.length > 0) {
					gradients.set(id, colors[0]); // Use first color of gradient as fallback
				}
			}
		}
	}

	svgData.paths.forEach((path: any) => {
		const svgStyle = path.userData?.style || {};
		let svgFill = svgStyle.fill;

		// Handle gradient references
		if (svgFill && svgFill.startsWith("url(#")) {
			const gradientId = svgFill.slice(5, -1); // Remove url(# and )
			const gradientColor = gradients.get(gradientId);
			if (gradientColor) {
				svgFill = gradientColor;
			}
		}

		let pathColor: Color;
		if (config.preserveColors && svgFill && svgFill !== "none") {
			try {
				if (svgFill.startsWith("#")) {
					pathColor = new Color(svgFill);
				} else if (svgFill.startsWith("rgb")) {
					const rgb = svgFill.match(/\d+/g)?.map(Number);
					pathColor = new Color(
						`rgb(${rgb?.[0]},${rgb?.[1]},${rgb?.[2]})`
					);
				} else {
					pathColor = new Color(svgFill);
				}
			} catch (error) {
				// Fallback colors for Python logo specifically
				if (config.id === "python") {
					pathColor = new Color("#366994"); // Main python blue
				} else {
					pathColor = new Color("#808080"); // Default gray
				}
			}
		} else {
			switch (config.id) {
				case "python":
					// Check if it's the first or second path to determine color
					const isFirstPath = path.userData.node
						.getAttribute("d")
						.startsWith("M126.915866");
					pathColor = isFirstPath
						? new Color("#387EB8") // Python blue for first path
						: new Color("#FFE052"); // Python yellow for second path
					break;
				case "react":
					pathColor = new Color("#61DAFB"); // React blue
					break;
				default:
					pathColor = new Color("#808080"); // Default gray
			}
		}

		const shapes = SVGLoader.createShapes(path);
		shapes.forEach((shape: Shape) => {
			const geometry = new ExtrudeGeometry(shape, {
				depth: depth,
				bevelEnabled: true,
				bevelThickness: depth * 0.1,
				bevelSize: depth * 0.1,
				bevelSegments: 3,
			});

			const material = new MeshStandardMaterial({
				color: pathColor,
				metalness: 0.05, // Reduced metalness
				roughness: 0.9, // Increased roughness
				side: THREE.DoubleSide, // Ensure both sides are rendered
				flatShading: true, // Reduce visual artifacts
			});

			const mesh = new Mesh(geometry, material);
			// Add a tiny offset to each subsequent mesh to prevent z-fighting
			mesh.position.z += group.children.length * 0.001;
			group.add(mesh);
		});
	});

	return group;
};

const Model: React.FC<{
	config: ModelConfig;
	position: [number, number, number];
	rotation: [number, number, number];
	color?: string;
}> = ({ config, position, rotation, color }) => {
	const objLoader = useMemo(() => new OBJLoader(), []);
	const svgLoader = useMemo(() => new SVGLoader(), []);

	const [model, setModel] = useState<THREE.Object3D | null>(null);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadModel = async () => {
			try {
				if (config.type === "obj") {
					const loadedModel = await objLoader.loadAsync(config.path);
					if (color && config.randomizeColor) {
						applyColorToModel(loadedModel, color, config);
					}
					setModel(loadedModel);
				} else if (config.type === "svg") {
					const svgData = await svgLoader.loadAsync(config.svgPath);
					const extrudedModel = createExtrudedGeometry(
						svgData,
						config as SVGModelConfig,
						(config as SVGModelConfig).depth
					);
					if (color && config.randomizeColor) {
						applyColorToModel(extrudedModel, color, config);
					}
					setModel(extrudedModel);
				}
			} catch (err) {
				console.error(`Error loading model ${config.id}:`, err);
				setError((err as Error).message);
			}
		};

		loadModel();
	}, [config, color, objLoader, svgLoader]);

	if (error) return null;
	if (!model) return null;

	return (
		<RigidBody
			position={position}
			rotation={rotation}
			colliders="hull"
			restitution={0.3}
			friction={0.8}
		>
			<primitive
				object={model}
				scale={config.scale ?? 1}
				receiveShadow
				castShadow
			/>
		</RigidBody>
	);
};

export const ModelDropMachine: React.FC = () => {
	const [droppedModels, setDroppedModels] = useState<DroppedModel[]>([]);
	const [droppedConfigs, setDroppedConfigs] = useState<string[]>([]);

	const spawnModel = useCallback(() => {
		setDroppedModels((prev) => {
			const unspawnedConfigs = MODEL_CONFIGS.filter(
				(config) => !prev.some((model) => model.configId === config.id)
			);

			if (unspawnedConfigs.length === 0) return prev;

			const randomConfig =
				unspawnedConfigs[
					Math.floor(Math.random() * unspawnedConfigs.length)
				];
			const randomX = Math.random() * 6 - 3;
			const randomZ = Math.random() * 4 - 2;
			const randomRotX = Math.random() * Math.PI;
			const randomRotY = Math.random() * Math.PI;
			const randomRotZ = Math.random() * Math.PI;

			const newModel: DroppedModel = {
				id: Date.now(),
				configId: randomConfig.id,
				position: [randomX, 10, randomZ],
				rotation: [randomRotX, randomRotY, randomRotZ],
				color: randomConfig.randomizeColor
					? getRandomColor()
					: undefined,
				hasSpawned: true,
			};

			return [...prev, newModel];
		});
	}, []);

	const checkFallenModels = useCallback(() => {
		setDroppedModels((prev) => {
			// Find models that have fallen below threshold
			const fallenModels = prev.filter(
				(model) => model.position[1] <= -10
			);

			// If no fallen models, return unchanged state
			if (fallenModels.length === 0) return prev;

			// Add fallen model configs to droppedConfigs
			setDroppedConfigs((current) => {
				const newDroppedConfigs = fallenModels
					.map((model) => model.configId)
					.filter((configId) => !current.includes(configId));
				return [...current, ...newDroppedConfigs];
			});

			// Remove fallen models from droppedModels
			return prev.filter((model) => model.position[1] > -10);
		});
	}, []);

	const respawnDroppedModels = useCallback(() => {
		if (droppedConfigs.length === 0) return;

		setDroppedModels((prev) => {
			const newModels = droppedConfigs.map((configId) => {
				const randomX = Math.random() * 6 - 3;
				const randomZ = Math.random() * 4 - 2;
				const randomRotX = Math.random() * Math.PI;
				const randomRotY = Math.random() * Math.PI;
				const randomRotZ = Math.random() * Math.PI;

				const config = MODEL_CONFIGS.find((c) => c.id === configId);

				return {
					id: Date.now() + Math.random(),
					configId: configId,
					position: [randomX, 10, randomZ],
					rotation: [randomRotX, randomRotY, randomRotZ],
					color: config?.randomizeColor
						? getRandomColor()
						: undefined,
					hasSpawned: true,
				};
			});

			return [...prev, ...newModels];
		});
	}, [droppedConfigs]);

	useEffect(() => {
		const shouldContinueSpawning =
			droppedModels.length < MODEL_CONFIGS.length;

		let dropInterval: NodeJS.Timeout | null = null;
		if (shouldContinueSpawning) {
			dropInterval = setInterval(spawnModel, 2000);
		}

		// Check frequently for fallen models
		const checkInterval = setInterval(checkFallenModels, 100);

		// Respawn dropped models every second
		const respawnInterval = setInterval(respawnDroppedModels, 1000);

		return () => {
			if (dropInterval) clearInterval(dropInterval);
			clearInterval(checkInterval);
			clearInterval(respawnInterval);
		};
	}, [
		droppedModels.length,
		spawnModel,
		checkFallenModels,
		respawnDroppedModels,
	]);

	return (
		<Suspense fallback={null}>
			{droppedModels.map((model) => {
				const config = MODEL_CONFIGS.find(
					(c) => c.id === model.configId
				);
				if (!config) return null;

				return (
					<Model
						key={model.id}
						config={config}
						position={model.position}
						rotation={model.rotation}
						color={model.color}
					/>
				);
			})}
		</Suspense>
	);
};
