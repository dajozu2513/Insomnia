import { ErrorBoundary } from '../components/ErrorBoundary';
import { ChainAnchorsProvider, ChainStage } from '../features/chain';
import { Deck } from '../features/deck/Deck';
import { Band } from '../features/home/Band';
import { Hero } from '../features/home/Hero';
import { Landing } from '../features/home/Landing';
import { HomeSection } from '../features/home/HomeSection';
import { Pillars } from '../features/home/Pillars';
import { IntroSplash } from '../features/intro/IntroSplash';
import { ReadingsIndex } from '../features/readings/ReadingsIndex';
import { TeeRack } from '../features/rack/TeeRack';
import { useHead } from '../hooks/useHead';
import { useI18n } from '../i18n';
import { SITE_NAME } from '../lib/head';

/*
 * Home: one night (docs/brand/design-direction.md, "Section map").
 * Intro > Hero (dream) > Pillars (reality) > Band 1 (dream) > Jewelry (reality)
 * > Band 2 (dream) > T-shirts (reality) > Band 3 (dream) > Readings > Landing
 * (dream: the hall at dawn) > Footer (over the landing's last frame).
 * The hero carries only the name; the bands carry no text at all. The engine
 * drapes the chain across however many bands are registered, in document order.
 *
 * LAYERING RULE: the hero and the bands are windows onto the chain (transparent
 * under `has-3d`). Every other section must have an opaque background, and no
 * section may fade its own opacity, or the chain's black stage flashes through.
 */
/** A failed intro must not leave the page held on ink. */
function endIntro(): void {
  document.documentElement.classList.remove('intro-pending');
}

/** A failed 3D stage gives the hero and bands their photos back (the WebGL fallback). */
function dropChain(): void {
  document.documentElement.classList.remove('has-3d');
}

export function HomePage() {
  const { t, lang } = useI18n();
  const { jewelry, readings } = t.home;
  useHead({ title: SITE_NAME, description: t.meta.description, path: '/', type: 'website', lang });

  return (
    <ChainAnchorsProvider>
      {/* Each part is guarded: a failure leaves that part out and the page carries on */}
      <ErrorBoundary name="Intro" onError={endIntro}>
        <IntroSplash />
      </ErrorBoundary>
      <ErrorBoundary name="3D chain" onError={dropChain}>
        <ChainStage />
      </ErrorBoundary>
      <ErrorBoundary name="Hero">
        <Hero />
      </ErrorBoundary>
      <ErrorBoundary name="Pillars">
        <Pillars />
      </ErrorBoundary>
      {/* Band 1: the chain drapes across it, before the jewelry */}
      <ErrorBoundary name="Band 1">
        <Band chain />
      </ErrorBoundary>
      <HomeSection id="jewelry" lead={jewelry.lead} em={jewelry.em}>
        <ErrorBoundary name="Jewelry deck">
          <Deck />
        </ErrorBoundary>
      </HomeSection>
      {/* Band 2 */}
      <ErrorBoundary name="Band 2">
        <Band />
      </ErrorBoundary>
      {/* The T-shirts: a window onto the shaft where the tees hang on a floating rack
          (the grid on bone without WebGL) */}
      <ErrorBoundary name="T-shirt rack">
        <TeeRack />
      </ErrorBoundary>
      {/* Band 3: separates the T-shirts from the readings */}
      <ErrorBoundary name="Band 3">
        <Band />
      </ErrorBoundary>
      <HomeSection id="readings" anchor="lecturas" lead={readings.lead} em={readings.em}>
        <ErrorBoundary name="Readings">
          <ReadingsIndex />
        </ErrorBoundary>
      </HomeSection>
      {/* The landing: the fall ends in the hall; the footer sits over its last frame */}
      <ErrorBoundary name="Landing">
        <Landing />
      </ErrorBoundary>
    </ChainAnchorsProvider>
  );
}
