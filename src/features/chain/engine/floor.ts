import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three';

import { FLOOR_DARK, FLOOR_DEPTH, FLOOR_LIGHT, FLOOR_SQUARE, FLOOR_WIDTH } from './constants';

/**
 * A 2 x 2 chessboard tile drawn on a canvas: no image files. The hall's floor
 * at the landing (objects/hall.ts), with its own repeat; the chessboard left
 * the hero in step 11.
 */
export function chessboardTexture(
  maxAnisotropy: number,
  repeatX = FLOOR_WIDTH / (2 * FLOOR_SQUARE),
  repeatY = FLOOR_DEPTH / (2 * FLOOR_SQUARE),
): CanvasTexture {
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
  texture.repeat.set(repeatX, repeatY);
  // Mipmaps and anisotropy blur the far squares into an even grey: no moire.
  texture.anisotropy = maxAnisotropy;
  return texture;
}
