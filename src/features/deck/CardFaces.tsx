import type { Ref } from 'react';

import type { ChainLink } from '../../data/links';
import { FiligreeDivider } from '../motifs';
import { LINK_ART } from './linkArtMap';
import { VoidLink } from './linkArt';

interface CardFrontProps {
  link: ChainLink;
  ref?: Ref<HTMLSpanElement>;
}

/**
 * The card's face: the link drawn in the middle, its name below in small
 * capitals, and the rank in two corners with a tiny link as its suit mark
 * (the bottom corner turned 180 degrees). The suit mark is the only part that
 * may turn red, and only on the hovered, focused or selected card.
 */
export function CardFront({ link, ref }: CardFrontProps) {
  const Art = LINK_ART[link.id] ?? VoidLink;
  const corner = (position: 'top' | 'bottom') => (
    <span className={`deck-corner deck-corner--${position}`}>
      <span className="deck-rank">{link.rank}</span>
      <Art className="deck-suit" size={14} />
    </span>
  );
  return (
    <span ref={ref} className="deck-face deck-front" aria-hidden="true">
      <span className="deck-frame" />
      {corner('top')}
      <span className="deck-art">
        <Art size={96} />
      </span>
      <span className="deck-name">{link.name}</span>
      {corner('bottom')}
    </span>
  );
}

/** The card's back: a chessboard inside a thin filigree frame, line art for dark. */
export function CardBack() {
  return (
    <span className="deck-face deck-back" aria-hidden="true">
      <span className="deck-back-pattern" />
      <span className="deck-back-frame" />
      <FiligreeDivider className="deck-back-filigree deck-back-filigree--top" size={120} />
      <FiligreeDivider className="deck-back-filigree deck-back-filigree--bottom" size={120} />
    </span>
  );
}
