import { useTexture } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import * as THREE from "three";
import type { FloorProps } from "./types";

const TEXTURE_SETS = {
	ROCKY_TERRAIN: {
		diff: "/textures/rocky_terrain_diff_1k.jpg",
		disp: "/textures/rocky_terrain_disp_1k.png",
		normal: "/textures/rocky_terrain_nor_gl_1k.png",
		rough: "/textures/rocky_terrain_rough_1k.png",
	},
	CLAY_ROOF: {
		diff: "/textures/clay_roof_tiles_02_diff_1k.jpg",
		disp: "/textures/clay_roof_tiles_02_disp_1k.png",
		normal: "/textures/clay_roof_tiles_02_nor_gl_1k.png",
		rough: "/textures/clay_roof_tiles_02_rough_1k.png",
	},
	DENIM: {
		diff: "/textures/denim_fabric_diff_1k.jpg",
		disp: "/textures/denim_fabric_disp_1k.png",
		normal: "/textures/denim_fabric_nor_gl_1k.png",
		rough: "/textures/denim_fabric_rough_1k.jpg",
	},
	DRY_RIVERBED: {
		diff: "/textures/dry_riverbed_rock_diff_1k.jpg",
		disp: "/textures/dry_riverbed_rock_disp_1k.png",
		normal: "/textures/dry_riverbed_rock_nor_gl_1k.png",
		rough: "/textures/dry_riverbed_rock_rough_1k.png",
	},
	RUBBERIZED_TRACK: {
		diff: "/textures/rubberized_track_diff_1k.jpg",
		disp: "/textures/rubberized_track_disp_1k.png",
		normal: "/textures/rubberized_track_nor_gl_1k.png",
		rough: "/textures/rubberized_track_rough_1k.png",
	},
	WOOD_CABINET: {
		diff: "/textures/wood_cabinet_worn_long_diff_1k.jpg",
		disp: "/textures/wood_cabinet_worn_long_disp_1k.png",
		normal: "/textures/wood_cabinet_worn_long_nor_gl_1k.png",
		rough: "/textures/wood_cabinet_worn_long_rough_1k.png",
	},
	CONCRETE_LAYERS: {
		diff: "/textures/concrete_layers_diff_1k.jpg",
		disp: "/textures/concrete_layers_disp_1k.png",
		normal: "/textures/concrete_layers_nor_gl_1k.png",
		rough: "/textures/concrete_layers_rough_1k.png",
	},
} as const;

export type TextureSetType = keyof typeof TEXTURE_SETS;

interface TexturedFloorProps extends FloorProps {
	textureSet: TextureSetType;
}

const TexturedFloor: React.FC<TexturedFloorProps> = ({
	position = [0, -2, 0],
	rotation = [0.1, 0, 0],
	textureSet,
}) => {
	const texturePaths = TEXTURE_SETS[textureSet];

	const textures = useTexture({
		map: texturePaths.diff,
		displacementMap: texturePaths.disp,
		normalMap: texturePaths.normal,
		roughnessMap: texturePaths.rough,
	});

	// Add console.log to debug texture loading
	console.log("Loading textures for:", textureSet, textures);

	Object.values(textures).forEach((texture) => {
		if (texture) {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set(2, 2);
			texture.minFilter = THREE.LinearMipMapLinearFilter;
			texture.magFilter = THREE.LinearFilter;
			texture.anisotropy = 16;
		}
	});

	return (
		<RigidBody type="fixed" position={position} rotation={rotation}>
			<mesh receiveShadow>
				{/* <cylinderGeometry args={[10, 10, 0.5, 64]} />{" "} */}
				<boxGeometry args={[20, 0.5, 20]} />
				<meshStandardMaterial
					{...textures}
					normalScale={new THREE.Vector2(0.5, 0.5)}
					roughness={0.8}
					metalness={0.0}
					displacementScale={0.1}
				/>
			</mesh>
		</RigidBody>
	);
};

export default TexturedFloor;
