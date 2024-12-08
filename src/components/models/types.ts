export interface BaseModelConfig {
	id: string;
	scale: number;
	randomizeColor?: boolean;
	color?: string;
	collider?: "cuboid" | "hull" | "ball";
	hoverText?: string;
}

export interface OBJModelConfig extends BaseModelConfig {
	type: "obj";
	path: string;
}

export interface SVGModelConfig extends BaseModelConfig {
	type: "svg";
	svgPath: string;
	depth?: number;
	preserveColors?: boolean;
}

export interface GLBModelConfig extends BaseModelConfig {
	type: "glb";
	glbPath: string;
	preserveColors?: boolean;
}

export interface TextModelConfig extends BaseModelConfig {
	type: "text";
	text: string;
}

export type ModelConfig =
	| OBJModelConfig
	| SVGModelConfig
	| GLBModelConfig
	| TextModelConfig;
