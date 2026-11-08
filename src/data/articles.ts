import type { Lang } from '../i18n';
import type { Localized } from './links';

/*
 * The Readings: three articles, one per pillar. The editorial source is
 * docs/content/articles.md; this file carries the same copy, word for word,
 * typed. UPDATE BOTH TOGETHER: change the markdown first, then mirror it here
 * exactly (no rewriting). UI strings ("Leer", "Volver"...) live in the
 * dictionaries, never here.
 *
 * To add an article: add it to docs/content/articles.md, then an entry below
 * (slug: lowercase ASCII with hyphens, the same in both languages; it is the
 * route /lecturas/<slug> and the view-transition name article-<slug>), with
 * its pillar and exactly six paragraphs per language.
 */

export type Pillar = 'steel' | 'words' | 'vigil';

export interface Article {
  /** Route /lecturas/<slug>, the same in both languages. */
  slug: string;
  /** Chooses the line icon: chain link, quotation mark, crescent moon. */
  pillar: Pillar;
  category: Localized;
  title: Localized;
  excerpt: Localized;
  paragraphs: Record<Lang, readonly string[]>;
}

export const ARTICLES: readonly Article[] = [
  {
    slug: 'el-peso-de-lo-que-permanece',
    pillar: 'steel',
    category: {
      es: 'Acero',
      en: 'Steel',
    },
    title: {
      es: 'El peso de lo que permanece',
      en: 'The Weight of What Remains',
    },
    excerpt: {
      es: 'Por qué el acero es lo único que no se desvanece cuando llega la noche.',
      en: "Why steel is the one thing that doesn't fade when night falls.",
    },
    paragraphs: {
      es: [
        'A las tres de la mañana, todo parece un poco menos real. Las paredes se alejan, los pensamientos pierden el borde y el tiempo se estira sin pedir permiso. En esas horas, lo único que no se deshace es lo que puedes tocar.',
        'El acero inoxidable es eso: un material que no negocia. No se oxida, no cambia de color, no se rinde al agua, al sudor ni a los años. Lo que hoy brilla va a seguir brillando cuando ya no recuerdes por qué lo elegiste.',
        'Cada pieza de Insomnia se arma a mano, eslabón por eslabón. Ninguno es más importante que otro; todos repiten la misma forma y, juntos, sostienen el peso de la cadena. Hay algo tranquilo en esa repetición, como contar respiraciones cuando el sueño no llega.',
        'Por eso no hablamos de un catálogo, sino de eslabones. Un mismo eslabón puede convertirse en un collar, una pulsera, un anillo o una cadena que rodea la cintura. La forma cambia; el material y el cuidado de quien lo arma, no.',
        'Llevar acero es llevar un ancla. Su peso sobre la piel es pequeño, pero constante, y recuerda algo simple: estás aquí, estás despierto, esto es real.',
        'La noche puede llevarse casi todo. Lo que está hecho para permanecer, se queda.',
      ],
      en: [
        "At three in the morning, everything feels a little less real. The walls drift away, thoughts lose their edges and time stretches without asking. In those hours, the only thing that doesn't come apart is what you can touch.",
        "Stainless steel is exactly that: a material that doesn't negotiate. It doesn't rust, it doesn't change color, it doesn't give in to water, sweat or years. What shines today will still be shining when you no longer remember why you chose it.",
        "Every Insomnia piece is put together by hand, link by link. No link matters more than another; each repeats the same shape, and together they carry the weight of the chain. There is something calm in that repetition, like counting breaths when sleep won't come.",
        "That is why we don't talk about a catalog, but about links. The same link can become a necklace, a bracelet, a ring or a chain around the waist. The form changes; the material and the care of the hands that make it don't.",
        'Wearing steel is wearing an anchor. Its weight on the skin is small but constant, and it reminds you of something simple: you are here, you are awake, this is real.',
        'The night can take almost everything. What is made to last, stays.',
      ],
    },
  },
  {
    slug: 'palabras-para-lo-que-no-tiene-nombre',
    pillar: 'words',
    category: {
      es: 'Palabra',
      en: 'Words',
    },
    title: {
      es: 'Palabras para lo que no tiene nombre',
      en: 'Words for What Has No Name',
    },
    excerpt: {
      es: 'Hay sentimientos que solo aparecen de noche y no saben cómo llamarse.',
      en: "Some feelings only show up at night, and they don't know what they are called.",
    },
    paragraphs: {
      es: [
        'Hay sentimientos que solo aparecen de noche. Llegan cuando la casa está en silencio y la pantalla es la única luz encendida, y se quedan ahí, sin presentarse, porque no saben cómo se llaman.',
        'El idioma tiene palabras para la tristeza, la nostalgia o el miedo, pero se queda corto ante todo lo que hay en medio: la certeza de que cada desconocido vive una vida tan compleja como la tuya, o el cansancio de cargar los mismos problemas año tras año.',
        'El escritor John Koenig dedicó años a inventar nombres para esas emociones en The Dictionary of Obscure Sorrows. Palabras como sonder, anemoia o zenosyne no aparecen en ningún diccionario oficial, pero quien las lee por primera vez suele reconocerlas de inmediato.',
        'Ponerle nombre a un sentimiento no lo resuelve, pero lo vuelve menos solitario. Si existe una palabra, alguien más lo sintió antes. Y si alguien más lo sintió, no estás tan solo como parecía a esa hora.',
        'Las camisetas de Insomnia llevan esas palabras y su significado, escrito con nuestras propias palabras. Cada diseño tiene una composición distinta, porque cada sentimiento ocupa el espacio a su manera.',
        'Llevar una palabra es sacarla de la noche. Es decirla en voz alta sin tener que explicarla, y dejar que quien la lea, si la reconoce, sepa que no es el único.',
      ],
      en: [
        "Some feelings only show up at night. They arrive when the house is silent and the screen is the only light left on, and they stay there without introducing themselves, because they don't know what they are called.",
        'Language has words for sadness, nostalgia and fear, but it falls short of everything in between: the certainty that every stranger lives a life as complex as yours, or the weariness of carrying the same problems year after year.',
        'The writer John Koenig spent years inventing names for those emotions in The Dictionary of Obscure Sorrows. Words like sonder, anemoia and zenosyne appear in no official dictionary, yet people who read them for the first time tend to recognize them at once.',
        "Naming a feeling doesn't solve it, but it makes it less lonely. If a word exists, someone else has felt it before. And if someone else has felt it, you are not as alone as it seemed at that hour.",
        'Insomnia T-shirts carry those words and their meanings, written in our own words. Each design has its own composition, because each feeling takes up space in its own way.',
        'Wearing a word is bringing it out of the night. It is saying it out loud without having to explain it, and letting whoever reads it, if they recognize it, know they are not the only one.',
      ],
    },
  },
  {
    slug: 'entre-la-vigilia-y-el-sueno',
    pillar: 'vigil',
    category: {
      es: 'Vigilia',
      en: 'Vigil',
    },
    title: {
      es: 'Entre la vigilia y el sueño',
      en: 'Between Waking and Dreaming',
    },
    excerpt: {
      es: 'Insomnia nace en el lugar donde lo real y lo soñado se tocan.',
      en: 'Insomnia is born where the real and the dreamed touch.',
    },
    paragraphs: {
      es: [
        'El insomnio no es estar despierto. Es quedarse en el umbral: demasiado cansado para pensar con claridad, demasiado alerta para soñar. Un lugar donde lo real y lo imaginado se tocan sin terminar de mezclarse.',
        'En ese umbral las cosas cambian de tamaño. El reloj avanza y, al mismo tiempo, no se mueve. El piso parece un tablero de ajedrez que se pierde en la niebla, y el espejo devuelve una versión de ti que no termina de ser la misma.',
        'Insomnia nace ahí. No como una marca de la noche, sino como una forma de nombrar esas horas: las que nadie ve, en las que se piensa todo lo que de día se calla.',
        'Por eso tiene dos mitades. El acero es lo físico, lo que te ata al suelo y no se desvanece. La palabra es lo etéreo, lo que se escapa y apenas se deja nombrar. Una sostiene; la otra suelta.',
        'El negro y el blanco no son un capricho. Son la noche y la pantalla, la oscuridad y la única luz encendida a las tres de la mañana. Todo lo demás es niebla, y en la niebla, un poco de rojo.',
        'Esta página también es una noche: empieza a las seis de la tarde y termina al amanecer. Si llegaste hasta aquí, ya sabes cómo se siente.',
      ],
      en: [
        "Insomnia isn't being awake. It is staying at the threshold: too tired to think clearly, too alert to dream. A place where the real and the imagined touch without quite blending.",
        'At that threshold, things change size. The clock moves forward and, at the same time, stands still. The floor looks like a chessboard fading into the mist, and the mirror gives back a version of you that is never quite the same.',
        'Insomnia is born there. Not as a brand of the night, but as a way to name those hours: the ones nobody sees, when you think everything you keep quiet during the day.',
        "That is why it has two halves. Steel is the physical, what ties you to the ground and doesn't fade. The word is the ethereal, what slips away and barely lets itself be named. One holds on; the other lets go.",
        'Black and white are not a whim. They are the night and the screen, the darkness and the only light still on at three in the morning. Everything else is mist, and in the mist, a little red.',
        'This page is a night too: it begins at six in the evening and ends at dawn. If you made it this far, you already know how it feels.',
      ],
    },
  },
];

export function findArticle(slug: string | undefined): Article | undefined {
  return slug ? ARTICLES.find((article) => article.slug === slug) : undefined;
}

/** The path of an article page. */
export function articlePath(slug: string): string {
  return `/lecturas/${slug}`;
}
