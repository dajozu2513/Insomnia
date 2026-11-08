# Insomnia by Joel Soto: design direction

## Concept

Insomnia is the night between reality and dream. Reality is physical: steel, the jewelry, light sections, crisp edges. Dream is ethereal: words, mist, dark windows onto the chain. Black & White is the reality layer and stays recognizable; Insomnia adds the dream layer on top of it.

Taglines:

- Header: "Acero • Palabra / Steel • Words"
- Meta description: "Todo lo que sientes cuando el mundo duerme. / Everything you feel while the world sleeps." (It is no longer shown in the hero; the hero carries only the name.)
- Footer: "Acero y palabras para quienes no duermen. / Steel and words for those who don't sleep.", in small, quiet type.

## Sources and IP rules

- Allowed: motifs from Lewis Carroll's Alice books (1865, 1871) and John Tenniel's original illustrations, which are public domain: playing cards, clocks and pocket watches, teacups, roses, keys, chessboards, mirrors.
- Mood reference only: Alice: Madness Returns (EA / American McGee). Never reproduce its characters, character designs, environments, logos, UI or any of its art. Never name the game or "Alice" in site copy or metadata.
- Images in `_reference/alice/` are never shipped, traced or used as textures.
- No character figures (no Alice, rabbit, cat or queen drawings). Motifs are objects and patterns only.

## Palette

Base stays black and white, shifted toward night and aged paper. One accent only: blood red.

| Token             | Value                     | Use                               |
| ----------------- | ------------------------- | --------------------------------- |
| `--ink`           | `#0d0c0e`                 | near-black, main dark background  |
| `--ink-raised`    | `#1d1a20`                 | dark surfaces, cards on dark      |
| `--bone`          | `#e8e1d3`                 | aged paper, main light background |
| `--bone-deep`     | `#d6cdbb`                 | light surfaces, rules on light    |
| `--text-on-dark`  | `#ebe6dc`                 |                                   |
| `--text-on-light` | `#141215`                 |                                   |
| `--steel`         | `#b8bbc1`                 | thin lines and ornaments on dark  |
| `--accent`        | `#8f1d22`                 | blood red                         |
| `--accent-glow`   | `rgba(196, 40, 45, 0.35)` | glows and light only, never fills |

Derived tokens (added after the lab review, both AA on their side):

- `--text-on-light-muted`: `#4f4a50` (6.65:1 on bone, 5.48:1 on bone-deep)
- `--text-on-dark-muted`: `#8f8a83` (5.70:1 on ink, 5.02:1 on ink-raised)
- `--tee-white`: `#f7f5f0`, the white T-shirt in the mockups (a garment colour, never text or a background); ink prints on it at 17.9:1, bone prints on the black tee at 15:1

Accent rules: red is rare. Use it for a single focal point per screen at most: a hover state, an ornament detail, a glow in the 3D scene around midnight, the active state of a control. Red text only on light backgrounds (contrast); on dark it is light or glow, never text. Never large red fills. Red never appears in persistent UI (header, footer, language toggle); the toggle stays neutral. The one allowed large use of red is the threshold into the night: the intro's red mist, a soft blood-red haze on ink (from `--accent` and `--accent-glow`) gathered in the bottom and the lower corners so the upper half and the centre stay clean ink, continued in the hero by a subtler red haze inside the 3D scene, low and towards the edges, behind the chain only. It is a glow, never a fill or text, and it never tints the steel. All text must meet WCAG AA.

## Typography

- Display: Cormorant Garamond (roman and italic), unchanged. The by-line "by Joel Soto" under INSOMNIA (hero and intro) is Cormorant Garamond italic, large enough to read as part of the name.
- Labels, UI, clock: Montserrat, small, widely spaced capitals, tabular figures for numbers.
- Body text: EB Garamond (decided in the lab review). Montserrat is not used for body text.

## Motifs

- Chessboard: the direct bridge from Black & White. Used as a pattern, a card back and a perspective floor fading into mist behind the hero.
- Clocks: the scroll clock (a pocket watch, see The night cycle) is the main one; clock-face linework may appear as ornament.
- Playing cards: the format for presenting products (see Products).
- Wrought-iron filigree: thin ornamental frames and section dividers.
- Roses with thorns, keys, teacups: occasional small line ornaments.

Rules: all ornaments are thin line art in the same stroke weight as the pillar icons; at most one motif per section; ornament, never full illustrated scenes. Line art on light sections uses `--text-on-light` or `--text-on-light-muted`, never `--steel` (steel is for dark sections only).

## Atmosphere

Film grain (already present), soft vignette, layered mist in the dream windows, a few slow floating particles (dust or ash). In the 3D scene: depth fog and the chessboard floor. Everything subtle; the steel chain must always read as silver steel.

As built (steps 4 and 5): the chessboard floor belongs to the hero window alone: it fades out as the hero leaves the viewport and never shows while a band is on screen. It lies under the hero necklace in muted ink and dimmed bone squares, unlit and receding into the fog; there is no reflection. About 120 motes of dust (60 on small screens) rise slowly through all three windows. A faint blood-red glow (`--accent-glow`) lives far behind the chain around midnight, as light in the mist, never on the steel. The bands are pure windows, so every drape hangs as a gentle catenary centred in its band. The 2D mist in the windows stays put relative to its window as the page scrolls; its only motion is a very slow sideways drift, independent of scroll and still with reduced motion.

## The night cycle

The page is one night, from 6:00 PM at the top to 6:00 AM at the bottom. The clock is analog, with no digits: a small pocket watch in thin line art (the pillar-icon stroke, currentColor) with a thin rim (doubled only at sizes where it stays clean), a crown and bow, twelve ticks with longer quarters, no numerals, slender hands with a small open loop near the hour hand's tip, and a centre pin. In the header it sits at the top left, beside the "INSOMNIA / by Joel Soto" brand block and as tall as it (about 38 px with a double rim on desktop, about 31 px with a single rim on phones), as an emblem next to the name; its hands follow the scroll continuously (hour hand 180 + 360p degrees, minute hand 360 x 12 x p, for night progress p from 0 to 1), so it reads 6:00 at the top and, one full turn later, 6:00 at the bottom. The intro shows the full name "Insomnia by Joel Soto", then the hairline, then the same watch, larger and static at 6:00, over the red mist. It is decorative and hidden from assistive tech. The 3D lighting follows the clock: dusk at the top (slightly warm, lighter fog), midnight deepest (red glow at its strongest, still subtle), small hours coldest, pale dawn near the footer. Only cheap parameters change (fog colour and range, exposure between 1.13 and 1.15, a rim light's tint and strength, the glow); the studio reflections never change, so the chain stays neutral silver at every hour.

## Motion

Calm and slow, as in Black & White. No pointer or device-orientation tracking. Nothing bouncy. Card flips and mist drift are slow. Every animation respects `prefers-reduced-motion`.

## Section map (home)

1. Intro (6:00 PM): "Insomnia by Joel Soto", the hairline and the watch over a red mist
2. Hero, dream window: chain necklace around "Insomnia / by Joel Soto" (no other text), chessboard floor in mist
3. Pillars, reality (bone)
4. Band 1, dream: no text, a pure window; the chain drapes across its centre
5. Jewelry deck, reality
6. Band 2, dream: no text, a pure window; the chain drapes across its centre
7. Printed T-shirts, reality
8. Band 3, dream: no text, a pure window; the chain drapes across its centre
9. Readings
10. Footer (6:00 AM, dawn)

## Products (no photos)

- Jewelry is a system, not a fixed list: link type x form x size. Links are the current nine (Void, Star, Monolith, Static, Together, Meridian, Heart, Echo, Snake), each with a line illustration of a single link, its name and its poetic text. Forms: necklace, bracelet, anklet, ring, head piece, waist piece, other. In Spanish the head piece is "Cadena de cabeza" (not "Tocado"). Size: standard or made to measure. The WhatsApp message is composed from the choices.
- The links are presented as a deck of playing cards: card front with the link illustration, name and a corner index; card back with a chessboard or filigree pattern. Selecting a card flips it and opens the configurator.
- As built (step 5): the deck is a dealt spread on bone, 3 x 3 on desktop and two columns on phones with the ninth card centred; the cards start face down and turn face up one by one the first time the section is seen (face up from the start with reduced motion). Ranks: Void A, then Star 2 to Snake 9. Card front: raised bone paper, the link drawn in thin line art, the name in Cormorant small capitals, the rank in two corners with a tiny link as its suit mark. Card back: ink, a chessboard inside a thin steel filigree frame.
- Card red rule: nothing on a card is red at rest; only the corner suit marks of the hovered, focused or selected card turn `--accent`, and that is the only red on screen (outside the intro and the 3D mist). Hover (fine pointers only) lifts the card a little and dims the others.
- Selecting a card opens a dialog on bone: the card flies in and shows large (stacked on phones) beside its name, chain type, technical and poetic texts and the configurator (form chips, "Otra / Other" with a short text, size "Estándar / A la medida" with an optional cm field). The WhatsApp message lists the link, form and size, leaving out what was not chosen. A card can be linked directly with `?link=<id>`.
- No product photos on the site: the links are drawn. The photos stay in the local reference only.
- T-shirts are generated in code: an SVG T-shirt silhouette (black or white) printed with the word and its meaning. Meanings are our own paraphrases, never the original definitions; credit John Koenig's The Dictionary of Obscure Sorrows in the T-shirt section.
- As built (step 6): ten designs (Sonder, Onism, Monachopsis, Nodus Tollens, Anemoia, Liberosis, Exulansis, Altschmerz, Zenosyne, Énouement), each with its own typographic composition: Sonder among a faint crowd of tiny "sonder"; Onism in a frame just too tight; Monachopsis on a strict grid with one letter out of place; Nodus Tollens with a plot line that runs under the words and knots between them; Anemoia in fading, misregistered layers; Liberosis loosening and drifting apart, lighter towards the end; Exulansis after an opening quotation mark that never closes; Altschmerz stacked, worn at the top and crisp at the bottom; Zenosyne with its spacing shrinking letter by letter over a small time scale; Énouement over a faint mirrored reflection.
- Print rules: monochrome only (ink on the white tee, bone on the black one); the word in Cormorant Garamond capitals, the meaning in EB Garamond in the chosen print language, and a small, quiet "INSOMNIA by Joel Soto" mark at the bottom of every print. Print-safe: flat tints at most (never a gradient, never below 20%), fades made with knocked-out specks or lines, no line finer than about 1 mm at print size. Placement: Front or Back prints the word and meaning on that side; Front and back prints the word large on the front and the word with its meaning on the back.
- The mockup is a flat line-art tee (seams only, no photos), the print at a realistic chest or back position and size. The section shows the ten black tees from the front (5 x 2, two columns on phones) with the name in Cormorant small capitals; nothing is red at rest, and a short rule under the hovered or focused name is the one red. The credit line sits under the grid: "Palabras de The Dictionary of Obscure Sorrows, de John Koenig. Los significados están escritos con nuestras propias palabras." / "Words from The Dictionary of Obscure Sorrows by John Koenig. Meanings written in our own words."
- Selecting a tee opens the same dialog as the cards: the mockup flies in with a Front/Back toggle, the word and its meaning, and the configurator (colour, size XS to XL, print language, placement); the mockup follows every choice. A tee can be linked directly with `?tee=<id>`.
- Phase 2: a 3D preview that repeats the chosen link along the silhouette of the chosen form, reusing the chain engine.
