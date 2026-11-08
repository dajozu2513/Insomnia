import { useCallback, useEffect, useRef } from 'react';

import { useChainBandRef } from '../chain';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { subscribeScrollFrame } from '../../lib/scrollFrame';
import { has3d } from './has3d';
import './Band.css';
import './photo.css';

/**
 * A band: a pure dream window onto the chain (transparent under `has-3d`),
 * with mist, a soft vignette and the film grain, and no text. The chain drapes
 * alternate: it sags across the first band and hangs high across the second.
 * In the photo fallback, the photo drifts slower than the page and eases out
 * of a 1.1x zoom as the band crosses the viewport (legacy main.js); static with
 * reduced motion. Never background-attachment: fixed (iOS ignores it).
 * Decorative, so hidden from assistive tech.
 */
export function Band() {
  const chainRef = useChainBandRef();
  const bandRef = useRef<HTMLDivElement | null>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();

  const ref = useCallback(
    (el: HTMLDivElement | null) => {
      bandRef.current = el;
      const cleanup = chainRef(el);
      return () => {
        bandRef.current = null;
        if (typeof cleanup === 'function') cleanup();
      };
    },
    [chainRef],
  );

  useEffect(() => {
    const bg = bgRef.current;
    if (!bg) return;
    if (reducedMotion) {
      bg.style.transform = '';
      return;
    }
    return subscribeScrollFrame(({ viewportHeight: vh }) => {
      const band = bandRef.current;
      if (!band || has3d()) return;
      const r = band.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const p = (vh - r.top) / (vh + r.height); // 0 entering at the bottom, 1 leaving at the top
      bg.style.transform = `translate3d(0, ${String((p - 0.5) * r.height * 0.3)}px, 0) scale(${String(1.1 - p * 0.1)})`;
    });
  }, [reducedMotion]);

  return (
    <div ref={ref} className="separator" aria-hidden="true">
      <div ref={bgRef} className="separator-bg" />
      <div className="atmo-mist separator-mist" />
      <div className="separator-vignette" />
    </div>
  );
}
