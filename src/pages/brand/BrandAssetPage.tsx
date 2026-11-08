import { useParams, useSearchParams } from 'react-router-dom';

import { PocketWatch } from '../../features/clock/PocketWatch';
import { useHead } from '../../hooks/useHead';
import { useI18n } from '../../i18n';
import { NotFoundPage } from '../NotFoundPage';
import '../../features/home/byline.css';
import '../../features/intro/IntroSplash.css';
import './BrandAssetPage.css';

/*
 * Sources for the share image and the icons, captured to files with a headless
 * browser (see README, "Share image and icons"); not linked, not indexed,
 * outside the site layout.
 *
 *   /brand-assets/og    1200 x 630: the intro itself (ink, the red mist low, the
 *                       name and by-line in the intro's type, the hairline, the
 *                       watch at 6:00), larger so it reads as a small preview.
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
      // No film grain: invisible at preview size, and the noise alone tripled the
      // PNG (513 KB against 94 KB), past the ~300 KB some messaging apps accept.
      <div className="intro-screen brand-og" aria-hidden="true">
        <div className="intro-red-mist" />
        <div className="atmo-vignette" />
        <div className="intro-name">
          <div className="intro-logo">{t.home.hero.title}</div>
          <div className="intro-byline name-byline">{t.home.hero.sub}</div>
        </div>
        <span className="intro-line" />
        <PocketWatch className="intro-watch" size={124} progress={0} doubleRim />
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
