import type { ChainAnchors } from '../types';

/**
 * Holds the elements the chain is built around. It lives outside React state:
 * registering an anchor never re-renders anything, it only tells the engine
 * (through subscribe) to rebuild its path.
 */
export interface ChainAnchorRegistry {
  setHero: (el: HTMLElement) => void;
  clearHero: (el: HTMLElement) => void;
  addBand: (el: HTMLElement) => void;
  removeBand: (el: HTMLElement) => void;
  /** Current anchors, bands sorted in document order. */
  getAnchors: () => ChainAnchors;
  /** Called (once per batch of changes) whenever an anchor mounts or unmounts. */
  subscribe: (listener: () => void) => () => void;
}

function byDocumentOrder(a: Node, b: Node): number {
  if (a === b) return 0;
  return a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
}

export function createChainAnchorRegistry(): ChainAnchorRegistry {
  let hero: HTMLElement | null = null;
  const bands = new Set<HTMLElement>();
  const listeners = new Set<() => void>();
  let pending = false;

  // Several anchors mount in the same commit; rebuild once for all of them.
  const notify = () => {
    if (pending) return;
    pending = true;
    queueMicrotask(() => {
      pending = false;
      listeners.forEach((listener) => {
        listener();
      });
    });
  };

  return {
    setHero(el) {
      if (hero === el) return;
      hero = el;
      notify();
    },
    clearHero(el) {
      if (hero !== el) return;
      hero = null;
      notify();
    },
    addBand(el) {
      if (bands.has(el)) return;
      bands.add(el);
      notify();
    },
    removeBand(el) {
      if (bands.delete(el)) notify();
    },
    getAnchors() {
      return { hero, bands: [...bands].sort(byDocumentOrder) };
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
}
