import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

import { useI18n } from '../../i18n';
import { LanguageToggle } from './LanguageToggle';
import './Header.css';

/** Scroll distance after which the header turns solid (legacy: 60px). */
const SCROLLED_AFTER = 60;

export function Header() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;

    // The hairline is written straight to the DOM in a rAF, as in the legacy
    // site, so scrolling never re-renders React. `scrolled` only re-renders
    // when it actually flips.
    const update = () => {
      frame = 0;
      const y = window.scrollY;
      setScrolled(y > SCROLLED_AFTER);

      const progress = progressRef.current;
      if (progress) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = `scaleX(${String(max > 0 ? Math.min(y / max, 1) : 0)})`;
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    // Content loading in (fonts, images, route changes) changes the page height.
    const resizeObserver = new ResizeObserver(schedule);
    resizeObserver.observe(document.body);
    update(); // a reload can restore the page mid-scroll

    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      resizeObserver.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <header id="site-header" className={scrolled ? 'site-header scrolled' : 'site-header'}>
      <Link to="/" className="brand" aria-label={t.a11y.homeLink}>
        <span className="brand-name">Insomnia</span>
        <span className="brand-sub">by Joel Soto</span>
      </Link>
      <div className="header-right">
        <p className="header-tag">{t.header.tagline}</p>
        <LanguageToggle />
      </div>
      <span ref={progressRef} className="scroll-progress" aria-hidden="true" />
    </header>
  );
}
