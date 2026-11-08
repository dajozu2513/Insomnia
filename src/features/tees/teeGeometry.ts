/*
 * The mockup's frames, in tee units (the flat tee is drawn in 300 x 330).
 * The grid shows a close crop on the chest print, the same frame for all ten
 * tees: the collar and shoulder line at the top and the armhole seams at the
 * edges keep it reading as fabric, and the word-alone front print (with its
 * mark) sits inside it. The dialog shows the whole tee.
 */

export interface Frame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const TEE_FRAME: Frame = { x: 0, y: 0, width: 300, height: 330 };

export const GRID_CROP: Frame = { x: 74, y: 14, width: 152, height: 152 };

/** The crop as fractions of the whole tee: where the dialog's FLIP starts. */
export const GRID_CROP_FRACTION: Frame = {
  x: GRID_CROP.x / TEE_FRAME.width,
  y: GRID_CROP.y / TEE_FRAME.height,
  width: GRID_CROP.width / TEE_FRAME.width,
  height: GRID_CROP.height / TEE_FRAME.height,
};

export function viewBox(frame: Frame): string {
  return `${String(frame.x)} ${String(frame.y)} ${String(frame.width)} ${String(frame.height)}`;
}
