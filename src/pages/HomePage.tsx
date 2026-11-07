import {
  ChainAnchorsProvider,
  ChainStage,
  useChainBandRef,
  useChainHeroRef,
} from '../features/chain';
import { useI18n } from '../i18n';
import './HomePage.css';

/*
 * TEMPORARY home layout, only to test the 3D chain. It reproduces the legacy
 * rhythm (hero window, opaque section, band, opaque section, band, opaque
 * section) at the legacy heights so the necklace and both drapes can be
 * compared with the old site. Step 3 replaces the opaque placeholders with the
 * real sections.
 *
 * LAYERING RULE: the hero and the bands are windows onto the chain (transparent
 * under `has-3d`). Every other section must have an opaque background, and no
 * section may fade its own opacity, or the chain's black stage flashes through.
 */
export function HomePage() {
  return (
    <ChainAnchorsProvider>
      <ChainStage />
      <HomeSections />
    </ChainAnchorsProvider>
  );
}

function HomeSections() {
  const { t } = useI18n();
  const heroRef = useChainHeroRef();

  return (
    <>
      <section ref={heroRef} className="hero" aria-labelledby="hero-title">
        <div className="hero-bg" aria-hidden="true" />
        <div className="hero-overlay" aria-hidden="true" />
        <div className="hero-content">
          <h1 id="hero-title" className="hero-title">
            {t.home.hero.title}
          </h1>
          <p className="hero-sub">{t.home.hero.sub}</p>
        </div>
      </section>

      <PlaceholderSection variant="first" label={t.home.section1} />
      <Band phrase={t.home.band1} />
      <PlaceholderSection variant="second" label={t.home.section2} />
      <Band phrase={t.home.band2} />
      <PlaceholderSection variant="third" label={t.home.section3} />
    </>
  );
}

function Band({ phrase }: { phrase: string }) {
  const bandRef = useChainBandRef();

  return (
    <section ref={bandRef} className="separator">
      <div className="separator-bg" aria-hidden="true" />
      <div className="separator-overlay">
        <p className="separator-headline">{phrase}</p>
      </div>
    </section>
  );
}

// PLACEHOLDER: opaque stand-ins for the pillars, collection and articles.
function PlaceholderSection({
  variant,
  label,
}: {
  variant: 'first' | 'second' | 'third';
  label: string;
}) {
  return (
    <section className={`home-placeholder home-placeholder--${variant}`}>
      <p className="home-placeholder-label">{label}</p>
    </section>
  );
}
