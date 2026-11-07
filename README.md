# Insomnia by Joel Soto

Website for **Insomnia by Joel Soto**, a brand that brings together two lines by the same designer: **Black & White**, handmade steel jewelry, and **Obscure Human Feelings**, T-shirts that each carry a single word for an emotion that language has not named yet.

**Live site:** https://insomnia-js.onrender.com

The site continues the visual language of the earlier Black & White site (a black and white palette, editorial typography and a 3D steel chain that runs behind the home page) and adds a quiet dream layer on top: the page is one night, from dusk at the top to dawn at the bottom.

> Status: in progress. The 3D chain, intro, hero, pillars, the text-free bands and the analog scroll clock are built; the jewelry deck, the T-shirt line and the readings come next.

## Highlights

- **React 19 + TypeScript in strict mode**, built with Vite.
- **Typed bilingual content (ES/EN).** Spanish is the default. The Spanish dictionary defines the schema and the English one is checked against it, so a missing translation fails the build instead of shipping. The choice persists across visits and updates `<html lang>`.
- **Design tokens in plain CSS.** No UI or CSS framework; colours, fonts and spacing come from CSS custom properties ported from the original site.
- **Motion with restraint.** Every animation honours `prefers-reduced-motion`: movement is replaced by short fades and the 3D scene stops its render loop.
- **Accessible shell.** Semantic landmarks, a skip link, labelled controls and `aria-pressed` on the language toggle.
- **A 3D steel chain behind the page.** Three.js runs in an imperative engine outside React, loaded on demand in its own chunk; scrolling eases the camera and pulls the links along the chain without a single React re-render. Without WebGL the page falls back to photography.
- **A night atmosphere in 3D.** A procedural chessboard floor dissolves into the fog under the hero, faint dust drifts through every window, and the fog, exposure and rim light follow the night from dusk to dawn while the steel stays measurably neutral silver.
- **A night that follows the scroll.** A line-art pocket watch in the header turns from 6:00 PM at the top of the page to 6:00 AM at the bottom; its hands follow the scroll continuously, driven outside React.
- **One scroll frame.** Every scroll-driven effect (progress hairline, watch hands, photo parallax) shares a single requestAnimationFrame and writes to the DOM through refs.
- **A living style guide.** An internal `/lab` page renders the palette with live WCAG contrast measurements, the type scale, the pocket watch at several times, the line-art motifs, a flipping playing card and the atmosphere layers.
- **Three.js pinned to 0.183.0**, the version the original chain was tuned on, so the port matches it exactly.

## Tech stack

| Area      | Choice                                                   |
| --------- | -------------------------------------------------------- |
| Framework | React 19, react-router-dom 7                             |
| Language  | TypeScript 6 (strict)                                    |
| Build     | Vite 8                                                   |
| 3D        | Three.js 0.183.0                                         |
| Styling   | Plain CSS, custom properties                             |
| Fonts     | Cormorant Garamond, EB Garamond, Montserrat              |
| Quality   | ESLint (typescript-eslint strict type-checked), Prettier |
| Hosting   | Render static site (`render.yaml`)                       |

## Getting started

Requires Node 22.12 or newer (Node 24 recommended, see `.nvmrc`).

```bash
npm install
npm run dev
```

Then open http://localhost:5173.

| Script              | Purpose                                   |
| ------------------- | ----------------------------------------- |
| `npm run dev`       | Development server with hot reload        |
| `npm run build`     | Type-check and produce a build in `dist/` |
| `npm run preview`   | Serve the production build locally        |
| `npm run lint`      | Lint with ESLint                          |
| `npm run format`    | Format with Prettier                      |
| `npm run typecheck` | Type-check only                           |

## Project structure

```
src/
  app/                 App and router
  components/layout/   Header, Footer, language toggle, page layout
  pages/               Route-level pages
  features/            Feature modules (chain, home, intro, night clock, motifs, cards)
  i18n/                Language provider, hook and ES/EN dictionaries
  hooks/               Shared hooks (reduced motion, in-view reveals)
  lib/                 Shared scroll frame
  data/                Typed product data
  styles/              Design tokens and global styles
public/images/         Product and background photography
docs/brand/            Brand documents
```

## Deployment

The site is live at https://insomnia-js.onrender.com, served by a Render static site that builds the `main` branch with `npm ci && npm run build`, publishes `dist/`, and rewrites every path to `index.html` so client-side routes work on refresh. The service is configured in the Render dashboard; `render.yaml` documents that configuration and Node 24 comes from `.nvmrc`.

## Author

Designed and developed by **Joel Soto**, Costa Rica.
