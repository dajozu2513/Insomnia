import { Color } from 'three';

/**
 * A colour for the custom atmosphere shaders, which write their result
 * straight to the screen without colour-space conversion: the hex channels are
 * passed through as they are, so what is written is what shows. (The current
 * mist and glow were tuned this way.)
 */
export function rawColor(hex: string): Color {
  const value = Number.parseInt(hex.replace('#', ''), 16);
  return new Color(((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255);
}
