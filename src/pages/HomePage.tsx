import { ChainAnchorsProvider, ChainStage } from '../features/chain';
import { Band } from '../features/home/Band';
import { Hero } from '../features/home/Hero';
import { HomeSection } from '../features/home/HomeSection';
import { Pillars } from '../features/home/Pillars';
import { Sonder } from '../features/home/Sonder';
import { IntroSplash } from '../features/intro/IntroSplash';
import { useI18n } from '../i18n';

/*
 * Home: one night (docs/brand/design-direction.md, "Section map").
 * Intro > Hero (dream) > Pillars (reality) > Band 1 (dream) > Jewelry (reality)
 * > Band 2 (dream) > T-shirts, opened by Sonder (reality) > Readings > Footer.
 * The hero carries only the name; the bands carry no text at all.
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
      {/* Band 1: the chain sags across it */}
      <Band />
      <HomeSection id="jewelry" lead={jewelry.lead} em={jewelry.em}>
        <p className="home-section-placeholder">{jewelry.body}</p>
      </HomeSection>
      {/* Band 2: the chain hangs high across it */}
      <Band />
      <HomeSection id="tshirts" lead={tshirts.lead} em={tshirts.em} prelude={<Sonder />}>
        <p className="home-section-placeholder">{tshirts.body}</p>
      </HomeSection>
      <HomeSection id="readings" lead={readings.lead} em={readings.em}>
        <p className="home-section-placeholder">{readings.body}</p>
      </HomeSection>
    </ChainAnchorsProvider>
  );
}
