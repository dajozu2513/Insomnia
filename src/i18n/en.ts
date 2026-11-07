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
  // Approved taglines (docs/brand/design-direction.md).
  brand: {
    heroTagline: 'Everything you feel while the world sleeps.',
    metaTagline: "Steel and words for those who don't sleep.",
  },
  // 12-hour periods for the night clock: "6:00 PM"
  clock: {
    am: 'AM',
    pm: 'PM',
  },
  footer: {
    rights: 'All rights reserved',
  },
  home: {
    hero: {
      // Brand name: identical in both languages. The hero line is brand.heroTagline.
      title: 'Insomnia',
      sub: 'by Joel Soto',
    },
    pillarsLabel: 'Pillars',
    // Order matters: icons are a chain link, an open quotation mark and a crescent moon.
    pillars: [
      {
        title: 'Steel',
        text: "Handmade stainless steel pieces. What doesn't rust, remains.",
      },
      {
        title: 'Words',
        text: 'Words for feelings that had no name yet, printed to wear.',
      },
      {
        title: 'Vigil',
        text: 'Designed in the hours when everyone else sleeps. Black and white, like the night and the screen.',
      },
    ],
    band1: 'Steel remembers what the night forgets.',
    band2: {
      // The word is not translated.
      word: 'Sonder',
      meaning:
        'The realization that every stranger is living a life as vivid and complex as your own.',
    },
    // Section headings: a roman lead and an italic tail, as in the legacy titles.
    jewelry: {
      lead: 'Steel',
      em: 'jewelry',
      // PLACEHOLDER: the jewelry deck arrives in a later step.
      body: '[Link deck pending]',
    },
    tshirts: {
      lead: 'Printed',
      em: 'T-shirts',
      // PLACEHOLDER: the T-shirt section arrives in a later step.
      body: '[T-shirts pending]',
    },
    readings: {
      lead: 'Readings',
      em: '',
      // PLACEHOLDER: the readings arrive in a later step.
      body: '[Readings pending]',
    },
  },
  notFound: {
    // PLACEHOLDER: 404 copy pending.
    title: '[Page not found]',
    back: 'Back to home',
  },
  // Internal design lab at /lab (not linked, noindex).
  lab: {
    pageTitle: 'Visual lab | Insomnia',
    eyebrow: 'Internal',
    title: 'Visual lab',
    intro: 'The new design direction, piece by piece, to review before it reaches the home page.',
    palette: {
      title: 'Palette',
      text: 'Black and white shifted toward night and aged paper, with one accent only: blood red.',
      contrastTitle: 'Measured contrast',
      contrastText:
        'Read from the live tokens. Text: AA needs 4.5:1 (3:1 for large text). Lines and ornaments: 3:1.',
      textColumn: 'Colour',
      pass: 'AA',
      passLarge: 'Large text only',
      passGraphic: 'Lines (3:1)',
      fail: 'Fails',
      notUsed: 'Not intended',
      roles: {
        ink: 'Near-black, main dark background',
        inkRaised: 'Dark surfaces, cards on dark',
        bone: 'Aged paper, main light background',
        boneDeep: 'Light surfaces, rules on light',
        textOnDark: 'Text on dark',
        textOnDarkMuted: 'Secondary text on dark (added)',
        textOnLight: 'Text on light',
        textOnLightMuted: 'Secondary text on light (added)',
        steel: 'Thin lines and ornaments on dark',
        accent: 'Blood red: one focal point; text on light only',
        accentGlow: 'Glows and light only, never fills',
      },
    },
    type: {
      title: 'Typography',
      text: 'Headings in Cormorant Garamond, body in EB Garamond; Montserrat for labels, UI and the clock.',
      faces: 'Body: EB Garamond, labels: Montserrat',
      onBone: 'On bone',
      onInk: 'On ink',
      label: 'Read',
    },
    clock: {
      title: 'Night clock',
      text: 'From 6:00 PM at the top to 6:00 AM at the bottom. Tabular figures and a fixed width: nothing moves from 9:59 to 10:00.',
      measured: 'Measured width',
    },
    motifs: {
      title: 'Motifs',
      text: 'Thin line art in the same stroke as the pillar icons. One motif per section at most.',
      chessboard: 'Chessboard',
      filigree: 'Filigree',
      rose: 'Rose',
      key: 'Key',
      clockFace: 'Clock face',
    },
    card: {
      title: 'Card',
      text: 'Front with the link, name and index; back with a chessboard. Click the card to turn it over.',
      front: 'Front',
      back: 'Back',
      interactive: 'Interactive',
      flip: 'Turn the card',
      // PLACEHOLDER: oval link drawing until the nine link illustrations exist.
      sampleName: 'Void',
      sampleIndex: '1',
    },
    atmosphere: {
      title: 'Atmosphere',
      text: 'Layered mist, a soft vignette and the existing grain over an ink panel.',
    },
  },
};
