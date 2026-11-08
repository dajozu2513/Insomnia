import { ChainAnchorsProvider, ChainStage } from '../features/chain';
import { Deck } from '../features/deck/Deck';
import { Band } from '../features/home/Band';
import { Hero } from '../features/home/Hero';
import { HomeSection } from '../features/home/HomeSection';
import { Pillars } from '../features/home/Pillars';
import { IntroSplash } from '../features/intro/IntroSplash';
import { TeeGrid } from '../features/tees/TeeGrid';
import { useI18n } from '../i18n';

/*
 * Home: one night (docs/brand/design-direction.md, "Section map").
 * Intro > Hero (dream) > Pillars (reality) > Band 1 (dream) > Jewelry (reality)
 * > Band 2 (dream) > T-shirts (reality) > Band 3 (dream) > Readings > Footer.
 * The hero carries only the name; the bands carry no text at all. The engine
 * drapes the chain across however many bands are registered, in document order.
 *
 * LAYERING RULE: the hero and the bands are windows onto the chain (transparent
 * under `has-3d`). Every other section must have an opaque background, and no
 * section may fade its own opacity, or the chain's black stage flashes through.
 */
export function HomePage() {
  const { t } = useI18n();
  const { jewelry, tshirts, readings } = t.home;

  return (
    <ChainAnchorsProvider>
      <IntroSplash />
      <ChainStage />
      <Hero />
      <Pillars />
      {/* Band 1 */}
      <Band />
      <HomeSection id="jewelry" lead={jewelry.lead} em={jewelry.em}>
        <Deck />
      </HomeSection>
      {/* Band 2 */}
      <Band />
      <HomeSection id="tshirts" lead={tshirts.lead} em={tshirts.em}>
        <TeeGrid />
      </HomeSection>
      {/* Band 3: separates the T-shirts from the readings */}
      <Band />
      <HomeSection id="readings" lead={readings.lead} em={readings.em}>
        <p className="home-section-placeholder">{readings.body}</p>
      </HomeSection>
    </ChainAnchorsProvider>
  );
}
