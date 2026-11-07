import { CUSTOM_SIZE_ID, FORMS, OTHER_FORM_ID, SIZES } from '../../data/forms';
import type { ChainLink } from '../../data/links';
import type { Lang } from '../../i18n';

/** Joel's WhatsApp number (same as the legacy site). */
export const WHATSAPP_NUMBER = '50660062513';

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
  const lines = [strings.intro, `- ${strings.link}: *${link.name}*`];

  const form = FORMS.find((f) => f.id === config.formId);
  if (form) {
    const other = config.formId === OTHER_FORM_ID ? config.otherText.trim() : '';
    lines.push(`- ${strings.form}: ${form.label[lang]}${other ? ` (${other})` : ''}`);
  }

  const size = SIZES.find((s) => s.id === config.sizeId);
  if (size) {
    const cm = config.sizeId === CUSTOM_SIZE_ID ? formatMeasure(config.measure, lang) : null;
    lines.push(`- ${strings.size}: ${size.label[lang]}${cm ? ` (${cm} cm)` : ''}`);
  }

  return lines.join('\n');
}

export function whatsappUrl(message: string): string {
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
}
