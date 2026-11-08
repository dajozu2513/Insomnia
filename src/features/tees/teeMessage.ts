import type { Choice } from '../../data/forms';
import {
  PLACEMENTS,
  PRINT_LANGUAGES,
  TEE_COLOURS,
  TEE_SIZES,
  type Placement,
  type PrintLanguage,
  type Tee,
  type TeeColour,
} from '../../data/tees';
import type { Lang } from '../../i18n';
import { composeMessage } from '../product/whatsapp';

/** What the visitor chose; null until they choose (the line is then left out). */
export interface TeeConfiguration {
  colour: TeeColour | null;
  size: string | null;
  printLanguage: PrintLanguage | null;
  placement: Placement | null;
}

export const EMPTY_TEE_CONFIGURATION: TeeConfiguration = {
  colour: null,
  size: null,
  printLanguage: null,
  placement: null,
};

interface TeeMessageStrings {
  intro: string;
  design: string;
  colour: string;
  size: string;
  printLanguage: string;
  placement: string;
}

function label(options: readonly Choice[], id: string | null, lang: Lang): string | undefined {
  return options.find((option) => option.id === id)?.label[lang];
}

/**
 * The WhatsApp message, e.g.
 *   Hola, me interesa una camiseta de Insomnia:
 *   - Diseño: *Sonder*
 *   - Color: Negra
 *   - Talla: M
 *   - Idioma del estampado: Español
 *   - Estampado: Frente y espalda
 * Lines without a value are left out.
 */
export function buildTeeMessage(
  tee: Tee,
  config: TeeConfiguration,
  lang: Lang,
  strings: TeeMessageStrings,
): string {
  return composeMessage(strings.intro, [
    [strings.design, `*${tee.word}*`],
    [strings.colour, label(TEE_COLOURS, config.colour, lang)],
    [strings.size, label(TEE_SIZES, config.size, lang)],
    [strings.printLanguage, label(PRINT_LANGUAGES, config.printLanguage, lang)],
    [strings.placement, label(PLACEMENTS, config.placement, lang)],
  ]);
}
