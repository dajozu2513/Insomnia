/*
 * Spanish dictionary. Spanish is the default language and this object is the
 * schema: its shape defines the Dictionary type, so every key added here must
 * also be added to en.ts (and en.ts cannot hold keys that are missing here).
 *
 * Strings wrapped in [brackets] are PLACEHOLDERS for copy that has not been
 * written yet. Replace them; do not ship them.
 */
export const es = {
  meta: {
    siteName: 'Insomnia by Joel Soto',
  },
  a11y: {
    skipToContent: 'Saltar al contenido',
    homeLink: 'Insomnia by Joel Soto, ir al inicio',
    languageGroup: 'Idioma / Language',
    languageNames: {
      es: 'Español',
      en: 'English',
    },
  },
  header: {
    tagline: 'Acero • Palabra',
  },
  footer: {
    rights: 'Todos los derechos reservados',
  },
  home: {
    // PLACEHOLDER: the home page sections are ported in later steps.
    placeholder: '[Contenido de inicio pendiente]',
  },
  notFound: {
    // PLACEHOLDER: 404 copy pending.
    title: '[Página no encontrada]',
    back: 'Volver al inicio',
  },
};
