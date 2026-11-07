# Insomnia by Joel Soto: design direction

## Concept

Insomnia is the night between reality and dream. Reality is physical: steel, the jewelry, light sections, crisp edges. Dream is ethereal: words, mist, dark windows onto the chain. Black & White is the reality layer and stays recognizable; Insomnia adds the dream layer on top of it.

Taglines:

- Header: "Acero • Palabra / Steel • Words"
- Hero: "Todo lo que sientes cuando el mundo duerme. / Everything you feel while the world sleeps."
- Meta and footer: "Acero y palabras para quienes no duermen. / Steel and words for those who don't sleep."

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

Accent rules: red is rare. Use it for a single focal point per screen at most: a hover state, an ornament detail, a glow in the 3D scene around midnight, the active state of a control. Red text only on light backgrounds (contrast); on dark it is light or glow, never text. Never large red fills. Red never appears in persistent UI (header, footer, language toggle); the toggle stays neutral. All text must meet WCAG AA.

## Typography

- Display: Cormorant Garamond (roman and italic), unchanged.
- Labels, UI, clock: Montserrat, small, widely spaced capitals, tabular figures for numbers.
- Body text: EB Garamond (decided in the lab review). Montserrat is not used for body text.

## Motifs

- Chessboard: the direct bridge from Black & White. Used as a pattern, a card back and a perspective floor fading into mist behind the hero.
- Clocks: the scroll clock is the main one; clock-face linework may appear as ornament.
- Playing cards: the format for presenting products (see Products).
- Wrought-iron filigree: thin ornamental frames and section dividers.
- Roses with thorns, keys, teacups: occasional small line ornaments.

Rules: all ornaments are thin line art in the same stroke weight as the pillar icons; at most one motif per section; ornament, never full illustrated scenes. Line art on light sections uses `--text-on-light` or `--text-on-light-muted`, never `--steel` (steel is for dark sections only).

## Atmosphere

Film grain (already present), soft vignette, layered mist in the dream windows, a few slow floating particles (dust or ash). In the 3D scene: depth fog and the chessboard floor. Everything subtle; the steel chain must always read as silver steel.

## The night cycle

The page is one night. The header clock runs from 6:00 PM at the top to 6:00 AM at the bottom, in 12-hour format, localized (ES "6:00 p. m.", EN "6:00 PM"). The intro shows the start of the night: "6:00 p. m." / "6:00 PM". Later, the 3D lighting follows the clock: dusk at the top (slightly warm, lighter fog), midnight deepest (red glow at its strongest, still subtle), small hours coldest, pale dawn near the footer.

## Motion

Calm and slow, as in Black & White. No pointer or device-orientation tracking. Nothing bouncy. Card flips and mist drift are slow. Every animation respects `prefers-reduced-motion`.

## Section map (home)

1. Intro (6:00 PM)
2. Hero, dream window: chain necklace around the title, chessboard floor in mist
3. Pillars, reality (bone)
4. Band 1, dream: "El acero recuerda lo que la noche olvida."
5. Jewelry deck, reality
6. Band 2, dream: "Sonder" and its meaning
7. Printed T-shirts, reality
8. Readings
9. Footer (6:00 AM, dawn)

## Products (no photos)

- Jewelry is a system, not a fixed list: link type x form x size. Links are the current nine (Void, Star, Monolith, Static, Together, Meridian, Heart, Echo, Snake), each with a line illustration of a single link, its name and its poetic text. Forms: necklace, bracelet, anklet, ring, head piece, waist piece, other. Size: standard or made to measure. The WhatsApp message is composed from the choices.
- The links are presented as a deck of playing cards: card front with the link illustration, name and a corner index; card back with a chessboard or filigree pattern. Selecting a card flips it and opens the configurator.
- T-shirts are generated in code: an SVG T-shirt silhouette (black or white) printed with the word and its meaning. Meanings are our own paraphrases, never the original definitions; credit John Koenig's The Dictionary of Obscure Sorrows in the T-shirt section.
- Phase 2: a 3D preview that repeats the chosen link along the silhouette of the chosen form, reusing the chain engine.
