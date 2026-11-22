import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

import { LINKS } from '../../data/links';
import { TEES, findTee } from '../../data/tees';
import type { FallCard, FallLabels, FallObjectsData } from '../chain/types';
import { LINK_ART } from '../deck/linkArtMap';
import { WORD_OVERRIDE } from './fall';

/*
 * What the 3D objects of the fall take from the app (the engine stays free of
 * app imports): our deck's cards, drawn from the same link illustrations as the
 * jewelry deck, the labels in the site language, and the T-shirt word band 2
 * spells on this visit.
 */

/** One T-shirt word per visit (src/data/tees.ts); `?word=<id>` picks it in development. */
function pickWord(): string {
  const chosen = WORD_OVERRIDE !== null ? findTee(WORD_OVERRIDE) : undefined;
  if (chosen) return chosen.word;
  const tee = TEES[Math.floor(Math.random() * TEES.length)] ?? TEES[0];
  return tee?.word ?? 'Sonder';
}

/** The word chosen for this page load (kept across engine rebuilds after a context loss). */
let visitWord: string | null = null;

/** Renders each link's line art (deck/linkArt.tsx) once, off screen, to SVG markup. */
function cardsFromDeck(): FallCard[] {
  const host = document.createElement('div');
  const root = createRoot(host);
  const cards = LINKS.flatMap((link) => {
    const Art = LINK_ART[link.id];
    if (!Art) return [];
    flushSync(() => {
      root.render(createElement(Art, { size: 64 }));
    });
    return [{ id: link.id, name: link.name, rank: link.rank, svg: host.innerHTML }];
  });
  root.unmount();
  return cards;
}

export function loadFallObjects(labels: FallLabels): Promise<FallObjectsData> {
  visitWord ??= pickWord();
  return Promise.resolve({ labels, cards: cardsFromDeck(), word: visitWord });
}
