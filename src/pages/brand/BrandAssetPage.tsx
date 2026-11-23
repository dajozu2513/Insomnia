import { useParams, useSearchParams } from 'react-router-dom';

import { PocketWatch } from '../../features/clock/PocketWatch';
import { useHead } from '../../hooks/useHead';
import { useI18n } from '../../i18n';
import { NotFoundPage } from '../NotFoundPage';
import '../../features/home/byline.css';
import '../../features/home/Hero.css';
import '../../features/home/photo.css';
import './BrandAssetPage.css';

/*
 * Sources for the share image and the icons, captured to files with a headless
 * browser (see README, "Share image and icons"); not linked, not indexed,
 * outside the site layout.
 *
 *   /brand-assets/og    1200 x 630: the opening, shot 1 at the edge of the hole
 *                       (the hero's still), with the name and by-line set larger
 *                       and higher so they read in a small link preview.
 *   /brand-assets/icon  the pocket watch at 6:00 on ink, filling a square window;
 *                       ?stroke=<units> thickens the line for small sizes.
 */
export function BrandAssetPage() {
  const { asset } = useParams();
  const [search] = useSearchParams();
  const { t, lang } = useI18n();
  useHead({
    title: 'Insomnia by Joel Soto',
    description: t.meta.description,
    path: `/brand-assets/${asset ?? ''}`,
    type: 'website',
    lang,
    noindex: true,
  });

  if (asset === 'og') {
    return (
      // The hero's own pieces: the shot 1 still, its vignette, the name over its
      // dark hush. Only the name's place and size differ (BrandAssetPage.css).
      <div className="hero-pin brand-og" aria-hidden="true">
        <div className="hero-still" />
        <div className="hero-vignette" />
        <div className="hero-float">
          <div className="hero-content">
            <div className="hero-title">{t.home.hero.title}</div>
            <div className="hero-sub name-byline">{t.home.hero.sub}</div>
          </div>
        </div>
      </div>
    );
  }

  if (asset === 'icon') {
    const stroke = Number(search.get('stroke') ?? '1.6');
    return (
      <div className="brand-icon" style={{ '--icon-stroke': stroke }} aria-hidden="true">
        <PocketWatch size={52} progress={0} doubleRim={stroke < 2} />
      </div>
    );
  }

  return <NotFoundPage />;
}
