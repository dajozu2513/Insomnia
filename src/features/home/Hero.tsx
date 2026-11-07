import { useEffect, useRef } from 'react';

import { useChainHeroRef } from '../chain';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useI18n } from '../../i18n';
import { subscribeScrollFrame } from '../../lib/scrollFrame';
import { has3d } from './has3d';
import './Hero.css';
import './byline.css';

/** Photo-fallback parallax: the hero photo moves at 0.35x the scroll (legacy). */
const HERO_PARALLAX = 0.35;

/**
 * Hero: a dream window onto the chain. The necklace frames the title; mist
 * gathers at the bottom. No call to action: visitors scroll through the chain.
 */
export function Hero() {
  const { t } = useI18n();
  const heroRef = useChainHeroRef();
  const bgRef = useRef<HTMLDivElement>(null);
  const reducedMotion = usePrefersReducedMotion();
  const title = t.home.hero.title;

  // Only matters when the 3D fallback shows the photo. Static with reduced motion.
  useEffect(() => {
    const bg = bgRef.current;
    if (!bg) return;
    if (reducedMotion) {
      bg.style.transform = '';
      return;
    }
    return subscribeScrollFrame(({ scrollY }) => {
      if (has3d()) return;
      bg.style.transform = `translateY(${String(scrollY * HERO_PARALLAX)}px)`;
    });
  }, [reducedMotion]);

  return (
    <section ref={heroRef} className="hero" aria-labelledby="hero-title">
      <div ref={bgRef} className="hero-bg" aria-hidden="true" />
      <div className="hero-overlay" aria-hidden="true" />
      <div className="atmo-mist hero-mist" aria-hidden="true" />
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
    </section>
  );
}
