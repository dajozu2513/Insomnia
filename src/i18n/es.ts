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
  // Approved taglines (docs/brand/design-direction.md). Shown on /lab for now.
  brand: {
    heroTagline: 'Todo lo que sientes cuando el mundo duerme.',
    metaTagline: 'Acero y palabras para quienes no duermen.',
  },
  // 12-hour periods for the night clock: "6:00 p. m."
  clock: {
    am: 'a. m.',
    pm: 'p. m.',
  },
  footer: {
    rights: 'Todos los derechos reservados',
  },
  home: {
    hero: {
      // Brand name: identical in both languages.
      title: 'Insomnia',
      sub: 'by Joel Soto',
    },
    // PLACEHOLDER: band phrases pending. Kept about as long as the legacy
    // phrases so the drapes can be checked against a realistic line.
    band1: '[Frase de la primera banda]',
    band2: '[Frase de la segunda banda]',
    // PLACEHOLDER: temporary opaque sections, designed in step 3.
    section1: '[Sección pendiente]',
    section2: '[Sección pendiente]',
    section3: '[Sección pendiente]',
  },
  notFound: {
    // PLACEHOLDER: 404 copy pending.
    title: '[Página no encontrada]',
    back: 'Volver al inicio',
  },
  // Internal design lab at /lab (not linked, noindex).
  lab: {
    pageTitle: 'Laboratorio visual | Insomnia',
    eyebrow: 'Uso interno',
    title: 'Laboratorio visual',
    intro:
      'La nueva dirección de diseño, pieza por pieza, para revisarla antes de aplicarla al inicio.',
    palette: {
      title: 'Paleta',
      text: 'Negro y blanco hacia la noche y el papel envejecido, con un solo acento: rojo sangre.',
      contrastTitle: 'Contraste medido',
      contrastText:
        'Leído de los tokens en vivo. Texto: AA pide 4,5:1 (3:1 en texto grande). Líneas y ornamentos: 3:1.',
      textColumn: 'Color',
      pass: 'AA',
      passLarge: 'Solo texto grande',
      passGraphic: 'Líneas (3:1)',
      fail: 'No cumple',
      notUsed: 'No previsto',
      roles: {
        ink: 'Casi negro, fondo oscuro principal',
        inkRaised: 'Superficies oscuras, cartas sobre oscuro',
        bone: 'Papel envejecido, fondo claro principal',
        boneDeep: 'Superficies claras, filetes sobre claro',
        textOnDark: 'Texto sobre oscuro',
        textOnDarkMuted: 'Texto secundario sobre oscuro (añadido)',
        textOnLight: 'Texto sobre claro',
        textOnLightMuted: 'Texto secundario sobre claro (añadido)',
        steel: 'Líneas finas y ornamentos sobre oscuro',
        accent: 'Rojo sangre: un solo punto focal; texto solo sobre claro',
        accentGlow: 'Solo brillos y luz, nunca rellenos',
      },
    },
    type: {
      title: 'Tipografía',
      text: 'Mismo titular, cuerpo y etiquetas; el cuerpo cambia entre Montserrat Light y EB Garamond.',
      bodyMontserrat: 'Cuerpo: Montserrat Light',
      bodyGaramond: 'Cuerpo: EB Garamond',
      onBone: 'Sobre hueso',
      onInk: 'Sobre tinta',
      label: 'Leer',
      // Legacy pillar copy, used as the body specimen.
      pillars: [
        {
          title: 'Estética Black & White',
          text: 'Un universo en blanco y negro. Sin distracciones, sin ruido.',
        },
        {
          title: 'Una sola paleta',
          text: 'El contraste como lenguaje. Negro y blanco como filosofía.',
        },
        {
          title: 'Identidad propia',
          text: 'No seguimos tendencias. Definimos las nuestras.',
        },
      ],
    },
    clock: {
      title: 'Reloj de la noche',
      text: 'De 6:00 p. m. arriba a 6:00 a. m. abajo. Cifras tabulares y ancho fijo: de 9:59 a 10:00 nada se mueve.',
      measured: 'Ancho medido',
    },
    motifs: {
      title: 'Motivos',
      text: 'Línea fina con el mismo trazo que los íconos de los pilares. Un motivo por sección como máximo.',
      chessboard: 'Tablero',
      filigree: 'Filigrana',
      rose: 'Rosa',
      key: 'Llave',
      clockFace: 'Esfera de reloj',
    },
    card: {
      title: 'Carta',
      text: 'Frente con el eslabón, el nombre y el índice; dorso con tablero. Toca la carta para voltearla.',
      front: 'Frente',
      back: 'Dorso',
      interactive: 'Interactiva',
      flip: 'Voltear la carta',
      // PLACEHOLDER: oval link drawing until the nine link illustrations exist.
      sampleName: 'Void',
      sampleIndex: '1',
    },
    atmosphere: {
      title: 'Atmósfera',
      text: 'Niebla en capas, viñeta suave y el grano existente sobre un panel de tinta.',
    },
  },
};
