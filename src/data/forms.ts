import type { Localized } from './links';

/*
 * The forms a link can be made into, and the sizes, for the deck's
 * configurator. Jewelry is a system: link type x form x size
 * (docs/brand/design-direction.md, "Products").
 *
 * To add a form: add an entry here (the id is internal; labels are what the
 * visitor sees and what goes into the WhatsApp message). "other" reveals a
 * free-text field in the configurator.
 */

export interface Choice {
  id: string;
  label: Localized;
}

export const FORMS: readonly Choice[] = [
  { id: 'necklace', label: { es: 'Collar', en: 'Necklace' } },
  { id: 'bracelet', label: { es: 'Pulsera', en: 'Bracelet' } },
  { id: 'anklet', label: { es: 'Tobillera', en: 'Anklet' } },
  { id: 'ring', label: { es: 'Anillo', en: 'Ring' } },
  { id: 'head', label: { es: 'Cadena de cabeza', en: 'Head piece' } },
  { id: 'waist', label: { es: 'Cadena de cintura', en: 'Waist chain' } },
  { id: 'other', label: { es: 'Otra', en: 'Other' } },
];

/** The form whose id reveals the free-text field. */
export const OTHER_FORM_ID = 'other';

export const SIZES: readonly Choice[] = [
  { id: 'standard', label: { es: 'Estándar', en: 'Standard' } },
  { id: 'custom', label: { es: 'A la medida', en: 'Made to measure' } },
];

/** The size whose id reveals the measurement field. */
export const CUSTOM_SIZE_ID = 'custom';

/**
 * Lengths of the 3D preview, cm (the whole chain; a ring's is its
 * circumference): the standard length of each form, and the range a made to
 * measure length is held to.
 */
export interface PieceLength {
  standard: number;
  min: number;
  max: number;
}

export const PIECE_LENGTHS: Readonly<Record<string, PieceLength>> = {
  necklace: { standard: 45, min: 35, max: 90 },
  bracelet: { standard: 18, min: 14, max: 24 },
  anklet: { standard: 24, min: 20, max: 30 },
  ring: { standard: 5.7, min: 4.4, max: 7.5 },
  head: { standard: 55, min: 45, max: 70 },
  waist: { standard: 80, min: 60, max: 130 },
  other: { standard: 30, min: 5, max: 100 },
};

/**
 * The length the preview shows for a form: the made to measure value (a cm
 * string, "18" or "18,5") held to the form's range, or the standard length.
 */
export function pieceLength(formId: string, measure: string | null): number {
  const range = PIECE_LENGTHS[formId] ?? PIECE_LENGTHS.other;
  if (!range) return 30;
  const value = measure === null ? NaN : Number(measure.trim().replace(',', '.'));
  if (!measure?.trim() || !Number.isFinite(value) || value <= 0) return range.standard;
  return Math.min(Math.max(value, range.min), range.max);
}
