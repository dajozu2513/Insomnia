# CLAUDE.md

**Before any visual work (styles, layout, motifs, motion, 3D look, copy placement), read `docs/brand/design-direction.md`.** It sets the palette, typography, motifs, IP rules and the night cycle.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Website for **Insomnia by Joel Soto**, a brand that merges two lines by Joel Soto:

- **Black & White by Joel Soto**: handmade steel jewelry (9 pieces).
- **Obscure Human Feelings**: a T-shirt line where each garment carries one word for an emotion that language has not named yet, with its meaning (summary in `docs/brand/obscure-human-feelings-summary.docx`).

The site keeps the Black & White aesthetic (minimalism, black and white palette, a 3D steel chain behind the home page) but is rebuilt in React + TypeScript and deployed on Render as a static site. Repo: `github.com/dajozu2513/Insomnia`.

Current state: foundation, the 3D steel chain, and the first half of the home page in the Insomnia aesthetic: intro splash, hero, pillars, three text-free bands, the analog header clock, the footer line, and section headings for jewelry, T-shirts and readings (their bodies are placeholders). The 3D scene has its night atmosphere (chessboard floor, hero red mist, dust, fog and lighting that follow the night cycle). The jewelry deck and its configurator are built; the T-shirts and readings are still to come.

## Stack

- Vite 8, React 19, TypeScript 6 in strict mode (plus `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`)
- react-router-dom 7 (`createBrowserRouter`)
- three `0.183.0` and `@types/three` `0.183.0`, pinned exactly: the legacy chain was tuned on this version, so do not upgrade it without comparing the look side by side
- Plain CSS with custom properties. No UI or CSS framework, no CSS-in-JS
- ESLint 10 (flat config, typescript-eslint strict type-checked, react-hooks, react-refresh) and Prettier
- npm, Node 24 (`.nvmrc`; Vite needs Node 20.19+ or 22.12+)

TypeScript is held at `~6.0` because typescript-eslint does not support TypeScript 7 yet.

## Commands

```bash
npm install          # first time
npm run dev          # dev server at http://localhost:5173
npm run build        # type-check (tsc -b) and build to dist/
npm run preview      # serve dist/ locally
npm run lint         # ESLint
npm run format       # Prettier write; format:check to verify only
npm run typecheck    # tsc -b only
```

Run `npm run build` and `npm run lint` before finishing any change; both must pass with no errors.

## Folder structure

```
src/
  main.tsx              entry: mounts <App>, imports tokens.css then global.css
  app/                  App.tsx (providers) and router.tsx (route table)
  components/layout/    Layout (skip link, Header, <main>, Footer), Header, Footer, LanguageToggle
  pages/                route-level components: HomePage (composes features/home), NotFoundPage (placeholder)
    lab/                /lab: internal visual lab (not linked, noindex, lazy-loaded): palette and measured contrast, type, pocket watch (header and intro sizes), motifs, card, atmosphere
  features/             one folder per feature
    chain/              3D steel chain (see "3D chain" below)
    home/               home sections: Hero (+ byline.css, shared with the intro), Pillars (+ PillarIcons), Band, HomeSection
    intro/              IntroSplash (once per tab)
    night/              night cycle: progress store (night.ts, SHOW_SCROLL_CLOCK) and the header ScrollClock (pocket watch)
    motifs/             thin line-art SVG ornaments: Chessboard, FiligreeDivider, Rose, Key, ClockFace, OvalLink (placeholder link)
    clock/              analog clock: <PocketWatch> (line-art pocket watch) and watchGeometry.ts (hand angles)
    cards/              lab sample card: CardFront, CardBack, FlipCard (slow flip, instant with reduced motion)
    deck/               jewelry deck: Deck, CardFaces, LinkDialog (configurator), linkArt (nine link SVGs) + linkArtMap, whatsapp (message builder)
                        jewelry deck, apparel, articles to come
  i18n/                 LanguageProvider, useI18n, es.ts, en.ts, types
  hooks/                shared hooks: usePrefersReducedMotion, useInView (legacy observe-fade / observe-reveal)
  lib/                  scrollFrame.ts: the single rAF-batched scroll/resize scheduler
  types/                css.d.ts (CSS custom properties in inline styles)
  data/                 links.ts (the nine links), forms.ts (forms and sizes): the deck's single source of truth
  styles/               tokens.css (design tokens), global.css (reset, base type, reduced-motion contract), atmosphere.css (grain, vignette, mist)
public/images/          photos copied from the legacy site, lowercase .jpg names
  background/           horizontal, vertical (hero/band fallbacks), chain (unused in the legacy site)
  og.jpg                Open Graph image
docs/brand/             brand documents (committed)
_reference/             legacy site, local only (gitignored)
.agents/skills/         Three.js agent skills, local only (gitignored); listed in skills-lock.json
render.yaml             documents the Render service configuration (not used as a Blueprint)
```

Component CSS sits next to its component (`Header.tsx` imports `Header.css`) and uses plain, descriptive class names carried over from the legacy site (`.brand-name`, `.lang-opt`, `.scrolled`). Feature code goes in `src/features/<name>/`; pages compose features.

## Styling

- Design tokens live on `:root` in `src/styles/tokens.css`, following `docs/brand/design-direction.md`:
  - Palette: `--ink`, `--ink-raised`, `--bone`, `--bone-deep`, `--text-on-dark`, `--text-on-light`, `--steel`, `--accent`, `--accent-glow`.
  - Derived (added, AA-checked): `--text-on-dark-muted`, `--text-on-light-muted` for secondary text; `--border` (alias of `--bone-deep`, 1px rules on light).
  - Channels for translucent overlays: `--ink-rgb`, `--text-on-dark-rgb`, `--steel-rgb`, used as `rgb(var(--ink-rgb) / 0.55)`.
  - Type: `--font-display` (Cormorant Garamond: titles, phrases), `--font-body` (EB Garamond: body text, set on `<body>`), `--font-ui` (Montserrat: labels, UI, clock; set it explicitly on every label); layout: `--gutter`, `--header-height`, `--radius`.
  - The legacy `--bg`, `--surface`, `--ink-mid` and `--ink-light` are gone (`--bone` and the muted text tokens replace them).
- Never hard-code a colour: use a token or a token channel. Light sections use `--bone` with `--text-on-light`; dark sections use `--ink` with `--text-on-dark`. Line art on light sections uses `--text-on-light` or `--text-on-light-muted`, never `--steel`. Red (`--accent`) is one focal point per screen at most, text only on light; on dark it is `--accent-glow` light, never text; and never in persistent UI (header, footer, language toggle).
- Every text pairing must pass WCAG AA. `/lab` measures them live from the tokens; check it after changing a colour.
- Atmosphere utilities in `src/styles/atmosphere.css`: `.atmo-grain` (film grain via `--grain-image`, also used by the home bands), `.atmo-vignette`, `.atmo-mist`. All stop moving under reduced motion.
- Fonts load from Google Fonts in `index.html`: Cormorant Garamond 300/400/600 and italic 300; EB Garamond 400 and italic 400; Montserrat 200/400/500. Montserrat 300 and EB Garamond 500 were dropped once body text moved to EB Garamond. Add a weight there before using it.
- Ornaments are thin line art: use the motifs in `src/features/motifs/` (stroke `MOTIF_STROKE`, 1.3 px at any size, as the legacy pillar icons). One motif per section at most; objects and patterns only, never characters (see the IP rules in the design direction).
- Image paths are lowercase (`/images/background/horizontal.jpg`). Render's file serving is case-sensitive. There are no product photos on the site: the links are drawn (`features/deck/linkArt.tsx`).

## Internationalization rules

- All user-facing copy is bilingual. Spanish is the default; English is the alternative.
- Copy lives only in `src/i18n/es.ts` and `src/i18n/en.ts`, never inline in components. Read it with `const { t } = useI18n()` and `t.section.key`.
- `es.ts` is the schema: `Dictionary` is `typeof es`, and `en.ts` is typed as `Dictionary`. A key missing in either file, or present in only one, is a compile error. **Always add every new key to both files.**
- The choice is saved in `localStorage['insomnia-lang']` (reads and writes are wrapped in try/catch) and mirrored to `<html lang>`.
- Strings in `[brackets]` are placeholders for copy Joel has not written yet, marked with a `// PLACEHOLDER` comment. Never invent brand copy; add a placeholder instead.
- Text that is the same in both languages (product names, the brand name) stays identical in both dictionaries or stays out of them. In the legacy site product names were never translated because they are lookup keys.
- No emojis anywhere: code, comments, docs or UI.

## Home page (`src/features/home/`, `intro/`, `night/`)

Section map and look come from `docs/brand/design-direction.md`; behaviour is ported from the legacy CLAUDE.md ("Home page"), `js/main.js` and `css/styles.css`.

- **Scroll frame** (`src/lib/scrollFrame.ts`): every scroll-driven effect subscribes with `subscribeScrollFrame(listener)`. One passive scroll/resize listener plus a body `ResizeObserver`, batched into one rAF; listeners write to the DOM through refs. Never add another window scroll listener for visual effects, and never set React state per frame (the header's `.scrolled` flag is the only state, and it only changes when it flips).
- **Night cycle** (`features/night/night.ts`): night progress is page scroll progress (0 at the top = 6:00 PM, 1 at the bottom = 6:00 AM). `subscribeNightProgress(cb)` calls back inside the scroll frame; `getNightProgress()` returns the latest value. Step 4 drives the 3D lighting from `subscribeNightProgress`, without React.
- **Scroll clock** (`night/ScrollClock.tsx`): an analog `<PocketWatch>` at the top left of the header, in `.header-left` beside the brand block and as tall as it (`calc(clamp(1.1rem, 2.2vw, 1.5rem) + 0.6rem + 4px)`: about 38 px on desktop, 31 px on phones). Double rim, hidden (`.pocket-watch-inner-rim`) below 900 px where the watch gets too small for it. Behind `SHOW_SCROLL_CLOCK`. The hands are `<g>` elements whose `transform` is written through refs in the scroll frame (`watchAngles`: hour 180 + 360p, minute 4320p), continuously, so it also follows the scroll with reduced motion; they render without a transform prop so React never overwrites them. `?night=` freezes it. Colour is `currentColor` (the brand's colour), with a drop shadow over the hero. `aria-hidden`. On phones the tagline hides (below 600 px); the watch, brand and toggle fit down to 320 px, so the watch never hides.
- **Intro** (`intro/IntroSplash.tsx`): "INSOMNIA" rises with "by Joel Soto" under it (the shared by-line style), the hairline draws, the pocket watch fades in at 6:00 (static, double rim, 64 to 88 px, in `--steel` at 62%, the hairline's quiet level; fully in by 1.6 s, before the 2 s lift), then a clip-path curtain lifts after 2 s. Behind it, `.intro-red-mist`: two layers of eased radial gradients from `--accent-rgb` / `--accent-glow-rgb`, gathered in the bottom and the lower corners (the upper half and centre stay clean ink), drifting slowly (static with reduced motion), under a lighter vignette and the grain; the design's one large use of red. The splash is opaque ink at z-index 999, so the chain canvas never shows through it. Once per tab (`sessionStorage['insomnia-intro-seen']`). Whether to show is read in a state initializer (pure) and the key is written in the effect, so StrictMode's double mount is harmless. `index.html` adds `intro-pending` to `<html>` before first paint on a first visit to `/` (page stays ink, no flash); while it is set the hero entrance is paused (`animation-play-state`).
- **Hero** (`home/Hero.tsx`): only the letter-by-letter title (`h1` with `aria-label`, chars `aria-hidden`) and "by Joel Soto" inside the necklace. The by-line is `.name-byline` (`home/byline.css`, shared with the intro): Cormorant Garamond italic, `clamp(1.45rem, 2.6vw, 2.1rem)`, chosen over Montserrat spaced capitals at the same size because it reads as part of the name. The former hero line is now `meta.description`: `index.html` ships the Spanish text for crawlers and `LanguageProvider` swaps it with the language (keep both in sync). Mist along the bottom (`.atmo-mist.hero-mist`, masked; two classes so it beats `.atmo-mist`'s `inset: 0`); the legacy radial overlay is the vignette. No call to action. Photo-fallback parallax 0.35x through the scroll frame.
- **Pillars** (`home/Pillars.tsx`): Steel / Words / Vigil on bone, icons from `PillarIcons.tsx` (link, open quotation mark, crescent moon) that draw themselves: a ref measures every stroked shape into `--len` and adds `.draw`; shapes with `stroke="none"` get `.fill` and fade in after. A filigree divider sits above, in `--text-on-light-muted`.
- **Window mist** (`.atmo-mist`, hero and bands): positioned inside its window and never moved by scroll; its only motion is a slow, time-based horizontal drift (`mist-drift`), off with reduced motion.
- **Bands** (`home/Band.tsx`): three of them (after the pillars, after the jewelry, after the T-shirts); pure, text-free windows onto the chain (`aria-hidden`), 460 px tall (300 px on phones): mist, a soft edge vignette and grain, nothing else. The chain drapes across the centre of each (see DRAPE_STYLE). Photo fallback drifts and eases out of a 1.1x zoom (static with reduced motion; never `background-attachment: fixed`).
- **Jewelry deck** (`features/deck/`), inside the jewelry section (opaque bone, so the chain layering rule holds):
  - **Data:** `src/data/links.ts` (`LINKS`: id, name, rank, chainType, technical, poetic; localized fields are `Record<Lang, string>`, so both languages are required) and `src/data/forms.ts` (`FORMS`, `SIZES`). Link names are never translated and never get an i18n key. UI copy (labels, the WhatsApp template) lives in the dictionaries under `home.deck`.
  - **Add a link:** an entry in `LINKS` (id, name, rank, texts in both languages), a drawing in `linkArt.tsx` (64-unit box, `MotifSvg`, solids `stroke="none"`), and its id in `linkArtMap.ts`. **Add a form:** an entry in `FORMS` (`OTHER_FORM_ID` reveals the free-text field; `CUSTOM_SIZE_ID` the cm field).
  - **Deal:** the cards start face down and turn face up one by one (0.14 s apart) the first time the deck is 20% in view; face up from the start with reduced motion.
  - **Card red rule:** nothing on a card is red at rest; only the suit marks of the hovered (fine pointers), focused (`:focus-visible`) or selected card turn `--accent`; in the dialog, its card's marks are the one red. Hover lifts the card 6 px and dims the others to 0.7 (not lower: their text must stay AA).
  - **Dialog** (`LinkDialog.tsx`, ported from the legacy product modal): a native `<dialog>` opened with `showModal()` (top layer, `aria-modal`, focus moves in, the page is inert so focus stays inside), labelled by the link name. The card flies in from the grid with a 750 ms FLIP (skipped with reduced motion or when there is no on-screen source); overlay and panel animate only their background colour; closing fades out in 350 ms. Escape and a click on the backdrop close it; focus returns to the card; `html { overflow: hidden }` locks the page (`scrollbar-gutter: stable` keeps the layout from shifting).
  - **WhatsApp** (`whatsapp.ts`): `buildMessage(link, config, lang, strings)` composes the message (link, form, size; lines without a value are left out; "Otra (text)"; "A la medida (18 cm)" with the number localized), `whatsappUrl()` builds the wa.me link. It updates live and re-renders on language change.
  - **Deep links:** `?link=<id>` opens that card's dialog on load (and skips the intro); opening and closing keep the parameter in sync with `replaceState`; unknown ids are ignored.
- **Reality sections** (`home/HomeSection.tsx`): opaque bone, legacy heading (roman lead, italic tail, rising out of its slot at 30%; the header fades in at 12%).
- **Footer**: the brand, the approved line "Acero y palabras para quienes no duermen." in small italic body type (`--text-on-dark-muted`), and the copyright. No red.
- **useInView** (`hooks/useInView.ts`): the legacy `.observe-fade` (`FADE_THRESHOLD` 0.12) and `.observe-reveal` (`REVEAL_THRESHOLD` 0.3) observers as a hook returning `[ref, visible]`; one re-render per element, then it disconnects.

## 3D chain (`src/features/chain/`)

One long steel chain on a single fixed, full-viewport canvas (`z-index: -1`) behind the home page, ported from the legacy `js/chain3d.js` with the same geometry, studio lighting, material, tone mapping, exposure, pixel-ratio cap and motion constants. The look and every constant are documented in the legacy CLAUDE.md ("3D chain") and in `engine/constants.ts`; change a value only on purpose and record why.

### Architecture

- **Engine** (`engine/`, plain TypeScript, no React): `createChainScene(container, options)` creates its own `<canvas>` inside the stage, builds the renderer, studio environment and instanced chain, and returns `{ rebuild, setReducedMotion, dispose }`. Modules: `constants.ts` (every tuned number), `geometry.ts` (stadium link, steel material), `studioEnvironment.ts` (the studio baked with PMREM), `buildPath.ts` (the path from the live layout, pure). Scroll easing, pull speed, flow and the render loop live in closures and `setAnimationLoop`; **scrolling never touches React state**.
- **`<ChainStage />`** renders the fixed stage `<div>` and owns the engine lifecycle. It loads the engine with `import('./engine/createChainScene')`, so three.js lands in its own chunk (`createChainScene-*.js`, about 520 kB / 130 kB gzip) and the main bundle stays light. Nothing outside `engine/` may import `three` at runtime (`import type` is fine); `types.ts` and `index.ts` must stay three-free.
- **StrictMode / remounts:** the import is guarded by a `cancelled` flag, so the double mount in development creates one engine. `dispose()` stops the loop and every listener, observer, timer and pending rAF, disposes the link geometry, material, instanced mesh, environment render target and renderer, forces context loss and removes the canvas. It is safe to call twice.
- **Rebuilds:** on window `resize` and when `document.body` changes size (`ResizeObserver`, debounced 120 ms), because fonts and images move the bands; also when an anchor mounts or unmounts.
- **Loop:** runs only while the hero or a band is intersecting the viewport and the tab is visible. With reduced motion (from `usePrefersReducedMotion()`, live) there is no loop and no parallax (factor 1); the chain redraws on scroll only.
- **Fallback:** an inline script in `index.html` adds `has-3d` to `<html>` before first paint when WebGL and modules exist and the page is not on `file://`. CSS then hides the hero and band photos. If the dynamic import or `WebGLRenderer` fails, `ChainStage` removes `has-3d` and unmounts the stage, and the photos (`horizontal.jpg`, `vertical.jpg` in portrait) come back.
- No pointer or device-orientation tracking, ever: the owner wants the motion calm and driven by scroll only.

### Anchor API

Wrap the page in `<ChainAnchorsProvider>` and render `<ChainStage />` inside it. Windows report their elements with ref hooks, never through class-name queries:

```tsx
const heroRef = useChainHeroRef(); // <section ref={heroRef} className="hero">
const bandRef = useChainBandRef(); // <section ref={bandRef} className="separator">
```

- The registry (`anchors/registry.ts`) is plain mutable state outside React; registering never re-renders. Changes are batched into one `rebuild()` per microtask.
- Any number of bands can register; the path drapes across each in document order (the home page has three). Visibility (the render loop), night lighting and particles are not tied to a band count. Bands are sorted by document order. With `DRAPE_STYLE = 'centred'` (the default since the bands lost their text) every drape is a gentle catenary centred in its band, entering alternately from the left and the right; `'legacy'` restores the old low sag / high hang that cleared the band phrases.
- The engine reads positions on every rebuild: each band's document top and `offsetHeight`. The hero is used for visibility (render loop) only; the necklace is sized from the viewport and centred on it, exactly as in the legacy site, so the hero must be a full-viewport section with its title centred (the title block is nudged down by `translate: 0 6vh` because the ring's near side reads lower).

### Night atmosphere (step 4)

Modules in `engine/`: `floor.ts`, `particles.ts`, `glow.ts`, `nightCycle.ts`, plus `debug.ts` (development only). Tuned values live in `constants.ts` (ATMOSPHERE block) and `nightCycle.ts` (keyframes). **The chain must read as neutral silver steel at every hour; that wins over any atmosphere effect.** Never re-bake the PMREM environment per frame: it is what keeps the steel neutral.

- **Hero presence** (`heroPresence()` in `createChainScene.ts`): read from the hero element's real position each frame (not the eased camera): `rect.bottom / innerHeight`, clamped 0..1, plus whether any band is on screen. The floor and the hero red mist belong to the hero window: they fade with it and are forced off whenever a band is on screen, at any width and scroll speed. Do not go back to camera culling alone (the eased camera let the floor show in band 1).
- **Floor** (hero only): a 140 x 110 plane with a chessboard `CanvasTexture` (no image files), squares 1.8 world units, `FLOOR_DARK` / `FLOOR_LIGHT`, 4x anisotropy. Unlit, fogged and **not tone-mapped**, so its fully fogged far edge equals the clear colour and dissolves; drawn first without depth writes, so it never hides a link. Its opacity is the hero presence (`smoothstep(0.55, 0.9)`): it stays in the opaque pass (`transparent: false`) with `CustomBlending` (SrcAlpha / OneMinusSrcAlpha), so it still draws before the chain while fading. Height `-viewHeight * lerp(0.66, 0.54, wide)` (lower on portrait screens). `FrontSide` only and hidden once the camera sinks towards it, so it never shows in the bands. No reflection: a mirror pass would cost a second render of the chain and read as a mirror.
- **Particles:** one `Points` with a soft round `CanvasTexture` sprite; 120 motes, 60 at widths up to 700 px. They rise at 0.09 units/s with a slow sway in a box that travels with the camera (z from -8 to 12, in front of and behind the chain). `draw(dt)` moves them; with reduced motion the redraw passes `dt = 0`, so they stay still.
- **Hero red mist** (`heroMist.ts`): the intro's red carried into the scene, so the curtain lifts into the same night. A camera-facing plane with eased radial falloffs in `--accent` / `--accent-glow` in the bottom and lower corners (centre clean), strength 0.7 times the hero presence (`smoothstep(0.3, 0.85)`). Drawn after the floor and before the chain, without depth test or writes, so it lies over fog, floor and background while every link is drawn on top: the steel is never tinted. Measured chain colour with it (hero, desktop): night 0 saturation 0.0313, luminance 0.2343; night 0.5: 0.0419, 0.2020; mean RGB 114/114/115 at night 0 (no red shift).
- **Glow:** an additive radial-falloff plane far behind the chain (z = -14) in `--accent-glow`'s colour, following the camera; strength from the night cycle (0.2 at midnight). It adds light to the mist, never colour to the steel.
- **Night cycle** (`nightCycle.ts`): keyframes at 0 (dusk), 0.5 (midnight), 0.75 (small hours) and 1 (dawn), smoothstep-eased. Per keyframe: fog colour (also the canvas clear colour), fog near/far, tone-mapping exposure (1.13 to 1.15), rim light tint and intensity (a `DirectionalLight` behind and above), glow strength. The engine receives the night through `options.night` (`getNightProgress` / `subscribeNightProgress`, passed in by `ChainStage`), applies it only when the progress changes, and, when no loop is running (reduced motion), redraws from that same subscription, so the lighting follows the scroll on every redraw.
- **Measured chain colour** (desktop 1280x800, mean over the chain's pixels; saturation is HSV, luminance relative): hero view 0.030 to 0.052 saturation, 0.203 to 0.243 luminance; band 1 view 0.031 to 0.039 and 0.288 to 0.319. Mean R, G and B stay within 4 of each other. The steel's own colour (#c4c7ca) is about 0.03 saturated. Re-measure after changing any keyframe.
- **Cost** (Intel Iris Xe, offscreen bench): about +1.1 ms per frame for floor, dust and glow at both 1265x800 and the 390x844 phone viewport. three.js chunk +6.7 kB (+2.4 kB gzip).

**Review hooks.**

- `?night=0..1` in the URL freezes the night (3D lighting and header watch) at that progress for reproducible screenshots (`features/night/night.ts`). Without it nothing changes.
- In development only, `window.__insomniaChain` (`engine/debug.ts`): `measure(p)` returns the chain's mean saturation, luminance and RGB for the view on screen at night progress `p` (it renders with and without the chain and compares); `presence()` returns the floor opacity and hero red-mist strength as of the last frame; `bench(frames)` returns ms per frame with and without the atmosphere, rendered offscreen so vsync does not cap it. Production builds do not contain it.

### Layering rule

The hero and the bands are windows onto the chain: under `has-3d` they are transparent. **Every other home section must have an opaque background, or the chain shows through it. Never animate a section's own `opacity` (fade a child instead), or the black stage flashes through while it fades.** Keep the stage the only element with a negative `z-index`, and do not give ancestors of the home sections a `transform`, `filter` or `z-index` that would create a stacking context above the stage.

## Reduced-motion rule

Every animation must respect `prefers-reduced-motion`. The contract, inherited from the legacy site and documented at the bottom of `src/styles/global.css`:

- With reduced motion: no movement (no translate, scale or clip-path entrances, no parallax, no drift or looping, no scroll-driven camera, no smooth scroll). Short opacity fades may replace movement.
- The 3D chain must not run a continuous render loop; it redraws only on demand.
- In CSS, write the reduced variant in a `@media (prefers-reduced-motion: reduce)` block next to the animation. In TypeScript, read `usePrefersReducedMotion()` from `src/hooks/` and skip the motion.

## Deployment

**Live URL:** https://insomnia-js.onrender.com

Render static site `insomnia-js`, created manually in the Render dashboard and deployed from `main`: `npm ci && npm run build`, publishing `dist/`, with a rewrite of `/*` to `/index.html` so client-side routes load on refresh. Pull request previews are off. `render.yaml` documents that configuration but is not used as a Blueprint, so editing it changes nothing on Render; change the dashboard and keep the file in sync. Render reads the Node version from `.nvmrc` (24). Commit `package-lock.json`, since `npm ci` needs it.

## Legacy reference

`_reference/black-and-white/` is the previous vanilla HTML/CSS/JS site, kept locally and never committed. Treat it as read-only.

**`_reference/black-and-white/CLAUDE.md` is the source of truth for behaviour to port.** Read the relevant section before porting any feature; it records how each piece behaves and why (many details were explicit requests from the owner, such as the calm scroll easing of the chain, the 3x3 grid instead of a carousel, and no call-to-action in the hero). The legacy CSS is in `css/styles.css`, the chain in `js/chain3d.js`, page behaviour in `js/main.js`.

To run the legacy site next to the new one, start the `legacy-black-and-white` configuration in `.claude/launch.json` (port 8081). It runs the legacy `server.js` unchanged through a CommonJS wrapper, because this repo's `package.json` is `"type": "module"`.

Already ported: design tokens, reset and base typography, fonts, the header (transparent over the hero, `.scrolled` after 60px, 1px scroll-progress hairline, ES/EN toggle), the footer, the reduced-motion contract, the 3D chain, the intro splash, the hero entrance, the photo-fallback parallax and drift, the pillars with self-drawing icons, and the section headings. The legacy band phrases were dropped by design (the bands are text-free). Not yet ported: collection grid, product modal, articles and page transitions. Legacy reduced-motion gaps fixed on the way: the hero photo parallax and the hero rise now stop with reduced motion too. Changes from the legacy version: the language key is `insomnia-lang` (was `bw-lang`), the header and footer are styled by `.site-header` / `.site-footer` classes instead of element selectors, the brand links to `/`, and there is a skip link and visible focus outlines on the header controls.
