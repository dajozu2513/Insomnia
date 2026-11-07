/** Centre of the pocket watch's dial in its 40 x 52 viewBox. */
export const WATCH_CX = 20;
export const WATCH_CY = 32;
/** Outer rim radius. */
export const WATCH_RIM = 17;

/**
 * Hand angles in degrees, clockwise from 12, for a night progress 0..1: the
 * hour hand starts at 6 and makes one full turn; the minute hand makes twelve.
 */
export function watchAngles(progress: number): { hour: number; minute: number } {
  return { hour: 180 + 360 * progress, minute: 360 * 12 * progress };
}

/** SVG transform for a hand at `angle` degrees around the dial centre. */
export function handTransform(angle: number): string {
  return `rotate(${angle.toFixed(3)} ${String(WATCH_CX)} ${String(WATCH_CY)})`;
}
