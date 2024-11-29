import { RigidBody } from "@react-three/rapier";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";
import type { FloorProps } from "./types";
import { FLOOR_TEXTURE_SETS } from "./floorTextures";

export type TextureSetType = keyof typeof FLOOR_TEXTURE_SETS;

interface TexturedFloorProps extends FloorProps {
	textureSet: TextureSetType;
}

const TexturedFloor: React.FC<TexturedFloorProps> = ({
	position = [0, -2, 0],
	rotation = [0.1, 0, 0],
	textureSet,
}) => {
	const texturePaths = FLOOR_TEXTURE_SETS[textureSet];
	const textures = useTexture({
		map: texturePaths.diff,
		displacementMap: texturePaths.disp,
		normalMap: texturePaths.normal,
		roughnessMap: texturePaths.rough,
	});

	Object.values(textures).forEach((texture) => {
		if (texture) {
			texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
			texture.repeat.set(2, 2);
			texture.minFilter = THREE.LinearMipMapLinearFilter;
			texture.magFilter = THREE.LinearFilter;
			texture.anisotropy = 16;
		}
	});

	const floorRotation: [number, number, number] = [
		rotation[0],
		rotation[1],
		rotation[2],
	];
	return (
		<RigidBody
			type="fixed"
			position={position}
			rotation={floorRotation}
			friction={1.0}
			restitution={0.2}
			colliders="cuboid"
		>
			<mesh receiveShadow>
				{/* Using a BoxGeometry for better collision */}
				<boxGeometry args={[20, 0.2, 20]} />
				<meshStandardMaterial
					{...textures}
					normalScale={new THREE.Vector2(0.5, 0.5)}
					roughness={0.8}
					metalness={0.0}
					displacementScale={0.1}
					side={THREE.DoubleSide}
				/>
			</mesh>
		</RigidBody>
	);
};

export default TexturedFloor;
