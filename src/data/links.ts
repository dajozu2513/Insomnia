import type { Lang } from '../i18n';

/*
 * The nine chain links: the single source of truth for the jewelry deck.
 *
 * A link's `name` is never translated and never gets an i18n key (it is the
 * same word in every language). Every other text is localized here, typed so
 * both languages are always present. Poetic descriptions are the legacy
 * Black & White texts (js/main.js PRODUCTS), unchanged except Meridian.
 *
 * To add a link: add an entry below (its `id` is the deep-link value and the
 * key of its illustration in features/deck/linkArt.tsx), then draw its SVG.
 */

export type Localized = Record<Lang, string>;

export interface ChainLink {
  /** Lowercase slug: ?link=<id> deep links, React keys, illustration lookup. */
  id: string;
  /** Never translated. */
  name: string;
  /** Playing-card rank shown in the corners. */
  rank: string;
  chainType: Localized;
  technical: Localized;
  poetic: Localized;
}

export const LINKS: readonly ChainLink[] = [
  {
    id: 'void',
    name: 'Void',
    rank: 'A',
    chainType: { es: 'Clip', en: 'Paperclip' },
    technical: {
      es: 'Óvalo muy alargado de alambre redondo, liso y pulido; el eslabón más grande y abierto de la colección.',
      en: 'A long stadium-shaped oval of round wire, smooth and polished; the largest, most open link in the collection.',
    },
    poetic: {
      es: 'El eslabón más honesto que existe, sin ruido ni adornos. Solo la forma en su estado más puro. Existir así de claro es casi un acto de rebeldía.',
      en: 'The most honest link there is, no noise or ornament. Just form in its purest state. Existing this clearly is almost an act of rebellion.',
    },
  },
  {
    id: 'star',
    name: 'Star',
    rank: '2',
    chainType: { es: 'Estaciones de estrella', en: 'Star stations' },
    technical: {
      es: 'Estrella plana de cinco puntas, pulida, unida con argollas pequeñas.',
      en: 'A flat, polished five-pointed star joined by small rings.',
    },
    poetic: {
      es: 'Pequeña, constante, imposible de ignorar. Lleva esa misma tensión del universo que no necesita volumen para hacerse sentir.',
      en: 'Small, constant, impossible to ignore. It carries the same tension as the universe, one that never needs volume to make itself felt.',
    },
  },
  {
    id: 'monolith',
    name: 'Monolith',
    rank: '3',
    chainType: { es: 'Barbada', en: 'Curb' },
    technical: {
      es: 'Eslabón ovalado, torcido y aplanado, con cara diamantada; forma una cinta plana y continua.',
      en: 'A twisted, flattened oval link with a diamond-cut face; it forms a flat, continuous ribbon.',
    },
    poetic: {
      es: 'Hay cosas que no piden permiso para existir. Esta cadena es una de ellas. Sólida, sin disculpas, sin necesidad de explicación.',
      en: "Some things don't ask permission to exist. This chain is one of them. Solid, unapologetic, needing no explanation.",
    },
  },
  {
    id: 'static',
    name: 'Static',
    rank: '4',
    chainType: { es: 'Forzada texturizada', en: 'Textured cable' },
    technical: {
      es: 'Óvalo pequeño con superficie grabada que capta la luz en destellos.',
      en: 'A small oval with an engraved surface that catches the light in flashes.',
    },
    poetic: {
      es: 'El momento exacto antes de que todo tenga sentido o deje de tenerlo. Esa frecuencia entre el orden y el caos, hecha acero.',
      en: 'The exact moment before everything starts making sense, or stops. That frequency between order and chaos, made steel.',
    },
  },
  {
    id: 'together',
    name: 'Together',
    rank: '5',
    chainType: { es: 'Forzada rectangular', en: 'Rectangular cable' },
    technical: {
      es: 'Rectángulo alargado de esquinas rectas en alambre de sección cuadrada; cada eslabón gira en ángulo recto respecto al anterior.',
      en: 'An elongated rectangle with square corners in square-section wire; each link turns at a right angle to the last.',
    },
    poetic: {
      es: 'Dos hilos que no se buscan, se encuentran. No se necesitan para existir, pero juntos dicen algo que ninguno puede decir solo.',
      en: "Two threads that don't seek each other out, they meet. Neither needs the other to exist, but together they say something neither can say alone.",
    },
  },
  {
    id: 'meridian',
    name: 'Meridian',
    rank: '6',
    chainType: { es: 'Forzada fina', en: 'Fine cable' },
    technical: {
      es: 'Óvalo pequeño y liso de alambre delgado; la cadena más delicada.',
      en: 'A small, smooth oval of fine wire; the most delicate chain.',
    },
    poetic: {
      es: 'La línea que separa lo conocido de lo que aún no tiene nombre. Precisa, inevitable, casi invisible.',
      en: 'The line that separates what is known from what has no name yet. Precise, inevitable, almost invisible.',
    },
  },
  {
    id: 'heart',
    name: 'Heart',
    rank: '7',
    chainType: { es: 'Estaciones de corazón', en: 'Heart stations' },
    technical: {
      es: 'Corazón abombado y pulido, unido con argollas pequeñas.',
      en: 'A puffed, polished heart joined by small rings.',
    },
    poetic: {
      es: 'No el corazón que siente. El que resiste. El que sigue latiendo aunque nadie lo vea, aunque nadie lo escuche.',
      en: 'Not the heart that feels. The one that endures. The one that keeps beating even when no one sees it, even when no one hears it.',
    },
  },
  {
    id: 'echo',
    name: 'Echo',
    rank: '8',
    chainType: { es: 'Discos', en: 'Discs' },
    technical: {
      es: 'Disco plano perforado cerca del borde, unido con argollas; brilla como una moneda.',
      en: 'A flat disc pierced near its edge and joined by rings; it shines like a coin.',
    },
    poetic: {
      es: 'Lo que dijiste ya no está pero su forma permanece. Cada eslabón repite al anterior sin agotarse, sin olvidar.',
      en: 'What you said is gone, but its shape remains. Every link repeats the last one, never tiring, never forgetting.',
    },
  },
  {
    id: 'snake',
    name: 'Snake',
    rank: '9',
    chainType: { es: 'Veneciana redondeada', en: 'Rounded box chain' },
    technical: {
      es: 'Eslabón cúbico de aristas suaves que forma una cadena compacta y flexible.',
      en: 'A soft-edged cubic link that forms a compact, flexible chain.',
    },
    poetic: {
      es: 'No rastrea. Fluye. Lleva consigo algo antiguo que todavía no tiene nombre, y probablemente nunca lo necesite.',
      en: "It doesn't crawl. It flows. It carries something ancient that still has no name, and probably never will need one.",
    },
  },
];

/** The link with this id, or undefined (deep links ignore unknown ids). */
export function findLink(id: string | null | undefined): ChainLink | undefined {
  return id ? LINKS.find((link) => link.id === id) : undefined;
}
