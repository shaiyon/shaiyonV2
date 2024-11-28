import React from "react";
import type { TextureSetType } from "./TexturedFloor";

export const FLOOR_TYPES = {
	ROCKY_TERRAIN: "ROCKY_TERRAIN",
	CLAY_ROOF: "CLAY_ROOF",
	DRY_RIVERBED: "DRY_RIVERBED",
	WOOD_CABINET: "WOOD_CABINET",
	CONCRETE_LAYERS: "CONCRETE_LAYERS",
} as const;

export type FloorType = keyof typeof FLOOR_TYPES;

export const loadFloor = async (type: FloorType) => {
	const TexturedFloor = (await import("./TexturedFloor")).default;
	return (props: any) =>
		React.createElement(TexturedFloor, {
			...props,
			textureSet: type as TextureSetType,
		});
};
