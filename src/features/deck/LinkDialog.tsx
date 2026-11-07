import { useCallback, useId, useLayoutEffect, useRef, useState } from 'react';

import { CUSTOM_SIZE_ID, FORMS, OTHER_FORM_ID, SIZES } from '../../data/forms';
import type { ChainLink } from '../../data/links';
import { usePrefersReducedMotion } from '../../hooks/usePrefersReducedMotion';
import { useI18n } from '../../i18n';
import { CardFront } from './CardFaces';
import { buildMessage, EMPTY_CONFIGURATION, whatsappUrl, type Configuration } from './whatsapp';
import './dialog.css';

/** Legacy timings: the card flies in for 750 ms, the dialog fades out in 350 ms. */
const FLIP_MS = 750;
const CLOSE_MS = 350;

interface LinkDialogProps {
  link: ChainLink;
  /** The grid card's face, the FLIP starting point (null for deep links). */
  source: HTMLElement | null;
  onClose: () => void;
}

/**
 * The card dialog (ported from the legacy product modal): a native modal
 * <dialog> on the page's paper, the card large on the left (stacked on
 * phones) and the link's texts and configurator on the right. The card flies
 * in from the deck (FLIP); overlay and panel animate only their background
 * colour, so the flying card never fades. showModal() gives aria-modal, moves
 * focus in and makes the page inert (focus stays inside); Escape and a click on
 * the backdrop close it; the page behind does not scroll.
 */
export function LinkDialog({ link, source, onClose }: LinkDialogProps) {
  const { t, lang } = useI18n();
  const copy = t.home.deck;
  const reducedMotion = usePrefersReducedMotion();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cardRef = useRef<HTMLSpanElement>(null);
  const [closing, setClosing] = useState(false);
  const [config, setConfig] = useState<Configuration>(EMPTY_CONFIGURATION);
  const titleId = useId();
  const measureHelpId = useId();

  // Open as a modal, lock the page behind, and fly the card in from the deck.
  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
    const root = document.documentElement;
    const previousOverflow = root.style.overflow;
    root.style.overflow = 'hidden';

    let animation: Animation | undefined;
    const card = cardRef.current;
    const from = source?.getBoundingClientRect();
    const onScreen = from && from.bottom > 0 && from.top < window.innerHeight && from.width > 0;
    if (card && from && onScreen && !reducedMotion) {
      const to = card.getBoundingClientRect();
      animation = card.animate(
        [
          {
            transformOrigin: 'top left',
            transform: `translate(${String(from.left - to.left)}px, ${String(from.top - to.top)}px) scale(${String(from.width / to.width)})`,
          },
          { transformOrigin: 'top left', transform: 'none' },
        ],
        { duration: FLIP_MS, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
      );
    }

    return () => {
      animation?.cancel();
      root.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
    };
    // Runs once per dialog (the component is keyed by link id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestClose = useCallback(() => {
    if (closing) return;
    setClosing(true);
    window.setTimeout(onClose, reducedMotion ? 0 : CLOSE_MS);
  }, [closing, onClose, reducedMotion]);

  const message = buildMessage(link, config, lang, copy.whatsapp);
  const update = (patch: Partial<Configuration>) => {
    setConfig((current) => ({ ...current, ...patch }));
  };

  return (
    <dialog
      ref={dialogRef}
      className={closing ? 'link-dialog is-closing' : 'link-dialog'}
      aria-labelledby={titleId}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault(); // Escape: close with the fade
        requestClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) requestClose(); // the backdrop
      }}
    >
      <div className="link-dialog-panel">
        <button
          type="button"
          className="link-dialog-close"
          aria-label={copy.close}
          onClick={requestClose}
        >
          &times;
        </button>

        <div className="link-dialog-card">
          <div className="link-dialog-card-face">
            <CardFront link={link} ref={cardRef} />
          </div>
        </div>

        <div className="link-dialog-body">
          <h2 id={titleId} className="link-dialog-name">
            {link.name}
          </h2>
          <p className="link-dialog-type">{link.chainType[lang]}</p>
          <p className="link-dialog-technical">{link.technical[lang]}</p>
          <p className="link-dialog-poetic">{link.poetic[lang]}</p>

          <form
            className="configurator"
            onSubmit={(event) => {
              event.preventDefault();
            }}
          >
            <fieldset className="configurator-group">
              <legend className="configurator-legend">{copy.form}</legend>
              <div className="chips">
                {FORMS.map((form) => (
                  <label key={form.id} className="chip">
                    <input
                      type="radio"
                      name="form"
                      value={form.id}
                      checked={config.formId === form.id}
                      onChange={() => {
                        update({ formId: form.id });
                      }}
                    />
                    <span>{form.label[lang]}</span>
                  </label>
                ))}
              </div>
              {config.formId === OTHER_FORM_ID && (
                <label className="configurator-field">
                  <span className="configurator-field-label">{copy.otherPrompt}</span>
                  <input
                    type="text"
                    className="configurator-input"
                    maxLength={80}
                    value={config.otherText}
                    onChange={(event) => {
                      update({ otherText: event.target.value });
                    }}
                  />
                </label>
              )}
            </fieldset>

            <fieldset className="configurator-group">
              <legend className="configurator-legend">{copy.size}</legend>
              <div className="chips">
                {SIZES.map((size) => (
                  <label key={size.id} className="chip">
                    <input
                      type="radio"
                      name="size"
                      value={size.id}
                      checked={config.sizeId === size.id}
                      onChange={() => {
                        update({ sizeId: size.id });
                      }}
                    />
                    <span>{size.label[lang]}</span>
                  </label>
                ))}
              </div>
              {config.sizeId === CUSTOM_SIZE_ID && (
                <label className="configurator-field">
                  <span className="configurator-field-label">{copy.measureLabel}</span>
                  <input
                    type="text"
                    inputMode="decimal"
                    className="configurator-input configurator-input--short"
                    maxLength={6}
                    aria-describedby={measureHelpId}
                    value={config.measure}
                    onChange={(event) => {
                      update({ measure: event.target.value });
                    }}
                  />
                  <span id={measureHelpId} className="configurator-help">
                    {copy.measureHelper}
                  </span>
                </label>
              )}
            </fieldset>
          </form>

          <a
            className="link-dialog-cta"
            href={whatsappUrl(message)}
            target="_blank"
            rel="noopener noreferrer"
          >
            {copy.cta}
            <span className="visually-hidden"> {copy.newTab}</span>
          </a>
        </div>
      </div>
    </dialog>
  );
}
