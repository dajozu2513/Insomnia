# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Website for **Insomnia by Joel Soto**, a brand that merges two lines by Joel Soto:

- **Black & White by Joel Soto**: handmade steel jewelry (9 pieces).
- **Obscure Human Feelings**: a T-shirt line where each garment carries one word for an emotion that language has not named yet, with its meaning (summary in `docs/brand/obscure-human-feelings-summary.docx`).

The site keeps the Black & White aesthetic (minimalism, black and white palette, a 3D steel chain behind the home page) but is rebuilt in React + TypeScript and deployed on Render as a static site. Repo: `github.com/dajozu2513/Insomnia`.

Current state: foundation only (tooling, design tokens, i18n, header/footer shell, a placeholder home page). The 3D chain, intro splash, collection grid, product modal, apparel and articles have not been ported yet.

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
  pages/                route-level components (HomePage and NotFoundPage are placeholders)
  features/             one folder per feature: chain, intro, collection, apparel, articles (empty for now)
  i18n/                 LanguageProvider, useI18n, es.ts, en.ts, types
  hooks/                shared hooks (usePrefersReducedMotion)
  data/                 typed product data (empty for now)
  styles/               tokens.css (design tokens), global.css (reset, base type, reduced-motion contract)
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

- Design tokens live on `:root` in `src/styles/tokens.css`: `--bg`, `--surface`, `--ink`, `--ink-mid`, `--ink-light`, `--border`, `--radius`, `--font-display` (Cormorant Garamond), `--font-body` (Montserrat), plus `--gutter` and `--header-height`. Use them instead of hard-coded colours; the only literal colours allowed are the white/black rgba overlays the legacy design already used.
- Fonts load from Google Fonts in `index.html` with the exact request the legacy site used (Cormorant Garamond 300/400/600 and italic 300; Montserrat 200/300/400/500). Add a weight there before using it.
- Image paths are lowercase (`/images/products/void.jpg`). Render's file serving is case-sensitive.

## Internationalization rules

- All user-facing copy is bilingual. Spanish is the default; English is the alternative.
- Copy lives only in `src/i18n/es.ts` and `src/i18n/en.ts`, never inline in components. Read it with `const { t } = useI18n()` and `t.section.key`.
- `es.ts` is the schema: `Dictionary` is `typeof es`, and `en.ts` is typed as `Dictionary`. A key missing in either file, or present in only one, is a compile error. **Always add every new key to both files.**
- The choice is saved in `localStorage['insomnia-lang']` (reads and writes are wrapped in try/catch) and mirrored to `<html lang>`.
- Strings in `[brackets]` are placeholders for copy Joel has not written yet, marked with a `// PLACEHOLDER` comment. Never invent brand copy; add a placeholder instead.
- Text that is the same in both languages (product names, the brand name) stays identical in both dictionaries or stays out of them. In the legacy site product names were never translated because they are lookup keys.
- No emojis anywhere: code, comments, docs or UI.

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

Already ported: design tokens, reset and base typography, fonts, the header (transparent over the hero, `.scrolled` after 60px, 1px scroll-progress hairline, ES/EN toggle), the footer, and the reduced-motion contract. Changes from the legacy version: the language key is `insomnia-lang` (was `bw-lang`), the header and footer are styled by `.site-header` / `.site-footer` classes instead of element selectors, the brand links to `/`, and there is a skip link and visible focus outlines on the header controls.
