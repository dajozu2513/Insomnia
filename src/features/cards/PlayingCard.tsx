import { useState, type ReactNode } from 'react';

import './PlayingCard.css';

interface CardFrontProps {
  name: string;
  /** Corner index, e.g. the link's number in the deck. */
  index: string;
  illustration: ReactNode;
}

/** Reality side: bone paper, link drawing, name, corner indices. */
export function CardFront({ name, index, illustration }: CardFrontProps) {
  return (
    <span className="card-face card-front">
      <span className="card-frame" aria-hidden="true" />
      <span className="card-index card-index--top" aria-hidden="true">
        <span className="card-index-value">{index}</span>
        <span className="card-pip" />
      </span>
      <span className="card-illustration">{illustration}</span>
      <span className="card-name">{name}</span>
      <span className="card-index card-index--bottom" aria-hidden="true">
        <span className="card-index-value">{index}</span>
        <span className="card-pip" />
      </span>
    </span>
  );
}

/** Dream side: a quiet chessboard inside a double steel frame. */
export function CardBack() {
  return (
    <span className="card-face card-back">
      <span className="card-back-pattern" aria-hidden="true" />
      <span className="card-frame card-frame--steel" aria-hidden="true" />
    </span>
  );
}

interface FlipCardProps extends CardFrontProps {
  /** Accessible label of the button, e.g. "Turn the card". */
  flipLabel: string;
}

/**
 * A playing card that turns over slowly on click (instantly with reduced
 * motion). The button is pressed while the back is showing.
 */
export function FlipCard({ flipLabel, ...front }: FlipCardProps) {
  const [showBack, setShowBack] = useState(false);
  return (
    <button
      type="button"
      className={showBack ? 'flip-card is-flipped' : 'flip-card'}
      aria-pressed={showBack}
      aria-label={`${flipLabel}: ${front.name}`}
      onClick={() => {
        setShowBack((value) => !value);
      }}
    >
      <span className="flip-card-inner">
        <CardFront {...front} />
        <CardBack />
      </span>
    </button>
  );
}

/** A single, non-interactive face, for specimens. */
export function StaticCard({ children }: { children: ReactNode }) {
  return <div className="static-card">{children}</div>;
}
