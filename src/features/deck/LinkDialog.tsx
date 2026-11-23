import { useId, useState } from 'react';

import { CUSTOM_SIZE_ID, FORMS, OTHER_FORM_ID, pieceLength, SIZES } from '../../data/forms';
import type { ChainLink } from '../../data/links';
import { useI18n } from '../../i18n';
import { ChipGroup } from '../product/ChipGroup';
import { ProductDialog } from '../product/ProductDialog';
import { WhatsAppButton } from '../product/WhatsAppButton';
import { PieceFlip } from './PieceFlip';
import { canPreviewPiece } from './piecePreview';
import { buildMessage, EMPTY_CONFIGURATION, type Configuration } from './whatsapp';

/** A length in cm for the preview's accessible name: "18", "18,5". */
function centimetres(value: number, lang: string): string {
  return new Intl.NumberFormat(lang === 'es' ? 'es-CR' : 'en-US', {
    maximumFractionDigits: 1,
  }).format(value);
}

interface LinkDialogProps {
  link: ChainLink;
  /** The grid card's face, the FLIP starting point (null for deep links). */
  source: HTMLElement | null;
  onClose: () => void;
}

/**
 * A card's dialog: the shared product dialog with the card large on the left
 * and the link's texts and configurator (form, size) on the right. Choosing a
 * form turns the card over: its back is a 3D preview of the piece (the link
 * along the form, at the chosen length), and a button turns it back.
 */
export function LinkDialog({ link, source, onClose }: LinkDialogProps) {
  const { t, lang } = useI18n();
  const copy = t.home.deck;
  const [config, setConfig] = useState<Configuration>(EMPTY_CONFIGURATION);
  const titleId = useId();
  const measureHelpId = useId();
  const [unavailable, setUnavailable] = useState(() => !canPreviewPiece());
  const [showPiece, setShowPiece] = useState(false);

  const custom = config.sizeId === CUSTOM_SIZE_ID;
  const formId = unavailable ? null : config.formId;
  const spec = formId
    ? { link: link.id, form: formId, length: pieceLength(formId, custom ? config.measure : null) }
    : null;
  const preview = copy.preview;
  const formName = formId
    ? (preview.forms as Record<string, string | undefined>)[formId]
    : undefined;
  const label = spec
    ? preview.label
        .replace('{form}', formName ?? '')
        .replace('{link}', link.name)
        .replace(
          '{size}',
          custom ? `${preview.custom}, ${centimetres(spec.length, lang)} cm` : preview.standard,
        )
    : link.name;

  const message = buildMessage(link, config, lang, copy.whatsapp);
  const update = (patch: Partial<Configuration>) => {
    setConfig((current) => ({ ...current, ...patch }));
  };

  return (
    <ProductDialog
      className="product-dialog--link"
      labelledBy={titleId}
      source={source}
      onClose={onClose}
      media={
        <PieceFlip
          link={link}
          spec={spec}
          showPiece={showPiece && spec !== null}
          label={label}
          onUnavailable={() => {
            setUnavailable(true);
            setShowPiece(false);
          }}
        />
      }
      mediaFooter={
        spec && (
          <button
            type="button"
            className="piece-toggle"
            onClick={() => {
              setShowPiece((shown) => !shown);
            }}
          >
            {showPiece ? preview.viewCard : preview.viewPiece}
          </button>
        )
      }
    >
      <h2 id={titleId} className="product-dialog-name">
        {link.name}
      </h2>
      <p className="product-dialog-type">{link.chainType[lang]}</p>
      <p className="product-dialog-text">{link.technical[lang]}</p>
      <p className="product-dialog-poetic">{link.poetic[lang]}</p>

      <form
        className="configurator"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <ChipGroup
          legend={copy.form}
          name="form"
          options={FORMS}
          value={config.formId}
          onChange={(value) => {
            update({ formId: value });
            // Choosing a form turns the card over to show the piece
            if (!unavailable) setShowPiece(true);
          }}
        >
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
        </ChipGroup>

        <ChipGroup
          legend={copy.size}
          name="size"
          options={SIZES}
          value={config.sizeId}
          onChange={(sizeId) => {
            update({ sizeId });
          }}
        >
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
        </ChipGroup>
      </form>

      <WhatsAppButton message={message} />
    </ProductDialog>
  );
}
