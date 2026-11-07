import {
  CanvasTexture,
  CustomBlending,
  OneMinusSrcAlphaFactor,
  SrcAlphaFactor,
  FrontSide,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three';

import { DIST, FLOOR_DARK, FLOOR_DEPTH, FLOOR_LIGHT, FLOOR_SQUARE, FLOOR_WIDTH } from './constants';

export interface Floor {
  mesh: Mesh;
  /** Height of the floor plane (world y), set from the layout. */
  y: number;
  /** 0..1: how much of the floor shows (0 hides it). Tied to the hero window. */
  setPresence: (presence: number) => void;
  dispose: () => void;
}

/** A 2 x 2 chessboard tile drawn on a canvas: no image files. */
function chessboardTexture(maxAnisotropy: number): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const half = size / 2;
    ctx.fillStyle = FLOOR_DARK;
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = FLOOR_LIGHT;
    ctx.fillRect(0, 0, half, half);
    ctx.fillRect(half, half, half, half);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.repeat.set(FLOOR_WIDTH / (2 * FLOOR_SQUARE), FLOOR_DEPTH / (2 * FLOOR_SQUARE));
  // Mipmaps and anisotropy blur the far squares into an even grey: no moire.
  texture.anisotropy = maxAnisotropy;
  return texture;
}

/**
 * The hero's chessboard floor: a large horizontal plane below the necklace,
 * receding into the fog so its far edge dissolves. Unlit and fogged; drawn
 * before the chain without writing depth, so it never hides a link. It belongs
 * to the hero window: the engine fades it out as the hero leaves the viewport
 * and hides it whenever a band is on screen (setPresence), and FrontSide culls
 * it once the camera sinks below it.
 */
export function createFloor(maxAnisotropy: number): Floor {
  const geometry = new PlaneGeometry(FLOOR_WIDTH, FLOOR_DEPTH);
  const texture = chessboardTexture(maxAnisotropy);
  const material = new MeshBasicMaterial({
    map: texture,
    side: FrontSide,
    fog: true,
    depthWrite: false,
    // Not tone-mapped: the canvas clears to the raw fog colour, so a fully fogged
    // floor must output exactly that colour or its far edge shows as a line.
    toneMapped: false,
    // Fades with the hero window. Still drawn in the opaque pass (before the
    // chain, so it never hides a link): custom blending keeps the alpha.
    transparent: false,
    blending: CustomBlending,
    blendSrc: SrcAlphaFactor,
    blendDst: OneMinusSrcAlphaFactor,
  });
  const mesh = new Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  // Near edge just in front of the camera, the rest receding into the fog
  mesh.position.z = DIST - 2 - FLOOR_DEPTH / 2;
  mesh.renderOrder = -1;
  mesh.matrixAutoUpdate = true;

  return {
    mesh,
    y: 0,
    setPresence(presence) {
      material.opacity = presence;
      mesh.visible = presence > 0.002;
    },
    dispose: () => {
      geometry.dispose();
      material.dispose();
      texture.dispose();
    },
  };
}
