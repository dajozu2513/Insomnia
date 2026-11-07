import type { Dictionary } from './types';

/*
 * English dictionary. Typed as Dictionary, so a key missing here, or a key
 * that does not exist in es.ts, is a compile error.
 *
 * Strings wrapped in [brackets] are PLACEHOLDERS for copy that has not been
 * written yet.
 */
export const en: Dictionary = {
  meta: {
    siteName: 'Insomnia by Joel Soto',
  },
  a11y: {
    skipToContent: 'Skip to content',
    homeLink: 'Insomnia by Joel Soto, go to home page',
    languageGroup: 'Idioma / Language',
    languageNames: {
      es: 'Español',
      en: 'English',
    },
  },
  header: {
    tagline: 'Steel • Words',
  },
  footer: {
    rights: 'All rights reserved',
  },
  home: {
    hero: {
      // Brand name: identical in both languages.
      title: 'Insomnia',
      sub: 'by Joel Soto',
    },
    // PLACEHOLDER: band phrases pending. Kept about as long as the legacy
    // phrases so the drapes can be checked against a realistic line.
    band1: '[Phrase for the first band]',
    band2: '[Phrase for the second band]',
    // PLACEHOLDER: temporary opaque sections, designed in step 3.
    section1: '[Section pending]',
    section2: '[Section pending]',
    section3: '[Section pending]',
  },
  notFound: {
    // PLACEHOLDER: 404 copy pending.
    title: '[Page not found]',
    back: 'Back to home',
  },
};
