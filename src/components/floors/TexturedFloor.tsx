import { useTexture } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
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

	// Combine the original tilt with the plane's rotation
	const floorRotation: [number, number, number] = [
		-Math.PI / 2 + rotation[0],
		rotation[1],
		rotation[2],
	];

	return (
		<RigidBody type="fixed" position={position} rotation={floorRotation}>
			<mesh receiveShadow>
				<planeGeometry args={[20, 20]} />
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
