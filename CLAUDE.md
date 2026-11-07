# CLAUDE.md

**Before any visual work (styles, layout, motifs, motion, 3D look, copy placement), read `docs/brand/design-direction.md`.** It sets the palette, typography, motifs, IP rules and the night cycle.

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Website for **Insomnia by Joel Soto**, a brand that merges two lines by Joel Soto:

- **Black & White by Joel Soto**: handmade steel jewelry (9 pieces).
- **Obscure Human Feelings**: a T-shirt line where each garment carries one word for an emotion that language has not named yet, with its meaning (summary in `docs/brand/obscure-human-feelings-summary.docx`).

The site keeps the Black & White aesthetic (minimalism, black and white palette, a 3D steel chain behind the home page) but is rebuilt in React + TypeScript and deployed on Render as a static site. Repo: `github.com/dajozu2513/Insomnia`.

Current state: foundation (tooling, design tokens, i18n, header/footer shell) plus the 3D steel chain, shown on a temporary home layout (hero, two bands, opaque placeholder sections). The intro splash, the real home sections, collection grid, product modal, apparel and articles have not been ported yet.

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
  pages/                route-level components (HomePage is a temporary chain test layout; NotFoundPage is a placeholder)
    lab/                /lab: internal visual lab (not linked, noindex, lazy-loaded): palette and measured contrast, type, clock, motifs, card, atmosphere
  features/             one folder per feature
    chain/              3D steel chain (see "3D chain" below)
    motifs/             thin line-art SVG ornaments: Chessboard, FiligreeDivider, Rose, Key, ClockFace, OvalLink (placeholder link)
    clock/              night clock: formatClockTime() and <NightClockTime> (fixed width, tabular figures)
    cards/              playing card: CardFront, CardBack, FlipCard (slow flip, instant with reduced motion)
                        intro, collection, apparel, articles to come
  i18n/                 LanguageProvider, useI18n, es.ts, en.ts, types
  hooks/                shared hooks (usePrefersReducedMotion)
  data/                 typed product data (empty for now)
  styles/               tokens.css (design tokens), global.css (reset, base type, reduced-motion contract), atmosphere.css (grain, vignette, mist)
public/images/          photos copied from the legacy site, lowercase .jpg names
  products/             void, star, monolith, static, together, meridian, heart, echo, snake
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
  - Type: `--font-display` (Cormorant Garamond), `--font-body` (Montserrat), `--font-serif-body` (EB Garamond, body candidate); layout: `--gutter`, `--header-height`, `--radius`.
  - The legacy `--bg`, `--surface`, `--ink-mid` and `--ink-light` are gone (`--bone` and the muted text tokens replace them).
- Never hard-code a colour: use a token or a token channel. Light sections use `--bone` with `--text-on-light`; dark sections use `--ink` with `--text-on-dark`. Red (`--accent`) is one focal point per screen at most, text only on light; on dark it is `--accent-glow` light, never text.
- Every text pairing must pass WCAG AA. `/lab` measures them live from the tokens; check it after changing a colour.
- Atmosphere utilities in `src/styles/atmosphere.css`: `.atmo-grain` (film grain via `--grain-image`, also used by the home bands), `.atmo-vignette`, `.atmo-mist`. All stop moving under reduced motion.
- Fonts load from Google Fonts in `index.html`: Cormorant Garamond and Montserrat exactly as the legacy site loaded them (Cormorant 300/400/600 and italic 300; Montserrat 200/300/400/500), plus EB Garamond 400/500 and italic 400. Add a weight there before using it.
- Ornaments are thin line art: use the motifs in `src/features/motifs/` (stroke `MOTIF_STROKE`, 1.3 px at any size, as the legacy pillar icons). One motif per section at most; objects and patterns only, never characters (see the IP rules in the design direction).
- Image paths are lowercase (`/images/products/void.jpg`). Render's file serving is case-sensitive.

## Internationalization rules

- All user-facing copy is bilingual. Spanish is the default; English is the alternative.
- Copy lives only in `src/i18n/es.ts` and `src/i18n/en.ts`, never inline in components. Read it with `const { t } = useI18n()` and `t.section.key`.
- `es.ts` is the schema: `Dictionary` is `typeof es`, and `en.ts` is typed as `Dictionary`. A key missing in either file, or present in only one, is a compile error. **Always add every new key to both files.**
- The choice is saved in `localStorage['insomnia-lang']` (reads and writes are wrapped in try/catch) and mirrored to `<html lang>`.
- Strings in `[brackets]` are placeholders for copy Joel has not written yet, marked with a `// PLACEHOLDER` comment. Never invent brand copy; add a placeholder instead.
- Text that is the same in both languages (product names, the brand name) stays identical in both dictionaries or stays out of them. In the legacy site product names were never translated because they are lookup keys.
- No emojis anywhere: code, comments, docs or UI.

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
- Bands are sorted by document order. Drapes alternate: the first sags under its phrase, the second hangs above it, and so on.
- The engine reads positions on every rebuild: each band's document top and `offsetHeight`. The hero is used for visibility (render loop) only; the necklace is sized from the viewport and centred on it, exactly as in the legacy site, so the hero must be a full-viewport section with its title centred (the title block is nudged down by `translate: 0 6vh` because the ring's near side reads lower).

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

Already ported: design tokens, reset and base typography, fonts, the header (transparent over the hero, `.scrolled` after 60px, 1px scroll-progress hairline, ES/EN toggle), the footer, the reduced-motion contract, and the 3D chain with the hero/band window styles. Not yet ported from the home page: the intro splash, the hero entrance animations (letter-by-letter title), the photo-fallback parallax of the hero and band backgrounds, the band phrase reveal, pillars, collection, modal and articles. Changes from the legacy version: the language key is `insomnia-lang` (was `bw-lang`), the header and footer are styled by `.site-header` / `.site-footer` classes instead of element selectors, the brand links to `/`, and there is a skip link and visible focus outlines on the header controls.
