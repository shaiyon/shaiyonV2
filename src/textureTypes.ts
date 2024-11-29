import { FLOOR_TYPES, type FloorType } from "./components/floors";

export type SphereTextureType = "RUBBER" | "DENIM" | "SNOW";

export interface SelectedTextures {
	floorType: FloorType;
	sphereType: SphereTextureType;
}

export const getRandomFloorType = (): FloorType => {
	const types = Object.keys(FLOOR_TYPES) as FloorType[];
	const randomIndex = Math.floor(Math.random() * types.length);
	return types[randomIndex];
};

export const getRandomSphereTexture = (): SphereTextureType => {
	const types: SphereTextureType[] = ["RUBBER", "DENIM", "SNOW"];
	const randomIndex = Math.floor(Math.random() * types.length);
	return types[randomIndex];
};

export const selectRandomTextures = (): SelectedTextures => ({
	floorType: getRandomFloorType(),
	sphereType: getRandomSphereTexture(),
});
