import { useCallback, useContext, type RefCallback } from 'react';

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
