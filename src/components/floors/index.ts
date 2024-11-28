import React from "react";
import type { TextureSetType } from "./TexturedFloor";

export const FLOOR_TYPES = {
	ROCKY_TERRAIN: "ROCKY_TERRAIN",
	AERIAL_SAND: "AERIAL_SAND",
	CLAY_ROOF: "CLAY_ROOF",
	DENIM: "DENIM",
	DRY_RIVERBED: "DRY_RIVERBED",
	RUBBERIZED_TRACK: "RUBBERIZED_TRACK",
	RUSTY_METAL: "RUSTY_METAL",
	WOOD_CABINET: "WOOD_CABINET",
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
