import { useEffect, useRef, useState } from 'react';
import { Link, useMatch } from 'react-router-dom';

import { ScrollClock } from '../../features/night/ScrollClock';
import { SHOW_SCROLL_CLOCK } from '../../features/night/night';
import { useI18n } from '../../i18n';
import { subscribeScrollFrame } from '../../lib/scrollFrame';
import { LanguageToggle } from './LanguageToggle';
import './Header.css';

/** Scroll distance after which the header turns solid (legacy: 60px). */
const SCROLLED_AFTER = 60;

export function Header() {
  const { t } = useI18n();
  const [scrolled, setScrolled] = useState(false);
  // Article pages are paper from the top: the header is solid there from the start.
  const solid = useMatch('/lecturas/:slug') !== null;
  const progressRef = useRef<HTMLSpanElement>(null);

  // The hairline is written straight to the DOM in the shared scroll frame (the
  // clock updates in the same frame), so scrolling never re-renders React.
  // `scrolled` only re-renders when it actually flips.
  useEffect(
    () =>
      subscribeScrollFrame(({ scrollY, progress }) => {
        setScrolled(scrollY > SCROLLED_AFTER);
        const hairline = progressRef.current;
        if (hairline) hairline.style.transform = `scaleX(${String(progress)})`;
      }),
    [],
  );

  return (
    <header id="site-header" className={scrolled || solid ? 'site-header scrolled' : 'site-header'}>
      {/* The watch is the emblem beside the name: top-left, as tall as the brand block */}
      <div className="header-left">
        {SHOW_SCROLL_CLOCK && <ScrollClock />}
        <Link to="/" className="brand" aria-label={t.a11y.homeLink}>
          {/* The space keeps the visible text "Insomnia by Joel Soto", which the label starts with */}
          <span className="brand-name">Insomnia</span>{' '}
          <span className="brand-sub">by Joel Soto</span>
        </Link>
      </div>
      <div className="header-right">
        <p className="header-tag">{t.header.tagline}</p>
        <LanguageToggle />
      </div>
      <span ref={progressRef} className="scroll-progress" aria-hidden="true" />
    </header>
  );
}
