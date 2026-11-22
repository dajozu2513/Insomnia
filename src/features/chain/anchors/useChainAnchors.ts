import { useCallback, useContext, useEffect, type RefCallback } from 'react';

import { ChainAnchorsContext } from './ChainAnchorsContext';
import type { ChainAnchorRegistry } from './registry';

export function useChainAnchorRegistry(): ChainAnchorRegistry {
  const registry = useContext(ChainAnchorsContext);
  if (!registry) {
    throw new Error('Chain anchors must be used inside <ChainAnchorsProvider>.');
  }
  return registry;
}

/**
 * Ref for the hero section: the entrance and the fall play while it scrolls
 * (its own progress, 0 at its top, 1 when its end reaches the bottom of the
 * viewport), and the render loop runs while it is on screen.
 */
export function useChainHeroRef(): RefCallback<HTMLElement> {
  const registry = useChainAnchorRegistry();
  return useCallback(
    (el: HTMLElement | null) => {
      if (!el) return;
      registry.setHero(el);
      return () => {
        registry.clearHero(el);
      };
    },
    [registry],
  );
}

/**
 * Ref for a band: a transparent window onto the shaft. With chain set, the chain
 * drapes across it (a gentle catenary centred in the band); bands are used in
 * document order.
 */
export function useChainBandRef(chain = false): RefCallback<HTMLElement> {
  const registry = useChainAnchorRegistry();
  return useCallback(
    (el: HTMLElement | null) => {
      if (!el) return;
      registry.addBand(el, chain);
      return () => {
        registry.removeBand(el);
      };
    },
    [registry, chain],
  );
}

/**
 * Ref for the landing at the bottom of the page: the fall ends in the hall while
 * it scrolls, and the engine writes the small door's place on screen to it.
 */
export function useChainLandingRef(): RefCallback<HTMLElement> {
  const registry = useChainAnchorRegistry();
  return useCallback(
    (el: HTMLElement | null) => {
      if (!el) return;
      registry.setLanding(el);
      return () => {
        registry.clearLanding(el);
      };
    },
    [registry],
  );
}

/**
 * Registers the T-shirt section's floating rack (step 14): the section is a
 * window onto the shaft and the rack floats centred on its stage. Pass both
 * elements once mounted; null clears it (the section showing its grid).
 */
export function useChainRack(section: HTMLElement | null, stage: HTMLElement | null): void {
  const registry = useChainAnchorRegistry();
  useEffect(() => {
    if (!section || !stage) return;
    registry.setRack(section, stage);
    return () => {
      registry.clearRack(section);
    };
  }, [registry, section, stage]);
}
