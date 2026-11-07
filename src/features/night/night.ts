import { subscribeScrollFrame } from '../../lib/scrollFrame';

/*
 * The night cycle (docs/brand/design-direction.md): the page is one night, from
 * 6:00 PM at the top to 6:00 AM at the bottom. Night progress is page scroll
 * progress, 0 at the top and 1 at the bottom. It is shared here, outside React,
 * so the header watch (and, from step 4, the 3D lighting) can follow it without
 * re-renders.
 */

/** Show the pocket-watch clock in the header. */
// Typed as boolean (not the literal true) so turning it off is a one-word change.
export const SHOW_SCROLL_CLOCK = true as boolean;

let current = 0;

/** Latest night progress, 0..1 (updated while anything is subscribed). */
export function getNightProgress(): number {
  return current;
}

/**
 * Calls `listener(progress)` inside the shared scroll frame whenever the page
 * moves. Use it to drive anything imperative (transforms, uniforms, lights).
 */
export function subscribeNightProgress(listener: (progress: number) => void): () => void {
  return subscribeScrollFrame(({ progress }) => {
    current = progress;
    listener(progress);
  });
}
