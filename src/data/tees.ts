import type { Choice } from './forms';
import type { Localized } from './links';

/*
 * The printed T-shirts (Obscure Human Feelings): the single source of truth for
 * the T-shirt section, its configurator and the /lab print review.
 *
 * A design's `word` is never translated and never gets an i18n key. Its
 * `meaning` is written in our own words (never the original definitions); the
 * words come from The Dictionary of Obscure Sorrows by John Koenig, credited
 * under the grid. Each design has a composition (features/tees/print/), the
 * code-generated print for that word.
 *
 * To add a design: add an entry below (its `id` is the ?tee= deep-link value),
 * add its id to CompositionId, write its composition in
 * features/tees/print/compositions.tsx and map it in compositionMap.ts.
 */

export type CompositionId =
  | 'sonder'
  | 'onism'
  | 'monachopsis'
  | 'nodus-tollens'
  | 'anemoia'
  | 'liberosis'
  | 'exulansis'
  | 'altschmerz'
  | 'zenosyne'
  | 'enouement';

export interface Tee {
  /** Lowercase ASCII slug: ?tee=<id> deep links and React keys. */
  id: string;
  /** Never translated. */
  word: string;
  meaning: Localized;
  composition: CompositionId;
}

export const TEES: readonly Tee[] = [
  {
    id: 'sonder',
    word: 'Sonder',
    meaning: {
      es: 'Darte cuenta de que cada desconocido vive una vida tan intensa y compleja como la tuya.',
      en: 'The realization that every stranger is living a life as vivid and complex as your own.',
    },
    composition: 'sonder',
  },
  {
    id: 'onism',
    word: 'Onism',
    meaning: {
      es: 'La frustración de estar atrapado en un solo cuerpo, en un solo lugar a la vez.',
      en: 'The frustration of being stuck in one body, able to be in only one place at a time.',
    },
    composition: 'onism',
  },
  {
    id: 'monachopsis',
    word: 'Monachopsis',
    meaning: {
      es: 'La sensación sutil y persistente de no pertenecer al lugar donde estás.',
      en: 'The subtle, persistent feeling of being out of place.',
    },
    composition: 'monachopsis',
  },
  {
    id: 'nodus-tollens',
    word: 'Nodus Tollens',
    meaning: {
      es: 'Darte cuenta de que la trama de tu vida ya no tiene sentido para ti.',
      en: 'The realization that the plot of your life no longer makes sense to you.',
    },
    composition: 'nodus-tollens',
  },
  {
    id: 'anemoia',
    word: 'Anemoia',
    meaning: {
      es: 'Nostalgia por una época que nunca viviste.',
      en: 'Nostalgia for a time you never experienced.',
    },
    composition: 'anemoia',
  },
  {
    id: 'liberosis',
    word: 'Liberosis',
    meaning: {
      es: 'El deseo de que las cosas te importen menos.',
      en: 'The desire to care less about things.',
    },
    composition: 'liberosis',
  },
  {
    id: 'exulansis',
    word: 'Exulansis',
    meaning: {
      es: 'Renunciar a contar una experiencia porque nadie puede entenderla.',
      en: 'Giving up on sharing an experience because no one can relate to it.',
    },
    composition: 'exulansis',
  },
  {
    id: 'altschmerz',
    word: 'Altschmerz',
    meaning: {
      es: 'El cansancio de cargar los mismos problemas de siempre.',
      en: 'Weariness with the same old problems you have carried for years.',
    },
    composition: 'altschmerz',
  },
  {
    id: 'zenosyne',
    word: 'Zenosyne',
    meaning: {
      es: 'La sensación de que el tiempo pasa cada vez más rápido.',
      en: 'The sense that time keeps speeding up.',
    },
    composition: 'zenosyne',
  },
  {
    id: 'enouement',
    word: 'Énouement',
    meaning: {
      es: 'La sensación agridulce de llegar al futuro sin poder contarle a tu yo del pasado cómo resultó todo.',
      en: 'The bittersweet feeling of arriving in the future and being unable to tell your past self how it turned out.',
    },
    composition: 'enouement',
  },
];

export function findTee(id: string | null | undefined): Tee | undefined {
  return id ? TEES.find((tee) => tee.id === id) : undefined;
}

/* ── Configurator options ── */

export type TeeColour = 'black' | 'white';
export type PrintLanguage = 'es' | 'en';
export type Placement = 'front' | 'back' | 'both';
export type TeeSide = 'front' | 'back';

export const TEE_COLOURS: readonly (Choice & { id: TeeColour })[] = [
  { id: 'black', label: { es: 'Negra', en: 'Black' } },
  { id: 'white', label: { es: 'Blanca', en: 'White' } },
];

/** Sizes read the same in both languages. */
export const TEE_SIZES: readonly Choice[] = ['XS', 'S', 'M', 'L', 'XL'].map((size) => ({
  id: size.toLowerCase(),
  label: { es: size, en: size },
}));

/** Each language is named in itself, as language pickers do. */
export const PRINT_LANGUAGES: readonly (Choice & { id: PrintLanguage })[] = [
  { id: 'es', label: { es: 'Español', en: 'Español' } },
  { id: 'en', label: { es: 'English', en: 'English' } },
];

export const PLACEMENTS: readonly (Choice & { id: Placement })[] = [
  { id: 'front', label: { es: 'Frente', en: 'Front' } },
  { id: 'back', label: { es: 'Espalda', en: 'Back' } },
  { id: 'both', label: { es: 'Frente y espalda', en: 'Front and back' } },
];

/** The mockup's view toggle in the dialog. */
export const TEE_SIDES: readonly (Choice & { id: TeeSide })[] = [
  { id: 'front', label: { es: 'Frente', en: 'Front' } },
  { id: 'back', label: { es: 'Espalda', en: 'Back' } },
];

/** What the grid shows, and the dialog previews until the visitor chooses. */
export const PREVIEW_DEFAULTS = { colour: 'black', placement: 'both' } as const satisfies {
  colour: TeeColour;
  placement: Placement;
};

/**
 * What a side carries for a placement: the word with its meaning ("full"), the
 * word alone, large ("word": the front of a front-and-back print), or nothing.
 */
export type PrintContent = 'full' | 'word' | null;

export function printContent(placement: Placement, side: TeeSide): PrintContent {
  if (placement === 'both') return side === 'front' ? 'word' : 'full';
  return placement === side ? 'full' : null;
}
