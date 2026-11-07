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
    // PLACEHOLDER: the home page sections are ported in later steps.
    placeholder: '[Home content pending]',
  },
  notFound: {
    // PLACEHOLDER: 404 copy pending.
    title: '[Page not found]',
    back: 'Back to home',
  },
};
