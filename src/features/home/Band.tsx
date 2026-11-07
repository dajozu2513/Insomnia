import { useCallback, useEffect, useRef, type ReactNode } from 'react';

import { useChainBandRef } from '../chain';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { REVEAL_THRESHOLD, useInView } from '../../hooks/useInView';
import { subscribeScrollFrame } from '../../lib/scrollFrame';
import { has3d } from './has3d';
import './Band.css';

interface BandProps {
  /** `phrase`: one italic line. `word`: a large word and its meaning. */
  variant: 'phrase' | 'word';
  children: ReactNode;
}

/**
 * A band: a dream window onto the chain (transparent under `has-3d`), with a
 * radial shade behind the text, mist and the film grain. In the photo
 * fallback, the photo drifts slower than the page and eases out of a 1.1x zoom
 * as the band crosses the viewport (legacy main.js); static with reduced motion.
 * Never background-attachment: fixed (iOS ignores it).
 */
export function Band({ variant, children }: BandProps) {
  const chainRef = useChainBandRef();
  const sectionRef = useRef<HTMLElement | null>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const [revealRef, visible] = useInView<HTMLDivElement>(REVEAL_THRESHOLD);

  const ref = useCallback(
    (el: HTMLElement | null) => {
      sectionRef.current = el;
      const cleanup = chainRef(el);
      return () => {
        sectionRef.current = null;
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
      const band = sectionRef.current;
      if (!band || has3d()) return;
      const r = band.getBoundingClientRect();
      if (r.bottom < 0 || r.top > vh) return;
      const p = (vh - r.top) / (vh + r.height); // 0 entering at the bottom, 1 leaving at the top
      bg.style.transform = `translate3d(0, ${String((p - 0.5) * r.height * 0.3)}px, 0) scale(${String(1.1 - p * 0.1)})`;
    });
  }, [reducedMotion]);

  return (
    <section ref={ref} className={`separator separator--${variant}`}>
      <div ref={bgRef} className="separator-bg" aria-hidden="true" />
      <div className="atmo-mist separator-mist" aria-hidden="true" />
      <div className="separator-overlay">
        <div ref={revealRef} className={visible ? 'separator-text visible' : 'separator-text'}>
          {children}
        </div>
      </div>
    </section>
  );
}
