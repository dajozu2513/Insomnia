import { useEffect, useRef } from 'react';

import { useI18n } from '../../i18n';
import './Footer.css';

interface FooterProps {
  /**
   * On the home page the footer sits over the landing's last frame: transparent,
   * over a soft dark scrim, pulled up by its own height (measured into
   * --site-footer-height), so the page ends on the hall at dawn.
   */
  overScene?: boolean;
}

export function Footer({ overScene = false }: FooterProps) {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!overScene || !el) return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => {
      root.style.setProperty('--site-footer-height', `${String(el.offsetHeight)}px`);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--site-footer-height');
    };
  }, [overScene]);

  return (
    <footer ref={ref} className={overScene ? 'site-footer site-footer--over-scene' : 'site-footer'}>
      <div className="footer-signature">
        <p className="footer-brand">{t.meta.siteName}</p>
        <p className="footer-tagline">{t.footer.tagline}</p>
      </div>
      <p className="footer-copy">
        &copy; {year} &bull; {t.footer.rights}
      </p>
    </footer>
  );
}
