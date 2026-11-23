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

Base stays black and white, shifted toward night and aged paper. One accent only: the red of roses (chosen in step 10 over blood red, which read as horror).

| Token             | Value                      | Use                                           |
| ----------------- | -------------------------- | --------------------------------------------- |
| `--ink`           | `#0d0c0e`                  | near-black, main dark background              |
| `--ink-raised`    | `#1d1a20`                  | dark surfaces, cards on dark                  |
| `--bone`          | `#e8e1d3`                  | aged paper, main light background             |
| `--bone-deep`     | `#d6cdbb`                  | light surfaces, rules on light                |
| `--text-on-dark`  | `#ebe6dc`                  |                                               |
| `--text-on-light` | `#141215`                  |                                               |
| `--steel`         | `#b8bbc1`                  | thin lines and ornaments on dark              |
| `--accent`        | `#9e2a3a`                  | rose crimson                                  |
| `--accent-glow`   | `rgba(214, 84, 112, 0.35)` | rose light: glows and light only, never fills |

Derived tokens (added after the lab review, both AA on their side):

- `--text-on-light-muted`: `#4f4a50` (6.65:1 on bone, 5.48:1 on bone-deep)
- `--text-on-dark-muted`: `#8f8a83` (5.70:1 on ink, 5.02:1 on ink-raised)
- `--tee-white`: `#f7f5f0`, the white T-shirt in the mockups (a garment colour, never text or a background); ink prints on it at 17.9:1, bone prints on the black tee at 15:1

Accent rules: red is rare. Use it for a single focal point per screen at most: a hover state, an ornament detail, a glow in the 3D scene around midnight, the active state of a control. Red text only on light backgrounds (contrast); on dark it is light or glow, never text. Never large red fills. Red never appears in persistent UI (header, footer, language toggle); the toggle stays neutral. The one allowed large use of red is the threshold into the night: the intro's rose mist, a soft, glowing rose light on ink (from `--accent` and `--accent-glow`, with a paler light inside it) gathered in the bottom and the lower corners so the upper half and the centre stay clean ink, continued in the hero by the rose light rising out of the hole from far below (step 11), and by a faint glow far behind the chain in band 1. It is a glow, never a fill or text, and it never tints the steel. In the 3D scene the roses (step 12) are the only red objects, never more than two or three on screen. All text must meet WCAG AA.

## Typography

- Display: Cormorant Garamond (roman and italic), unchanged. The by-line "by Joel Soto" under INSOMNIA (hero and intro) is Cormorant Garamond italic, large enough to read as part of the name.
- Labels, UI, clock: Montserrat, small, widely spaced capitals, tabular figures for numbers.
- Body text: EB Garamond (decided in the lab review). Montserrat is not used for body text.

## Motifs

- Chessboard: the direct bridge from Black & White. Used as a pattern and a card back. The 3D chessboard floor left the hero in step 11; it returns as the floor of the hall at the landing, at the bottom of the fall (step 13).
- Clocks: the scroll clock (a pocket watch, see The night cycle) is the main one; clock-face linework may appear as ornament. In the 3D scene, a small steel pocket watch lies on a root at the edge of the hole (step 11), and more watches and bare clock faces float down the shaft (step 12); every one shows the night's hour, in step with the header watch.
- Playing cards: the format for presenting products (see Products); our deck also tumbles down the shaft (step 12).
- Wrought-iron filigree: thin ornamental frames and section dividers.
- Roses with thorns, keys, teacups: occasional small line ornaments.

Rules: all ornaments are thin line art in the same stroke weight as the pillar icons; at most one motif per section; ornament, never full illustrated scenes. Line art on light sections uses `--text-on-light` or `--text-on-light-muted`, never `--steel` (steel is for dark sections only).

## Atmosphere

Film grain (already present), soft vignette, layered mist in the dream windows, a few slow floating particles: tiny glowing motes, like fireflies or stardust. In the 3D scene: depth fog, the earth of the hole and the misty shaft. Everything subtle; the steel (the chain, the pocket watches and the keys) must always read as silver steel.

As built (steps 4, 5 and 11): about 120 motes (60 on small screens) rise slowly through the hole and every window: warm white, softly glowing, their brightness breathing slowly; in the hole they gather around the visitor, and while falling fast they stretch into short vertical streaks (capped, never strobing). A faint rose glow lives far below in the hole and far behind the chain in band 1, strongest at midnight, as light in the mist, never on the steel. The high rose veils of step 10 now only show where the page looks straight ahead (the bands); in the hole the rose light comes from below. The mist in the windows sits high, in veils, never as a dense band along the bottom (step 10: the low dense mist read as horror). The bands are pure windows, so every drape hangs as a gentle catenary centred in its band. The 2D mist in the windows stays put relative to its window as the page scrolls; its only motion is a very slow sideways drift, independent of scroll and still with reduced motion.

## The night cycle

The page is one night, from 6:00 PM at the top to 6:00 AM at the bottom. The clock is analog, with no digits: a small pocket watch in thin line art (the pillar-icon stroke, currentColor) with a thin rim (doubled only at sizes where it stays clean), a crown and bow, twelve ticks with longer quarters, no numerals, slender hands with a small open loop near the hour hand's tip, and a centre pin. In the header it sits at the top left, beside the "INSOMNIA / by Joel Soto" brand block and as tall as it (about 38 px with a double rim on desktop, about 31 px with a single rim on phones), as an emblem next to the name; its hands follow the scroll continuously (hour hand 180 + 360p degrees, minute hand 360 x 12 x p, for night progress p from 0 to 1), so it reads 6:00 at the top and, one full turn later, 6:00 at the bottom. The intro shows the full name "Insomnia by Joel Soto", then the hairline, then the same watch, larger and static at 6:00, over the red mist. It is decorative and hidden from assistive tech. The 3D lighting follows the clock: dusk at the top (slightly warm, lighter fog), midnight deepest (red glow at its strongest, still subtle), small hours coldest, pale dawn near the footer. Only cheap parameters change (fog colour and range, exposure between 1.13 and 1.15, a rim light's tint and strength, the glow); the studio reflections never change, so the chain stays neutral silver at every hour.

## Motion

Calm and slow, as in Black & White. No pointer or device-orientation tracking. Nothing bouncy. No camera roll, except the landing's one slow half turn, driven only by scroll. Card flips and mist drift are slow. Every animation respects `prefers-reduced-motion`.

## Section map (home)

1. Intro (6:00 PM): "Insomnia by Joel Soto", the hairline and the watch over the rose mist
2. Hero, the entrance: the edge of the hole with "Insomnia / by Joel Soto" floating above it (no other text), then the fall (see The entrance and the fall)
3. Pillars, reality (bone)
4. Band 1, dream: no text, a window onto the misty shaft; the steel chain drapes across its centre (the only window with the chain)
5. Jewelry deck, reality
6. Band 2, dream: no text, a window onto the misty shaft; letters tumble in it and, as the band reaches the middle of the screen, spell one of the T-shirt words
7. Printed T-shirts, dream: a window onto the shaft right after band 2, where the ten tees hang on a floating clothing rack (see The clothing rack); the grid on bone without WebGL
8. Band 3, dream: no text, a window onto the misty shaft; loose pages flutter down and two open books turn their pages
9. Readings
10. The landing, dream: the end of the fall, the hall at dawn (see The landing)
11. Footer (6:00 AM, dawn), over the landing's last frame

## The entrance and the fall (step 11)

Not a book, a storybook or a paper theatre: the visitor stands at the edge of a hole in the earth, in first person, and falls in. Everything is real 3D, procedural (no image textures), lit by the Rosa atmosphere, with no characters.

- **Shot 1, the edge (top of the page, 6:00 PM):** standing at the rim and looking down at about 50 degrees. Massive old roots frame the opening, dark bark rim-lit by the rose light rising from below; earth with a little moss around the mouth; the hole's walls going down in strata; a faint rose glow far below; motes drifting up out of it. The name floats above the hole. On the foreground root lies a small steel pocket watch (case, glass, crown and bow, a short chain, the lid open, the hands at 6:00) whose glass catches a soft glint every few seconds: a hint of who went first, without anyone in sight.
- **Shot 2, over the edge (about 10 to 35% of the entrance):** the name rises and fades; the camera steps over the rim and tips down into the hole.
- **Shot 3, the fall:** walls of earth, clay and rock in wavering strata, with cracks, damp patches, embedded stones and hanging roots, rushing past. The fall's speed follows the scroll; motes streak while falling fast. No shake and no roll, ever.
- **Shot 4, the look back (about 60%):** a brief tilt up at the mouth, a small disc of dusk sky shrinking above.
- **Shot 5, the shaft:** the walls widen and dissolve into mist; the camera levels and keeps descending for the rest of the page, so every band is a window onto the same fall. The chain hangs only in band 1. A black grand piano falls slowly through shot 5, turning, and the visitor passes it (see The objects of the fall).
- **First paint:** a still of shot 1, rendered from the scene itself, shows until the live scene is ready and crossfades into it. The home page stays ink until then, so nothing bone flashes first. Without WebGL the stills stay (the edge in the hero, the shaft in the bands) and the hero has normal height. With reduced motion, only shot 1, static, at normal height: no fall.
- The hero's name keeps AA over the scene: a soft, dark hush sits behind it, so even a passing mote leaves the text above 4.5:1.

## The objects of the fall (step 12)

All built in code (lathes, tubes, boxes, extruded outlines, canvas textures): no model or image files, designed for this site, nothing copied from any film or game, and no characters. They live in the misty shaft below the walls, fixed in place, so as the visitor falls they pass upward at different depths, tumbling slowly; near ones are rare and never fill more than about a third of the frame, far ones fade into the fog.

- **The DRINK ME bottle:** a small glass bottle (faked glass: clear at its centre, catching the studio's reflections at its edges), a cork, and a paper tag on a string. The tag reads "BÉBEME" in Spanish and "DRINK ME" in English, set in Cormorant capitals, and changes with the language.
- **The EAT ME cake:** a small round cake on a little plate, "CÓMEME" / "EAT ME" spelled on top in currants (small dark beads), following the language.
- **Teapot, teacups and saucers:** bone porcelain with a soft sheen and a thin dark glazed line at the rims. Drops of tea float out of one tilted cup.
- **Pocket watches and clock faces:** steel cases (neutral silver, measured) with bone dials; their hands show the night's hour, as the header watch does.
- **Playing cards:** our deck, step 5's cards: faces with the jewelry link drawings, names, ranks and suit marks; backs with the steel chessboard. They tumble slowly. Nothing on them is red.
- **Open books:** pages fanning slowly about the spine.
- **Keys:** small antique steel keys (neutral silver).
- **Roses:** a few red roses, the only red objects in the scene, never more than two or three on screen (measured: at most one).
- **The piano:** a black lacquered grand, lid propped open, falling slowly and turning in shot 5 of the entrance, so every visitor passes it: the signature moment.

Choreography:

- **The hero's end:** after the piano, the first scattered objects: the bottle, the cake, a cup with its drops of tea, a watch, and two cards (Void and Heart).
- **Band 1:** the chain, as before; at most a small key or card far behind it.
- **Band 2 (before the T-shirts):** letters in bone and silver, a little thick, tumble in the mist. As the band reaches the middle of the screen they drift together and spell one of the T-shirt words (chosen once per visit), hold it, then drift apart. With reduced motion the word is already spelled.
- **Band 3 (before the Readings):** loose pages with faint, unreadable lines of text flutter as they fall; two open books turn their pages slowly.
- **Between the bands:** the other objects keep drifting, so the fall feels continuous whenever a window is open.
- With reduced motion every object is placed and still. Without WebGL the stills stay; the shaft still for the bands shows a few objects.

## The landing (step 13)

The fall ends at the bottom of the page, in a long, low hall built from Lewis Carroll's description, in our own design: everything in code, no characters, nothing copied from any film or game.

- **The hall:** closed doors all around its walls, in dark wood with simple Victorian panels (four raised panels, a plain frame) and thin steel handles (neutral silver, measured; no brass); a dark wood skirting and picture rail; three lamps hanging from the ceiling, bone porcelain shades with a warm, soft light. A small three-legged glass table (the bottle's fake glass) with a tiny steel key on it, and the DRINK ME / BÉBEME bottle beside it, its tag in the site language. Low in the back wall, a small door, half hidden behind a short curtain on a steel rod, with a thin line of pale light under it and a faint pool of that light on the floor: a garden beyond. The floor is the chessboard, in its muted ink and bone.
- **The sequence** (the landing's own scroll progress, 0 to 1, after the Readings): at 0 the visitor is still falling down the misty shaft and the hall appears below, upside down, its chessboard floor on top and its lamps pointing up, emerging from the mist; the fall slows as it approaches. Between about 0.3 and 0.7 the view turns over once, slowly and eased, driven only by scroll, never on its own: the room rights itself. This is the only roll in the site. Towards 1 the visitor glides in and settles on the chessboard floor at standing height, facing the small door. The night reaches dawn there: pale, slightly warm light, the rose glow almost gone, the motes thinning out, no veils.
- **Fall again:** the small door is a real button over the 3D door ("Volver a caer" / "Fall again", shown on hover and focus, and always on touch screens): it takes the visitor back to the top of the page at once (no intro), to fall again.
- **The footer** sits over the landing's last frame, transparent over a soft scrim of ink so its text stays AA over the scene; the header watch reaches 6:00 AM at the very end.
- With reduced motion there is no turn: the landing shows the hall upright, the visitor already on the floor, still; Fall again still works. Without WebGL, a still of the last frame shows behind the footer, with the same door button.

## The clothing rack (step 14)

The T-shirt section is a dream window onto the shaft, right after band 2, so the letters that spell a word there lead straight into the tees that carry those words.

- **The rack:** a circular clothing rack floating in the mist with no visible support: a thin steel ring (neutral silver, measured), ten steel hangers, one tee on each, black and white alternating. It leans a little towards the visitor, so the ring reads as a ring. It turns very slowly on its own (pausing while the pointer or focus is on it, and for a few seconds after the visitor turns it), the tees sway gently in the air of the fall, motes drift around it, and a faint rose halo glows beneath the ring (light, never a fill). It stays right under the heading as the section scrolls in: unlike the far objects of the shaft, it moves with the page, keeping the same shape wherever it is on the screen.
- **The tees:** cloth, cut to the step 6 mockup's silhouette, printed with the step 6 compositions exactly as the dialog draws them (front view, the word and its meaning, the meaning in the site language), redrawn when the language changes. Their backs are plain fabric.
- **Turning it:** drag (mouse) or swipe (touch) sideways, with gentle inertia; it eases to rest with the nearest tee facing the visitor. Vertical swipes and the wheel scroll the page as usual. Two round arrow buttons step to the previous or next tee; Left and Right arrows do the same while the rack has focus.
- **The facing tee** is a little brighter; its name shows under the rack in Cormorant small capitals with a short rose rule under it: on dark the red is light (the rose of the glow, solid, as a hairline), and it is the only red on screen. Selecting it (click, tap, Enter) opens the T-shirt dialog, its mockup flying out of the 3D tee. Clicking a tee that is not facing first turns the rack to it. The dialog opens on exactly what the rack tee shows (its colour, the front print with the word and its meaning, in the site language), so nothing changes while it flies; the preview only changes when the visitor chooses an option. The dialog's paper fades in with it, so no light block appears at once over the dark window.
- **The names:** a quiet row of the ten names under the rack is the accessible list: each turns the rack to its tee, and opens its dialog when activated again. The heading, the names and the credit line stay legible over the scene (AA).
- With reduced motion the rack does not turn on its own and the tees do not sway; drags, buttons and names step straight to the next tee. Without WebGL, or if the rack cannot be built, the section is the step 7 grid on bone, unchanged.

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
- Grid crop (step 7): the T-shirt grid shows each black tee as a close crop on the chest print (the same frame for all ten, with the collar, shoulder line and seams in view so it reads as fabric), so long words read at grid size; the dialog keeps the whole tee at realistic print scale, and the tee opens out from the crop. Since step 14 the grid is the fallback (no WebGL); the tees hang on the clothing rack.
- Readings (step 7): an editorial index in the Readings section (one row per article between thin rules: number, the pillar's line icon and category; italic title and excerpt; "Leer / Read"), and one reading page per article on paper: the pillar icon, the category, the title in Cormorant italic, six paragraphs in EB Garamond at a reading measure. The header hairline and the pocket watch follow the reading, from 6:00 PM at the start of the text to 6:00 AM at its end. No 3D chain on reading pages. The index title morphs into the article's heading (View Transitions); the header stays put.
- The 3D preview (built after step 14): choosing a form turns the card over to show the piece in 3D; see The jewelry preview.

## The jewelry preview

In the jewelry dialog the card opens as dealt. As soon as the visitor chooses a form, it turns over with the deck's slow flip, and its back is a small window onto the piece: the chosen link repeated along the chosen form, at the chosen length, in the chain's own steel and studio light, so it reads exactly like the chain (neutral silver, measured for every link). A quiet button under it turns the card back and forth ("Ver carta / View card", "Ver pieza / View piece").

- **The links,** built in code from their technical descriptions (the reference photos for shape only): Void, a long stadium of round wire; Star, flat five-pointed stars joined by small rings; Monolith, twisted, flattened curb links with flat, diamond-cut faces, lying flat; Static, small ovals with an engraved surface that catches the light in flashes; Together, elongated rectangles of square wire; Meridian, small, fine, smooth ovals; Heart, puffed hearts joined by small rings; Echo, flat discs pierced near both edges, joined by rings; Snake, compact rounded cubes. Chains whose links alternate (Void, Static, Together, Meridian, Snake) turn each link 90 degrees from the last; stations alternate the element (flat) and its ring (on edge).
- **The forms:** necklace, an open curve resting around the neck, the front falling onto the chest (lower the longer it is), the clasp at the back; bracelet, a closed loop around the wrist of a relaxed hand; anklet, a slightly larger loop resting low on the ankle; ring, a small ring of the link scaled down around a finger; head piece, an arc across the forehead with the ends going back around the head (what is left of the length hangs at the back); waist chain, a large loop on the hips with a gentle drape at the front; other, a single hanging length.
- **Lengths:** standard is the usual length of each form (necklace 45 cm, bracelet 18, anklet 24, ring 5.7 cm round the finger, head piece 55, waist chain 80, other 30). Made to measure with a number of cm changes the length live, held to a sensible range per form (necklace 35 to 90, bracelet 14 to 24, anklet 20 to 30, ring 4.4 to 7.5, head piece 45 to 70, waist chain 60 to 130, other 5 to 100); without a number it shows the standard length.
- **The scale guide:** behind the piece, a very faint, thin line-art outline of the body part (neck and shoulders, wrist and hand, ankle and foot, finger, head, waist and hips), generic, with no face or features, in the line-art colour for light backgrounds. An invisible body hides the part of the chain behind it, so the piece reads as worn. The guide is a measure, never an illustration of a person.
- **Motion:** the piece swings slowly either side of the front, showing its depth while it keeps reading as worn; the visitor can drag it sideways to turn it all the way round (no zoom), and it eases back into the swing. A change of form or length slides the links into the new shape; another link crossfades in. With reduced motion the card turns at once and the piece rests in a still three-quarter view (dragging still turns it); changes are immediate. Without WebGL the card does not turn; everything else in the configurator works as before.
- The 3D window's accessible name describes the piece ("Vista previa: pulsera con eslabón Void, estándar" / "Preview: bracelet with Void link, standard"; made to measure adds the length) and follows every choice.

## Edges of the site (step 9)

- 404: on ink, the pocket watch large and stopped at 3:47 in steel line art, "Esta hora no existe." / "This hour doesn't exist." in Cormorant italic, "Te perdiste en la niebla." / "You got lost in the mist." below, and the way home.
- Share image (1200 x 630): the intro itself (ink, the rose mist low at the bottom, "INSOMNIA" with "by Joel Soto" in the intro's type, the hairline and the watch at 6:00), set larger so it reads as a small preview; no film grain.
- Favicon: the pocket watch at 6:00 in line art, ink on light browser themes and bone on dark ones; the app icons show it in bone on ink.
