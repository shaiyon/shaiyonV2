import { useRef, useState, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Group } from "three";
import { RigidBody } from "@react-three/rapier";
import { SVGLoader } from "three-stdlib";
import {
	Shape,
	ExtrudeGeometry,
	Mesh,
	MeshStandardMaterial,
	Color,
} from "three";

interface SocialIconConfig {
	id: string;
	svgPath: string;
	url: string;
	scale: number;
	position: [number, number, number];
}

const SOCIAL_CONFIGS: SocialIconConfig[] = [
	{
		id: "linkedin",
		svgPath: "/src/assets/linkedin.svg",
		url: "https://linkedin.com/in/shaiyon",
		scale: 0.001,
		position: [1, 0.85, 0],
	},
	{
		id: "github",
		svgPath: "/src/assets/github.svg",
		url: "https://github.com/shaiyon",
		scale: 0.0004,
		position: [-1, 0.875, 0],
	},
];

const createExtrudedGeometry = (svgData: any, depth: number = 50) => {
	const group = new Group();

	svgData.paths.forEach((path: any) => {
		const shapes = path.toShapes(true);

		shapes.forEach((shape: Shape) => {
			const geometry = new ExtrudeGeometry(shape, {
				depth: depth,
				bevelEnabled: true,
				bevelThickness: depth * 0.1,
				bevelSize: depth * 0.1,
				bevelSegments: 3,
			});

			const material = new MeshStandardMaterial({
				color: new Color(0x000000),
				metalness: 0.1,
				roughness: 0.8,
			});

			const mesh = new Mesh(geometry, material);
			group.add(mesh);
		});
	});

	return group;
};

interface SocialIconProps {
	config: SocialIconConfig;
}

const SocialIcon: React.FC<SocialIconProps> = ({ config }) => {
	const groupRef = useRef<Group>(null);
	const [hovered, setHovered] = useState(false);
	const [model, setModel] = useState<THREE.Object3D | null>(null);
	const svgLoader = useMemo(() => new SVGLoader(), []);

	// Load SVG model
	useEffect(() => {
		const loadModel = async () => {
			try {
				const svgData = await svgLoader.loadAsync(config.svgPath);
				const extrudedModel = createExtrudedGeometry(svgData);
				setModel(extrudedModel);
			} catch (err) {
				console.error(`Error loading model ${config.id}:`, err);
			}
		};
		loadModel();
	}, [config.svgPath, config.id, svgLoader]);

	// Animate hover effect
	useFrame((state) => {
		if (groupRef.current) {
			// Floating animation
			groupRef.current.position.y =
				config.position[1] +
				Math.sin(state.clock.elapsedTime * 0.5) * 0.1;

			// Scale animation on hover
			const targetScale = hovered ? 1.1 : 1;
			groupRef.current.scale.lerp(
				{ x: targetScale, y: targetScale, z: targetScale } as any,
				0.1
			);

			// Update material color on hover
			if (model) {
				model.traverse((child) => {
					if (child instanceof Mesh) {
						const material = child.material as MeshStandardMaterial;
						const targetColor = new Color(
							hovered ? 0x4a9eff : 0x000000
						);
						material.color.lerp(targetColor, 0.1);
					}
				});
			}
		}
	});

	if (!model) return null;

	return (
		<group
			position={config.position}
			ref={groupRef}
			onClick={() => window.open(config.url, "_blank")}
			onPointerOver={() => {
				document.body.style.cursor = "pointer";
				setHovered(true);
			}}
			onPointerOut={() => {
				document.body.style.cursor = "auto";
				setHovered(false);
			}}
		>
			<primitive
				object={model}
				scale={config.scale}
				rotation={[Math.PI, 0, 0]}
				receiveShadow
				castShadow
			/>
		</group>
	);
};

export const SocialLinks: React.FC = () => {
	return (
		<>
			<RigidBody type="fixed">
				{SOCIAL_CONFIGS.map((config) => (
					<SocialIcon key={config.id} config={config} />
				))}
			</RigidBody>
		</>
	);
};
