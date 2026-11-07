import {
  CanvasTexture,
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
 * before the chain without writing depth, so it never hides a link. Its top
 * face only (FrontSide): once the camera sinks below it on the way to the
 * bands, it is culled and never shows there.
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
    dispose: () => {
      geometry.dispose();
      material.dispose();
      texture.dispose();
    },
  };
}
