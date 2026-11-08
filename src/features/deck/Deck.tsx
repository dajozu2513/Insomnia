import { findLink, LINKS } from '../../data/links';
import { useInView } from '../../hooks/useInView';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useI18n } from '../../i18n';
import { useProductDialog } from '../product/useProductDialog';
import { CardBack, CardFront } from './CardFaces';
import { LinkDialog } from './LinkDialog';
import './deck.css';

/** Lowercase first letter, for the accessible name "Void, paperclip". */
function lowerFirst(text: string): string {
  return text.charAt(0).toLowerCase() + text.slice(1);
}

/**
 * The jewelry deck: the nine links as playing cards, dealt face up one by one
 * the first time the section comes into view (face up from the start with
 * reduced motion). Selecting a card opens its dialog and configurator;
 * ?link=<id> opens it on load.
 */
export function Deck() {
  const { t, lang } = useI18n();
  const reducedMotion = usePrefersReducedMotion();
  const [deckRef, inView] = useInView<HTMLUListElement>(0.2);
  const dealt = reducedMotion || inView;
  const dialog = useProductDialog('link', findLink);

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
              ref={dialog.triggerRef(link.id)}
              type="button"
              className="deck-card"
              aria-haspopup="dialog"
              onClick={() => {
                dialog.openItem(link);
              }}
            >
              {/* The name comes from this text (the drawn card is decorative): "Void, clip" */}
              <span className="visually-hidden">
                {link.name}, {lowerFirst(link.chainType[lang])}
              </span>
              <span className="deck-card-inner">
                <CardFront link={link} ref={dialog.sourceRef(link.id)} />
                <CardBack />
              </span>
            </button>
          </li>
        ))}
      </ul>
      {dialog.open && (
        <LinkDialog
          key={dialog.open.item.id}
          link={dialog.open.item}
          source={dialog.open.source}
          onClose={dialog.closeItem}
        />
      )}
    </>
  );
}
