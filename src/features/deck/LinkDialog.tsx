import { useId, useState } from 'react';

import { CUSTOM_SIZE_ID, FORMS, OTHER_FORM_ID, SIZES } from '../../data/forms';
import type { ChainLink } from '../../data/links';
import { useI18n } from '../../i18n';
import { ChipGroup } from '../product/ChipGroup';
import { ProductDialog } from '../product/ProductDialog';
import { WhatsAppButton } from '../product/WhatsAppButton';
import { CardFront } from './CardFaces';
import { buildMessage, EMPTY_CONFIGURATION, type Configuration } from './whatsapp';

interface LinkDialogProps {
  link: ChainLink;
  /** The grid card's face, the FLIP starting point (null for deep links). */
  source: HTMLElement | null;
  onClose: () => void;
}

/**
 * A card's dialog: the shared product dialog with the card large on the left
 * and the link's texts and configurator (form, size) on the right.
 */
export function LinkDialog({ link, source, onClose }: LinkDialogProps) {
  const { t, lang } = useI18n();
  const copy = t.home.deck;
  const [config, setConfig] = useState<Configuration>(EMPTY_CONFIGURATION);
  const titleId = useId();
  const measureHelpId = useId();

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
      media={<CardFront link={link} />}
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
          onChange={(formId) => {
            update({ formId });
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
