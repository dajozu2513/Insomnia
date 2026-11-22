/*
 * The entrance: the hero is a tall section whose own scroll progress (0 at its
 * top, 1 when its end reaches the bottom of the viewport) plays the edge of the
 * hole and the fall (docs/brand/design-direction.md, "The entrance and the
 * fall"). The 3D camera reads it from the eased scroll; the hero's title reads
 * it from the real scroll.
 */

/**
 * Review hook, development only: `?fall=0..1` freezes the entrance at that
 * progress (3D camera and hero title) for reproducible screenshots, like
 * `?night=`; `?fall=1..2` holds the camera further down, from the hero's end (1)
 * to the bottom of the page (2), to see the objects of the fall without
 * scrolling. Production builds compile this to null and drop the reader.
 */
function readOverride(): number | null {
  try {
    const raw = new URLSearchParams(window.location.search).get('fall');
    if (raw === null || raw.trim() === '') return null;
    const value = Number(raw);
    return Number.isFinite(value) ? Math.min(Math.max(value, 0), 2) : null;
  } catch {
    return null;
  }
}

export const FALL_OVERRIDE: number | null = import.meta.env.DEV ? readOverride() : null;

/**
 * Entrance progress of the hero from its bounding box: 0 while its top is at
 * the top of the viewport, 1 once its end reaches the viewport's bottom. A hero
 * of normal height (no sequence: reduced motion, no WebGL) stays at 0.
 */
export function entranceProgress(top: number, height: number, viewportHeight: number): number {
  if (FALL_OVERRIDE !== null) return Math.min(FALL_OVERRIDE, 1);
  const length = height - viewportHeight;
  if (length < 1) return 0;
  return Math.min(Math.max(-top / length, 0), 1);
}

/**
 * Review hook, development only: `?word=<tee id>` (or `?word=1` for this visit's
 * word) holds band 2's letters assembled into the word, for screenshots.
 * Production builds compile this to null.
 */
function readWord(): string | null {
  try {
    const raw = new URLSearchParams(window.location.search).get('word');
    return raw === null || raw.trim() === '' ? null : raw.trim().toLowerCase();
  } catch {
    return null;
  }
}

export const WORD_OVERRIDE: string | null = import.meta.env.DEV ? readWord() : null;
