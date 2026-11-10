import { useCallback, useEffect, useRef } from 'react';

import { useChainHeroRef } from '../chain';
import { entranceProgress } from '../fall/fall';
import { useI18n } from '../../i18n';
import { subscribeScrollFrame } from '../../lib/scrollFrame';
import './Hero.css';
import './photo.css';
import './byline.css';

const smoothstep = (edge0: number, edge1: number, x: number) => {
  const t = Math.min(Math.max((x - edge0) / (edge1 - edge0), 0), 1);
  return t * t * (3 - 2 * t);
};

/**
 * Hero: the entrance. A tall section (its own scroll progress plays the 3D
 * sequence on the fixed canvas: the edge of the hole, then the fall) with a
 * pinned viewport inside. The name floats above the hole and rises and fades
 * as the visitor goes over the edge; the h1 keeps it for assistive tech and
 * search. Until the live scene is ready, a still of shot 1 shows, and it
 * crossfades away (Hero.css, `chain-live`); without WebGL the still stays and
 * the hero has normal height. No call to action: visitors scroll and fall.
 */
export function Hero() {
  const { t } = useI18n();
  const heroRef = useChainHeroRef();
  const sectionRef = useRef<HTMLElement | null>(null);
  const floatRef = useRef<HTMLDivElement>(null);
  const title = t.home.hero.title;

  const ref = useCallback(
    (el: HTMLElement | null) => {
      sectionRef.current = el;
      const cleanup = heroRef(el);
      return () => {
        sectionRef.current = null;
        if (typeof cleanup === 'function') cleanup();
      };
    },
    [heroRef],
  );

  // Shot 2: the name rises and fades as the camera goes over the edge. Written to
  // the DOM in the shared scroll frame. A hero of normal height (reduced motion, no
  // WebGL) has no sequence, so the name simply stays.
  useEffect(
    () =>
      subscribeScrollFrame(({ viewportHeight }) => {
        const section = sectionRef.current;
        const float = floatRef.current;
        if (!section || !float) return;
        const rect = section.getBoundingClientRect();
        const k = smoothstep(0.05, 0.26, entranceProgress(rect.top, rect.height, viewportHeight));
        float.style.opacity = k > 0 ? String(1 - k) : '';
        float.style.translate = k > 0 ? `0 ${String(-k * 16)}vh` : '';
        float.style.visibility = k >= 1 ? 'hidden' : '';
      }),
    [],
  );

  return (
    <section ref={ref} className="hero" aria-labelledby="hero-title">
      <div className="hero-pin">
        <div className="hero-still" aria-hidden="true" />
        <div className="hero-vignette" aria-hidden="true" />
        <div ref={floatRef} className="hero-float">
          <div className="hero-content">
            {/* Letter-by-letter entrance; the h1 keeps the whole word for assistive tech */}
            <h1 id="hero-title" className="hero-title" aria-label={title}>
              {Array.from(title, (char, i) => (
                <span key={i} className="char" aria-hidden="true" style={{ '--i': i }}>
                  {char}
                </span>
              ))}
            </h1>
            <p className="hero-sub name-byline">{t.home.hero.sub}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
