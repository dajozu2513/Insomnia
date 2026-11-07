import type { Ref } from 'react';

import { MotifSvg } from '../motifs/MotifSvg';
import { handTransform, watchAngles, WATCH_CX, WATCH_CY, WATCH_RIM } from './watchGeometry';
import './PocketWatch.css';

/*
 * The night clock: a small pocket watch in thin line art (MOTIF_STROKE, the
 * pillar-icon weight), drawn in currentColor. Rim, crown and bow; twelve ticks
 * with longer quarters; no numerals; slender hands with a small open loop near
 * the hour hand's tip; a centre pin. Always decorative (aria-hidden).
 */

const CX = WATCH_CX;
const CY = WATCH_CY;
const RIM = WATCH_RIM;

const TICKS = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2;
  const quarter = i % 3 === 0;
  const outer = RIM - 3.2;
  const inner = outer - (quarter ? 3 : 1.7);
  return {
    key: i,
    x1: CX + Math.sin(a) * inner,
    y1: CY - Math.cos(a) * inner,
    x2: CX + Math.sin(a) * outer,
    y2: CY - Math.cos(a) * outer,
  };
});

interface PocketWatchProps {
  /** Rendered height in px (width follows the 40:52 viewBox). */
  size: number;
  /**
   * Static time as a night progress (0 = 6:00 PM, 1 = 6:00 AM). Leave it out
   * when the hands are driven imperatively through `hourRef` / `minuteRef`, so
   * React never overwrites the transforms they write.
   */
  progress?: number;
  hourRef?: Ref<SVGGElement>;
  minuteRef?: Ref<SVGGElement>;
  /** Second, inner rim line: only at sizes where it stays clean. */
  doubleRim?: boolean;
  className?: string;
}

export function PocketWatch({
  size,
  progress,
  hourRef,
  minuteRef,
  doubleRim = false,
  className,
}: PocketWatchProps) {
  const angles = progress === undefined ? null : watchAngles(progress);
  return (
    <MotifSvg
      viewBox="0 0 40 52"
      size={(size * 40) / 52}
      className={className ? `pocket-watch ${className}` : 'pocket-watch'}
    >
      {/* Bow (the ring the chain goes through) and crown */}
      <ellipse cx={CX} cy="4.6" rx="3.6" ry="3.1" />
      <rect x="17.6" y="8" width="4.8" height="3.6" rx="1" />
      <path d="M18.6 11.6 V14.6 M21.4 11.6 V14.6" />
      {/* Case */}
      <circle cx={CX} cy={CY} r={RIM} />
      {doubleRim && <circle cx={CX} cy={CY} r={RIM - 2.2} />}
      {TICKS.map(({ key, ...line }) => (
        <line key={key} {...line} />
      ))}
      {/* Hour hand: shaft, a small open loop, then a short point */}
      <g ref={hourRef} transform={angles ? handTransform(angles.hour) : undefined}>
        <path d={`M${String(CX)} ${String(CY + 2)} V${String(CY - 5.6)}`} />
        <circle cx={CX} cy={CY - 7.2} r="1.6" />
        <path d={`M${String(CX)} ${String(CY - 8.8)} V${String(CY - 9.8)}`} />
      </g>
      {/* Minute hand: long and slender */}
      <g ref={minuteRef} transform={angles ? handTransform(angles.minute) : undefined}>
        <path d={`M${String(CX)} ${String(CY + 2.6)} V${String(CY - 12.4)}`} />
      </g>
      <circle cx={CX} cy={CY} r="1.3" fill="currentColor" stroke="none" />
    </MotifSvg>
  );
}
