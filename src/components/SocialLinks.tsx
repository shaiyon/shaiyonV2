import { useRef, useState, useMemo, useEffect } from "react";
import { Group, Vector3, CircleGeometry, MeshBasicMaterial } from "three";
import { useFrame } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { SVGLoader } from "three-stdlib";
import {
	Shape,
	ExtrudeGeometry,
	Mesh,
	MeshStandardMaterial,
	Color,
	Object3D,
	Box3,
	Vector3 as ThreeVector3,
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
		svgPath: "/linkedin.svg",
		url: "https://linkedin.com/in/shaiyon",
		scale: 0.001,
		position: [1, 0.4, 0],
	},
	{
		id: "github",
		svgPath: "/github.svg",
		url: "https://github.com/shaiyon",
		scale: 0.0004,
		position: [-1, 0.4, 0],
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
				transparent: true,
				opacity: 1,
			});
			const mesh = new Mesh(geometry, material);
			group.add(mesh);
		});
	});
	return group;
};

interface SocialIconProps {
	config: SocialIconConfig;
	isTrapDoorTriggered: boolean;
}

const SocialIcon: React.FC<SocialIconProps> = ({
	config,
	isTrapDoorTriggered,
}) => {
	const groupRef = useRef<Group>(null);
	const rigidBodyRef = useRef<RigidBody>(null);
	const hitboxRef = useRef<Mesh>(null);
	const [hovered, setHovered] = useState(false);
	const [opacity, setOpacity] = useState(1);
	const [isResetting, setIsResetting] = useState(false);
	const previousTriggerState = useRef(isTrapDoorTriggered);
	const fadeAnimationRef = useRef<number>();
	const [model, setModel] = useState<Object3D | null>(null);
	const svgLoader = useMemo(() => new SVGLoader(), []);
	const [modelBounds, setModelBounds] = useState<{
		size: ThreeVector3;
		center: ThreeVector3;
	} | null>(null);

	useEffect(() => {
		const loadModel = async () => {
			try {
				const svgData = await svgLoader.loadAsync(config.svgPath);
				const extrudedModel = createExtrudedGeometry(svgData);

				extrudedModel.traverse((child) => {
					if (child instanceof Mesh) {
						const material = child.material as MeshStandardMaterial;
						material.transparent = true;
						material.opacity = opacity;
					}
				});

				const box = new Box3().setFromObject(extrudedModel);
				const size = new ThreeVector3();
				const center = new ThreeVector3();
				box.getSize(size);
				box.getCenter(center);
				setModelBounds({ size, center });

				setModel(extrudedModel);
			} catch (err) {
				console.error(`Error loading model ${config.id}:`, err);
			}
		};
		loadModel();
	}, [config.svgPath, config.id, svgLoader, opacity]);

	useFrame((state) => {
		if (groupRef.current && !isTrapDoorTriggered) {
			groupRef.current.position.y =
				config.position[1] +
				Math.sin(state.clock.elapsedTime * 0.5) * 0.1;

			const targetScale = hovered ? 1.1 : 1;
			groupRef.current.scale.lerp(
				{ x: targetScale, y: targetScale, z: targetScale } as Vector3,
				0.1
			);

			if (model) {
				model.traverse((child) => {
					if (child instanceof Mesh) {
						const material = child.material as MeshStandardMaterial;
						const targetColor = new Color(
							hovered ? 0x4a9eff : 0x000000
						);
						material.color.lerp(targetColor, 0.1);
						material.opacity = opacity;
					}
				});
			}
		}
	});

	useEffect(() => {
		if (previousTriggerState.current && !isTrapDoorTriggered) {
			setIsResetting(true);

			setTimeout(() => {
				if (rigidBodyRef.current) {
					setOpacity(0);

					rigidBodyRef.current.setTranslation(
						{
							x: config.position[0],
							y: config.position[1],
							z: config.position[2],
						},
						true
					);

					rigidBodyRef.current.setRotation(
						{ x: 0, y: 0, z: 0, w: 1 },
						true
					);

					rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
					rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);

					let startTime = Date.now();
					const fadeInDuration = 2000;

					const animate = () => {
						const elapsed = Date.now() - startTime;
						const progress = Math.min(elapsed / fadeInDuration, 1);

						setOpacity(progress);

						if (progress < 1) {
							fadeAnimationRef.current =
								requestAnimationFrame(animate);
						} else {
							setIsResetting(false);
						}
					};

					fadeAnimationRef.current = requestAnimationFrame(animate);
				}
			}, 500);
		}

		previousTriggerState.current = isTrapDoorTriggered;

		return () => {
			if (fadeAnimationRef.current) {
				cancelAnimationFrame(fadeAnimationRef.current);
			}
		};
	}, [isTrapDoorTriggered, config.position]);

	if (!model || !modelBounds) return null;

	const hitboxGeometry = new CircleGeometry(1, 30);
	const hitboxMaterial = new MeshBasicMaterial({ visible: false });

	return (
		<RigidBody
			ref={rigidBodyRef}
			type={isTrapDoorTriggered ? "dynamic" : "fixed"}
			colliders="cuboid"
			restitution={0.2}
			friction={0.5}
			mass={1}
			position={[
				config.position[0],
				config.position[1],
				config.position[2],
			]}
		>
			<group ref={groupRef}>
				<primitive
					object={model}
					scale={config.scale}
					rotation={[Math.PI, 0, 0]}
					receiveShadow
					castShadow
				/>
				<mesh
					ref={hitboxRef}
					geometry={hitboxGeometry}
					material={hitboxMaterial}
					scale={0.4}
					onClick={() => window.open(config.url, "_blank")}
					onPointerOver={() => {
						document.body.style.cursor = "pointer";
						setHovered(true);
					}}
					onPointerOut={() => {
						document.body.style.cursor = "auto";
						setHovered(false);
					}}
				/>
			</group>
		</RigidBody>
	);
};

interface SocialLinksProps {
	isTrapDoorTriggered: boolean;
}

export const SocialLinks: React.FC<SocialLinksProps> = ({
	isTrapDoorTriggered,
}) => {
	return (
		<>
			{SOCIAL_CONFIGS.map((config) => (
				<SocialIcon
					key={config.id}
					config={config}
					isTrapDoorTriggered={isTrapDoorTriggered}
				/>
			))}
		</>
	);
};
