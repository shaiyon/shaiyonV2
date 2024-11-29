export interface BaseModelConfig {
	id: string;
	scale?: number;
	randomizeColor?: boolean;
	color?: string;
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

export type ModelConfig = OBJModelConfig | SVGModelConfig;
