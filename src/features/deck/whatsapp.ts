import { CUSTOM_SIZE_ID, FORMS, OTHER_FORM_ID, SIZES } from '../../data/forms';
import type { ChainLink } from '../../data/links';
import type { Lang } from '../../i18n';
import { composeMessage } from '../product/whatsapp';

/** What the visitor chose in the configurator. */
export interface Configuration {
  formId: string | null;
  /** Free text when the form is "other". */
  otherText: string;
  sizeId: string | null;
  /** Raw measurement input in cm when the size is made to measure. */
  measure: string;
}

export const EMPTY_CONFIGURATION: Configuration = {
  formId: null,
  otherText: '',
  sizeId: null,
  measure: '',
};

interface MessageStrings {
  intro: string;
  link: string;
  form: string;
  size: string;
}

/** "18", "18.5" or "18,5" -> localized number, or null when it is not a positive number. */
export function formatMeasure(raw: string, lang: Lang): string | null {
  const value = Number(raw.trim().replace(',', '.'));
  if (!raw.trim() || !Number.isFinite(value) || value <= 0) return null;
  return new Intl.NumberFormat(lang === 'es' ? 'es-CR' : 'en-US', {
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * The WhatsApp message, e.g.
 *   Hola, me interesa una pieza de Insomnia:
 *   - Eslabón: *Void*
 *   - Forma: Pulsera
 *   - Medida: A la medida (18 cm)
 * Lines without a value are left out.
 */
export function buildMessage(
  link: ChainLink,
  config: Configuration,
  lang: Lang,
  strings: MessageStrings,
): string {
  const form = FORMS.find((f) => f.id === config.formId);
  const other = config.formId === OTHER_FORM_ID ? config.otherText.trim() : '';
  const size = SIZES.find((s) => s.id === config.sizeId);
  const cm = config.sizeId === CUSTOM_SIZE_ID ? formatMeasure(config.measure, lang) : null;

  return composeMessage(strings.intro, [
    [strings.link, `*${link.name}*`],
    [strings.form, form && `${form.label[lang]}${other ? ` (${other})` : ''}`],
    [strings.size, size && `${size.label[lang]}${cm ? ` (${cm} cm)` : ''}`],
  ]);
}
