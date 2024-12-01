import {
	Group,
	Mesh,
	MeshStandardMaterial,
	ExtrudeGeometry,
	Shape,
	Color,
} from "three";
import * as THREE from "three";
import { SVGLoader } from "three-stdlib";
import { ModelConfig, SVGModelConfig } from "./types";

export const applyColorToModel = (
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

export const createExtrudedGeometry = (
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
					gradients.set(id, colors[0]);
				}
			}
		}

		// Handle text elements if they exist
		const textElements = xmlDoc.getElementsByTagName("text");
		if (textElements.length > 0) {
			Array.from(textElements).forEach((textElement) => {
				const text = textElement.textContent || "";
				const fontSize = parseFloat(
					textElement.getAttribute("font-size") || "32"
				);
				const x = parseFloat(textElement.getAttribute("x") || "0");
				const y = parseFloat(textElement.getAttribute("y") || "0");

				// Create a temporary canvas to measure and create path from text
				const canvas = document.createElement("canvas");
				const context = canvas.getContext("2d")!;
				const fontFamily =
					textElement.getAttribute("font-family") || "Arial";
				context.font = `${fontSize}px ${fontFamily}`;

				// Measure text
				const metrics = context.measureText(text);
				const width = metrics.width;
				const height = fontSize;

				// Create an SVG path for the text
				const textPath = {
					type: "path",
					userData: textElement.userData || {},
					// Preserve the original style information
					style: {
						fill:
							textElement.getAttribute("fill") || "currentColor",
						stroke: textElement.getAttribute("stroke"),
						strokeWidth: textElement.getAttribute("stroke-width"),
					},
				};

				// Add to existing paths array
				svgData.paths.push(textPath);
			});
		}
	}

	svgData.paths.forEach((path: any) => {
		const svgStyle = path.userData?.style || {};
		let svgFill = svgStyle.fill;

		// Special handling for Python logo
		let pathColor: Color;
		if (config.id === "python") {
			const isFirstPath = path.userData.node
				?.getAttribute("d")
				?.startsWith("M126.915866");
			pathColor = isFirstPath
				? new Color("#387EB8")
				: new Color("#FFE052");
		} else if (config.id === "docker") {
			pathColor = new Color("#2396ED");
		} else {
			// Handle class-based colors by checking node attributes
			const node = path.userData?.node;
			if (node) {
				const className = node.getAttribute("class");
				if (className && node.ownerDocument) {
					const styles =
						node.ownerDocument.getElementsByTagName("style");
					for (let i = 0; i < styles.length; i++) {
						const styleContent = styles[i].textContent || "";
						const classMatch = new RegExp(
							`\\.${className}{[^}]*fill:\\s*(#[A-Fa-f0-9]{6}|#[A-Fa-f0-9]{3}|[a-zA-Z]+)`,
							"i"
						);
						const match = styleContent.match(classMatch);
						if (match && match[1]) {
							svgFill = match[1];
							break;
						}
					}
				}
			}

			// Handle gradient references
			if (svgFill && svgFill.startsWith("url(#")) {
				const gradientId = svgFill.slice(5, -1);
				const gradientColor = gradients.get(gradientId);
				if (gradientColor) {
					svgFill = gradientColor;
				}
			}

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
					pathColor = new Color("#808080");
				}
			} else {
				pathColor = new Color("#808080");
			}
		}

		const shapes = SVGLoader.createShapes(path);
		shapes.forEach((shape: Shape) => {
			const geometry = new ExtrudeGeometry(shape, {
				depth: depth,
				bevelEnabled: false,
			});
			const material = new MeshStandardMaterial({
				color: pathColor,
				metalness: 0.05,
				roughness: 0.9,
				side: THREE.FrontSide,
				flatShading: true,
			});

			const mesh = new Mesh(geometry, material);
			mesh.position.z += group.children.length * 0.1;
			group.add(mesh);
		});
	});

	return group;
};

export const getPlatformAdjustedColor = (
	color: string | Color,
	config: ModelConfig
) => {
	return color instanceof Color
		? `#${color.getHexString()}`
		: color.startsWith("#")
		? color
		: `#${new Color(color).getHexString()}`;
};
