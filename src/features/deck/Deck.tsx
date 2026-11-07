import { useCallback, useEffect, useRef, useState } from 'react';

import { findLink, LINKS, type ChainLink } from '../../data/links';
import { useInView } from '../../hooks/useInView';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useI18n } from '../../i18n';
import { CardBack, CardFront } from './CardFaces';
import { LinkDialog } from './LinkDialog';
import './deck.css';

/** URL parameter for deep links: ?link=<id> opens that card's dialog. */
const LINK_PARAM = 'link';

function readLinkParam(): ChainLink | undefined {
  try {
    return findLink(new URLSearchParams(window.location.search).get(LINK_PARAM));
  } catch {
    return undefined;
  }
}

/** Keeps ?link= in sync with the open dialog without adding history entries. */
function writeLinkParam(id: string | null): void {
  const url = new URL(window.location.href);
  if (id) url.searchParams.set(LINK_PARAM, id);
  else url.searchParams.delete(LINK_PARAM);
  window.history.replaceState(window.history.state, '', url);
}

/** Lowercase first letter, for the accessible name "Void, paperclip". */
function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/**
 * The jewelry deck: the nine links as playing cards, dealt face up one by one
 * the first time the section comes into view (face up from the start with
 * reduced motion). Selecting a card opens its dialog and configurator.
 */
export function Deck() {
  const { t, lang } = useI18n();
  const reducedMotion = usePrefersReducedMotion();
  const [deckRef, inView] = useInView<HTMLUListElement>(0.2);
  const dealt = reducedMotion || inView;

  // The open card and the grid face it flies from (null for a deep link: no FLIP)
  const [open, setOpen] = useState<{ link: ChainLink; source: HTMLElement | null } | undefined>(
    () => {
      const link = readLinkParam();
      return link ? { link, source: null } : undefined;
    },
  );
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const fronts = useRef(new Map<string, HTMLSpanElement>());

  const openLink = useCallback((link: ChainLink) => {
    setOpen({ link, source: fronts.current.get(link.id) ?? null });
    writeLinkParam(link.id);
  }, []);

  // Focus goes back to the card once the dialog has closed (and the page is no longer inert).
  const returnFocusTo = useRef<string | null>(null);
  const closeLink = useCallback(() => {
    returnFocusTo.current = open?.link.id ?? null;
    setOpen(undefined);
    writeLinkParam(null);
  }, [open]);

  useEffect(() => {
    if (open || !returnFocusTo.current) return;
    buttons.current.get(returnFocusTo.current)?.focus();
    returnFocusTo.current = null;
  }, [open]);

  return (
    <>
      <ul
        ref={deckRef}
        className={dealt ? 'deck is-dealt' : 'deck'}
        aria-label={t.home.deck.listLabel}
      >
        {LINKS.map((link, i) => (
          <li key={link.id} className="deck-slot" style={{ '--i': i }}>
            <button
              ref={(el) => {
                if (el) buttons.current.set(link.id, el);
                else buttons.current.delete(link.id);
              }}
              type="button"
              className="deck-card"
              aria-label={`${link.name}, ${lowerFirst(link.chainType[lang])}`}
              aria-haspopup="dialog"
              onClick={() => {
                openLink(link);
              }}
            >
              <span className="deck-card-inner">
                <CardFront
                  link={link}
                  ref={(el) => {
                    if (el) fronts.current.set(link.id, el);
                    else fronts.current.delete(link.id);
                  }}
                />
                <CardBack />
              </span>
            </button>
          </li>
        ))}
      </ul>
      {open && (
        <LinkDialog key={open.link.id} link={open.link} source={open.source} onClose={closeLink} />
      )}
    </>
  );
}
