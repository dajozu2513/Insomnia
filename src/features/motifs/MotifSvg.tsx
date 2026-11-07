import type { ReactNode } from 'react';

import './motifs.css';

/**
 * Stroke weight of every ornament, in screen pixels: the legacy pillar icons
 * drew 1.3-unit strokes in a 48-unit box shown at 48px. Strokes do not scale
 * with the drawing (vector-effect: non-scaling-stroke, set in motifs.css), so a
 * motif keeps this weight at any size.
 */
export const MOTIF_STROKE = 1.3;

export interface MotifProps {
  /** Rendered width in px (height follows the viewBox). */
  size?: number;
  /** Accessible name. Without one the motif is decorative and hidden from assistive tech. */
  title?: string;
  className?: string;
}

interface MotifSvgProps extends MotifProps {
  viewBox: string;
  children: ReactNode;
}

/**
 * Shared frame for the line-art motifs (docs/brand/design-direction.md,
 * "Motifs"): currentColor strokes, no fill, round joins. Solid details inside
 * a motif must set fill="currentColor" and stroke="none" explicitly.
 */
export function MotifSvg({ size = 48, title, className, viewBox, children }: MotifSvgProps) {
  const [, , w = 48, h = 48] = viewBox.split(' ').map(Number);
  return (
    <svg
      className={className ? `motif ${className}` : 'motif'}
      width={size}
      height={(size * h) / w}
      viewBox={viewBox}
      fill="none"
      stroke="currentColor"
      strokeWidth={MOTIF_STROKE}
      strokeLinecap="round"
      strokeLinejoin="round"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {children}
    </svg>
  );
}
