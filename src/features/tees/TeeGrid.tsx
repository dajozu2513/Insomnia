import { findTee, PREVIEW_DEFAULTS, TEES } from '../../data/tees';
import { useInView } from '../../hooks/useInView';
import { useI18n } from '../../i18n';
import { useProductDialog } from '../product/useProductDialog';
import { TeeDialog } from './TeeDialog';
import { TeeMockup } from './TeeMockup';
import './tees.css';

/**
 * The printed T-shirts: the ten designs as black tees, a close crop on the chest
 * print, the same frame for all ten (5 x 2
 * on desktop, two columns on phones), revealed with a calm stagger the first
 * time the grid comes into view. Selecting one opens its dialog and
 * configurator; ?tee=<id> opens it on load. The credit line sits under the grid.
 */
export function TeeGrid() {
  const { t, lang } = useI18n();
  const copy = t.home.tees;
  const [gridRef, visible] = useInView<HTMLUListElement>(0.15);
  const dialog = useProductDialog('tee', findTee);

  return (
    <>
      <ul
        ref={gridRef}
        className={visible ? 'tees is-visible' : 'tees'}
        aria-label={copy.listLabel}
      >
        {TEES.map((tee, i) => (
          <li key={tee.id} className="tee-slot" style={{ '--i': i }}>
            <button
              ref={dialog.triggerRef(tee.id)}
              type="button"
              className="tee-card"
              aria-label={`${tee.word}, ${copy.item}`}
              aria-haspopup="dialog"
              onClick={() => {
                dialog.openItem(tee);
              }}
            >
              <span ref={dialog.sourceRef(tee.id)} className="tee-figure tee-figure--crop">
                <TeeMockup
                  tee={tee}
                  colour={PREVIEW_DEFAULTS.colour}
                  lang={lang}
                  side="front"
                  placement={PREVIEW_DEFAULTS.placement}
                  crop
                />
              </span>
              <span className="tee-name" aria-hidden="true">
                {tee.word}
              </span>
            </button>
          </li>
        ))}
      </ul>

      <p className="tees-credit">
        {copy.credit.before}
        <cite>{copy.credit.title}</cite>
        {copy.credit.after}
      </p>

      {dialog.open && (
        <TeeDialog
          key={dialog.open.item.id}
          tee={dialog.open.item}
          source={dialog.open.source}
          onClose={dialog.closeItem}
        />
      )}
    </>
  );
}
