import { useEffect, useRef } from 'react';

import { PocketWatch } from '../clock/PocketWatch';
import { handTransform, watchAngles } from '../clock/watchGeometry';
import { subscribeNightProgress } from './night';

/** Header watch height in px (about the two-line brand block); phones use a smaller size through CSS. */
const HEADER_WATCH_SIZE = 38;

/**
 * The header's night clock: a pocket watch whose hands follow the page, 6:00
 * at the top and a full turn later 6:00 at the bottom. Hand angles are written
 * through refs inside the shared scroll frame (no React state), continuously,
 * so the watch also follows the scroll directly with reduced motion.
 */
export function ScrollClock() {
  const hourRef = useRef<SVGGElement>(null);
  const minuteRef = useRef<SVGGElement>(null);

  useEffect(
    () =>
      subscribeNightProgress((progress) => {
        const { hour, minute } = watchAngles(progress);
        hourRef.current?.setAttribute('transform', handTransform(hour));
        minuteRef.current?.setAttribute('transform', handTransform(minute));
      }),
    [],
  );

  return (
    <span className="scroll-clock" aria-hidden="true">
      <PocketWatch size={HEADER_WATCH_SIZE} hourRef={hourRef} minuteRef={minuteRef} doubleRim />
    </span>
  );
}
