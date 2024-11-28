export interface FloorProps {
	position?: [number, number, number];
	rotation?: [number, number, number];
}

export const defaultFloorProps: FloorProps = {
	position: [0, -2, 0],
	rotation: [0.1, 0, 0],
};
