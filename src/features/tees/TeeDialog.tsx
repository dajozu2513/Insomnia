import { useId, useState } from 'react';

import {
  PLACEMENTS,
  PREVIEW_DEFAULTS,
  PRINT_LANGUAGES,
  TEE_COLOURS,
  TEE_SIDES,
  TEE_SIZES,
  type Tee,
  type TeeSide,
} from '../../data/tees';
import { useI18n } from '../../i18n';
import { ChipGroup } from '../product/ChipGroup';
import { ProductDialog } from '../product/ProductDialog';
import { WhatsAppButton } from '../product/WhatsAppButton';
import { buildTeeMessage, EMPTY_TEE_CONFIGURATION, type TeeConfiguration } from './teeMessage';
import { GRID_CROP_FRACTION } from './teeGeometry';
import { TeeMockup } from './TeeMockup';

interface TeeDialogProps {
  tee: Tee;
  /** The grid mockup, the FLIP starting point (null for deep links). */
  source: HTMLElement | null;
  onClose: () => void;
}

/**
 * A T-shirt's dialog: the shared product dialog with the mockup on the left
 * (front/back toggle under it) and the word, its meaning in the site language
 * and the configurator on the right. The mockup follows every choice live;
 * until the visitor chooses, it previews the grid's black tee, printed front
 * and back, with the meaning in the site language.
 */
export function TeeDialog({ tee, source, onClose }: TeeDialogProps) {
  const { t, lang } = useI18n();
  const copy = t.home.tees;
  const [config, setConfig] = useState<TeeConfiguration>(EMPTY_TEE_CONFIGURATION);
  const [side, setSide] = useState<TeeSide>('front');
  const titleId = useId();

  const colour = config.colour ?? PREVIEW_DEFAULTS.colour;
  const placement = config.placement ?? PREVIEW_DEFAULTS.placement;
  const printLanguage = config.printLanguage ?? lang;
  const hasPrint = placement === 'both' || placement === side;
  const mockupLabel = [
    `${copy.mockup.tee} ${tee.word}`,
    copy.mockup[colour],
    copy.mockup[side],
    ...(hasPrint ? [] : [copy.mockup.blank]),
  ].join(', ');

  const message = buildTeeMessage(tee, config, lang, copy.whatsapp);
  const update = (patch: Partial<TeeConfiguration>) => {
    setConfig((current) => ({ ...current, ...patch }));
  };

  return (
    <ProductDialog
      className="product-dialog--tee"
      labelledBy={titleId}
      source={source}
      sourceCrop={GRID_CROP_FRACTION}
      onClose={onClose}
      media={
        <TeeMockup
          tee={tee}
          colour={colour}
          lang={printLanguage}
          side={side}
          placement={placement}
          label={mockupLabel}
        />
      }
      mediaFooter={
        <div className="tee-view">
          <ChipGroup
            legend={copy.view}
            name="view"
            options={TEE_SIDES}
            value={side}
            onChange={setSide}
          />
        </div>
      }
    >
      <h2 id={titleId} className="product-dialog-name">
        {tee.word}
      </h2>
      <p className="product-dialog-poetic tee-meaning">{tee.meaning[lang]}</p>

      <form
        className="configurator"
        onSubmit={(event) => {
          event.preventDefault();
        }}
      >
        <ChipGroup
          legend={copy.colour}
          name="colour"
          options={TEE_COLOURS}
          value={config.colour}
          onChange={(value) => {
            update({ colour: value });
          }}
        />
        <ChipGroup
          legend={copy.size}
          name="size"
          options={TEE_SIZES}
          value={config.size}
          onChange={(value) => {
            update({ size: value });
          }}
        />
        <ChipGroup
          legend={copy.printLanguage}
          name="print-language"
          options={PRINT_LANGUAGES}
          value={config.printLanguage}
          onChange={(value) => {
            update({ printLanguage: value });
          }}
        />
        <ChipGroup
          legend={copy.placement}
          name="placement"
          options={PLACEMENTS}
          value={config.placement}
          onChange={(value) => {
            update({ placement: value });
            // Show the side that carries the print
            if (value !== 'both') setSide(value);
          }}
        />
      </form>

      <WhatsAppButton message={message} />
    </ProductDialog>
  );
}
