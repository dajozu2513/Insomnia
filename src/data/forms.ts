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
