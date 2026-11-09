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
    // Approved line (docs/brand/design-direction.md): the meta description.
    description: 'Todo lo que sientes cuando el mundo duerme.',
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
    // Approved line (docs/brand/design-direction.md).
    tagline: 'Acero y palabras para quienes no duermen.',
    rights: 'Todos los derechos reservados',
  },
  home: {
    hero: {
      // Brand name: identical in both languages. The hero carries no other text.
      title: 'Insomnia',
      sub: 'by Joel Soto',
    },
    pillarsLabel: 'Pilares',
    // Order matters: icons are a chain link, an open quotation mark and a crescent moon.
    pillars: [
      {
        title: 'Acero',
        text: 'Piezas de acero inoxidable hechas a mano. Lo que no se oxida, permanece.',
      },
      {
        title: 'Palabra',
        text: 'Palabras para sentimientos que aún no tenían nombre, impresas para llevar.',
      },
      {
        title: 'Vigilia',
        text: 'Diseñado en las horas en que todos duermen. Negro y blanco, como la noche y la pantalla.',
      },
    ],
    // Section headings: a roman lead and an italic tail, as in the legacy titles.
    jewelry: {
      lead: 'Joyería',
      em: 'de acero',
    },
    // The jewelry deck and its configurator. Link names and texts live in src/data/links.ts,
    // forms and sizes in src/data/forms.ts.
    // Shared by the product dialogs (jewelry and T-shirts).
    product: {
      close: 'Cerrar',
      cta: 'Consultar por WhatsApp',
      newTab: '(se abre en WhatsApp)',
    },
    deck: {
      listLabel: 'Baraja de eslabones',
      form: 'Forma',
      size: 'Medida',
      otherPrompt: '¿Qué pieza tienes en mente?',
      measureLabel: 'Medida en cm (opcional)',
      measureHelper: 'Si no sabes tu medida, te ayudamos por WhatsApp.',
      whatsapp: {
        intro: 'Hola, me interesa una pieza de Insomnia:',
        link: 'Eslabón',
        form: 'Forma',
        size: 'Medida',
      },
    },
    tshirts: {
      lead: 'Camisetas',
      em: 'estampadas',
    },
    // The T-shirt grid and its configurator. Words and meanings live in src/data/tees.ts,
    // with the colours, sizes, print languages and placements.
    tees: {
      listLabel: 'Camisetas',
      /** Accessible name of a grid tee: "Sonder, camiseta". */
      item: 'camiseta',
      colour: 'Color',
      size: 'Talla',
      printLanguage: 'Idioma del estampado',
      placement: 'Estampado',
      view: 'Vista',
      /** Accessible name of the mockup: "Camiseta Sonder, negra, vista de frente". */
      mockup: {
        tee: 'Camiseta',
        black: 'negra',
        white: 'blanca',
        front: 'vista de frente',
        back: 'vista de espalda',
        blank: 'sin estampado en este lado',
      },
      credit: {
        before: 'Palabras de ',
        title: 'The Dictionary of Obscure Sorrows',
        after: ', de John Koenig. Los significados están escritos con nuestras propias palabras.',
      },
      whatsapp: {
        intro: 'Hola, me interesa una camiseta de Insomnia:',
        design: 'Diseño',
        colour: 'Color',
        size: 'Talla',
        printLanguage: 'Idioma del estampado',
        placement: 'Estampado',
      },
    },
    readings: {
      lead: 'Lecturas',
      em: '',
    },
    // The Readings index and the article pages. Article copy lives in src/data/articles.ts.
    articles: {
      listLabel: 'Lecturas',
      read: 'Leer',
      back: 'Volver a Lecturas',
      backShort: 'Volver',
      more: 'Seguir leyendo',
    },
  },
  notFound: {
    title: 'Esta hora no existe.',
    text: 'Te perdiste en la niebla.',
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
      text: 'Negro y blanco hacia la noche y el papel envejecido, con un solo acento: el rojo de las rosas.',
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
        accent: 'Rojo de rosa: un solo punto focal; texto solo sobre claro',
        accentGlow: 'Solo brillos y luz, nunca rellenos',
      },
    },
    type: {
      title: 'Tipografía',
      text: 'Títulos en Cormorant Garamond, cuerpo en EB Garamond; Montserrat para etiquetas, interfaz y reloj.',
      faces: 'Cuerpo: EB Garamond, etiquetas: Montserrat',
      onBone: 'Sobre hueso',
      onInk: 'Sobre tinta',
      label: 'Leer',
    },
    clock: {
      title: 'Reloj de la noche',
      text: 'Un reloj de bolsillo en línea fina. Arriba de la página marca las 6:00 p. m.; abajo, una vuelta completa después, las 6:00 a. m. Las agujas siguen el scroll sin saltos.',
      headerSize: 'Cabecera, escritorio',
      headerPhoneSize: 'Cabecera, teléfono',
      introSize: 'Tamaño de la intro',
      captions: ['6:00 p. m.', '9:47 p. m.', '12:00 a. m.', '3:47 a. m.', '6:00 a. m.'],
    },
    links: {
      title: 'Eslabones',
      text: 'Los nueve eslabones en línea fina, como una sola familia, a tamaño de carta y de índice.',
      cardSize: 'Tamaño de carta',
      indexSize: 'Tamaño de índice',
    },
    prints: {
      title: 'Estampados',
      text: 'Los diez estampados generados en código, en tinta sobre la camiseta blanca y en hueso sobre la negra: frente (la palabra sola, del estampado de frente y espalda) y espalda (la palabra con su significado), en los dos idiomas.',
      front: 'Frente',
      back: 'Espalda',
      black: 'Negra',
      white: 'Blanca',
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
