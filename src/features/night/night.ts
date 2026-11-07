import { subscribeScrollFrame } from '../../lib/scrollFrame';

/*
 * The night cycle (docs/brand/design-direction.md): the page is one night, from
 * 6:00 PM at the top to 6:00 AM at the bottom. Night progress is page scroll
 * progress, 0 at the top and 1 at the bottom. It is shared here, outside React,
 * so the header watch and the 3D lighting can follow it without re-renders.
 */

/** Show the pocket-watch clock in the header. */
// Typed as boolean (not the literal true) so turning it off is a one-word change.
export const SHOW_SCROLL_CLOCK = true as boolean;

/**
 * Review hook: `?night=0..1` in the URL freezes the night at that progress (3D
 * lighting and header watch), so screenshots of each keyframe are reproducible.
 * Read once at load; without the parameter it does nothing.
 */
function readOverride(): number | null {
  try {
    const raw = new URLSearchParams(window.location.search).get('night');
    if (raw === null || raw.trim() === '') return null;
    const value = Number(raw);
    return Number.isFinite(value) ? Math.min(Math.max(value, 0), 1) : null;
  } catch {
    return null;
  }
}

const override = readOverride();

let current = override ?? 0;

/** True when `?night=` froze the night for review. */
export function isNightFrozen(): boolean {
  return override !== null;
}

/** Latest night progress, 0..1 (updated while anything is subscribed). */
export function getNightProgress(): number {
  return current;
}

/**
 * Calls `listener(progress)` inside the shared scroll frame whenever the page
 * moves (and once right away). Use it to drive anything imperative
 * (transforms, uniforms, lights).
 */
export function subscribeNightProgress(listener: (progress: number) => void): () => void {
  return subscribeScrollFrame(({ progress }) => {
    current = override ?? progress;
    listener(current);
  });
}
