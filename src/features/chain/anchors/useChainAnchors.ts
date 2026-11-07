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
 * Ref for the hero section: the necklace frames it and the render loop runs
 * while it is on screen. The section must be transparent and full-viewport,
 * with the title centred in it (the ring is centred on the viewport).
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
 * Ref for a band: a transparent strip the chain drapes across. Bands are used in
 * document order; the first drape sags under its phrase, the second hangs above it,
 * and so on alternately.
 */
export function useChainBandRef(): RefCallback<HTMLElement> {
  const registry = useChainAnchorRegistry();
  return useCallback(
    (el: HTMLElement | null) => {
      if (!el) return;
      registry.addBand(el);
      return () => {
        registry.removeBand(el);
      };
    },
    [registry],
  );
}
