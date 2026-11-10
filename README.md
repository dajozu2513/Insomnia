# Insomnia by Joel Soto

Website for **Insomnia by Joel Soto**, a brand that brings together two lines by the same designer: **Black & White**, handmade steel jewelry, and **Obscure Human Feelings**, T-shirts that each carry a single word for an emotion that language has not named yet.

**Live site:** https://insomnia-js.onrender.com

The site continues the visual language of the earlier Black & White site (a black and white palette, editorial typography and a 3D steel chain that runs behind the home page) and adds a quiet dream layer on top: the page is one night, from dusk at the top to dawn at the bottom.

> Status: in progress. The entrance and the fall (a first-person 3D descent into a hole in the earth), the 3D chain and its night atmosphere, the intro, hero, pillars, three text-free bands, the analog scroll clock, the jewelry deck and the printed T-shirts (each with its configurator), the Readings index and the three article pages are built.

## Highlights

- **React 19 + TypeScript in strict mode**, built with Vite.
- **Typed bilingual content (ES/EN).** Spanish is the default. The Spanish dictionary defines the schema and the English one is checked against it, so a missing translation fails the build instead of shipping. The choice persists across visits and updates `<html lang>`.
- **Design tokens in plain CSS.** No UI or CSS framework; colours, fonts and spacing come from CSS custom properties ported from the original site.
- **Motion with restraint.** Every animation honours `prefers-reduced-motion`: movement is replaced by short fades and the 3D scene stops its render loop.
- **Accessible shell.** Semantic landmarks, a skip link, labelled controls and `aria-pressed` on the language toggle.
- **A first-person fall.** The hero is a tall, scroll-driven 3D sequence: the visitor stands at the edge of a hole framed by old roots, with a small steel pocket watch lying on one of them, steps over the rim and falls down a shaft of earth and rock that widens into mist for the rest of the page. Walls, roots, stones and bark are procedural (layered noise in shaders, recycled wall segments, instanced roots and stones), with no image textures.
- **A 3D steel chain in the first window.** Three.js runs in an imperative engine outside React, loaded on demand in its own chunk; scrolling eases the camera and pulls the links along the chain without a single React re-render. Without WebGL the page shows stills rendered from the scene itself.
- **A night atmosphere in 3D.** Glowing motes drift through the hole and every window and streak while falling fast, a rose light rises from far below, and the fog, exposure and rim light follow the night from dusk to dawn while the steel stays measurably neutral silver.
- **A night that follows the scroll.** A line-art pocket watch, the emblem beside the name in the header, turns from 6:00 PM at the top of the page to 6:00 AM at the bottom; its hands follow the scroll continuously, driven outside React. The intro opens on the full name over a slow red mist.
- **One scroll frame.** Every scroll-driven effect (progress hairline, watch hands, photo parallax) shares a single requestAnimationFrame and writes to the DOM through refs.
- **A jewelry deck instead of a product grid.** The nine chain links are drawn in code as playing cards that deal themselves face up; choosing one opens an accessible dialog (FLIP animation, focus management, deep links) with a configurator that composes the WhatsApp inquiry live.
- **Readings with a title morph.** An editorial index of three articles on the home page; each opens on its own page, its title morphing into the heading through same-document View Transitions, with a reading-progress hairline and a pocket watch that follow the text from 6:00 PM to 6:00 AM.
- **T-shirt prints generated in code.** Ten typographic compositions, one per word (a crowd of strangers, a frame too tight, a letter out of place, a plot that knots), laid out from measured font metrics and kept print-safe (one colour, flat tints, no gradients). They render on a flat SVG tee that follows every configurator choice live: colour, print language, placement and the side shown.
- **A living style guide.** An internal `/lab` page renders the palette with live WCAG contrast measurements, the type scale, the pocket watch at several times, the line-art motifs, the nine links, all ten T-shirt prints on both colours and in both languages, a flipping playing card and the atmosphere layers.
- **Ready to share and fast to load.** Per-route titles, descriptions, canonical links, Open Graph and Twitter cards, JSON-LD, a sitemap, a share image rendered from the intro itself, a pocket-watch favicon that follows light and dark themes, self-hosted fonts with metric-matched fallbacks, a still of the scene as the first paint (AVIF, about 20 kB) that crossfades into the live 3D scene, and error boundaries so one failing part never blanks the page.
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
  components/          Error boundary; layout/: Header, Footer, language toggle, page layout
  pages/               Route-level pages (home, article, 404, /lab, /brand-assets)
  features/            Feature modules (chain, home, intro, night clock, motifs, cards, jewelry deck, T-shirts, shared product dialog)
  i18n/                Language provider, hook and ES/EN dictionaries
  hooks/               Shared hooks (reduced motion, in-view reveals, head tags)
  lib/                 Shared scroll frame, head tags
  data/                Typed data: the nine links, forms and sizes; the ten T-shirt designs and options; the three articles
  assets/fonts/        Self-hosted fonts (woff2) and their licences
  styles/              Fonts, design tokens and global styles
public/                Share image, favicons and icons, manifest, robots.txt, sitemap.xml
public/images/fall/    Stills rendered from the 3D scene: the edge (first paint, no-WebGL hero) and the shaft (no-WebGL bands), wide and tall, as AVIF, WebP and JPEG
docs/brand/            Brand documents
docs/content/          Approved copy (articles.md, the source of src/data/articles.ts)
```

## Deployment

The site is live at https://insomnia-js.onrender.com, served by a Render static site that builds the `main` branch with `npm ci && npm run build`, publishes `dist/`, and rewrites every path to `index.html` so client-side routes work on refresh. The service is configured in the Render dashboard; `render.yaml` documents that configuration and Node 24 comes from `.nvmrc`.

## Share image and icons

The share image and the icons are rendered by the site itself, from the hidden route `/brand-assets` (not linked, noindex), and captured with a headless Chromium browser against the production build (`npm run build && npm run preview`):

```bash
msedge --headless=new --hide-scrollbars --force-device-scale-factor=1 --window-size=1200,630 --virtual-time-budget=6000 --screenshot=og.png http://localhost:4173/brand-assets/og
```

The icons use `/brand-assets/icon?stroke=<line width in drawing units>` at `--window-size=512,512` (0.75 for the 512 icon, 0.95 for 192 and the 180 Apple touch icon, 2.4 and 3.2 for the 32 and 16 favicon), downscaled from 512 (headless browsers will not size a window below about 500 px). `og.png` is stored as a palette PNG to keep it small. `favicon.svg` is drawn by hand from the watch and switches between ink and bone with the browser theme.

## Stills of the fall

The hero's first paint and the no-WebGL fallback are stills rendered from the 3D scene itself (`public/images/fall/`): `edge-wide` and `edge-tall` (shot 1 at the edge of the hole), `shaft-wide` and `shaft-tall` (the misty shaft, for the bands). They are captured from the dev server with a headless Chromium browser on a real GPU, at `?fall=0` and `?fall=1`, with every DOM element hidden except the canvas, then encoded as AVIF, WebP and JPEG:

- wide: a 1920 x 800 viewport at device scale 1.25 (the edge) or 1 (the shaft), clipped to the canvas. Every screen wider than 1.3:1 uses the same vertical field of view, so the still lines up with the live frame exactly.
- tall: a 540 x 900 viewport at device scale 2 (the edge) or 1.5 (the shaft). Phones are slightly narrower, so their field of view differs by a few percent; the 2-second crossfade hides it.

Re-render them after changing anything in shot 1 or the shaft's look (the scene, the camera, the atmosphere constants).

## Headers on Render

Add these in the Render dashboard (the service's Settings, Headers), not in the repo. Hashed files under `/assets/` never change, everything else may:

| Path        | Header                      | Value                                      |
| ----------- | --------------------------- | ------------------------------------------ |
| `/*`        | `Cache-Control`             | `public, max-age=0, must-revalidate`       |
| `/assets/*` | `Cache-Control`             | `public, max-age=31536000, immutable`      |
| `/images/*` | `Cache-Control`             | `public, max-age=604800`                   |
| `/*`        | `X-Content-Type-Options`    | `nosniff`                                  |
| `/*`        | `Referrer-Policy`           | `strict-origin-when-cross-origin`          |
| `/*`        | `X-Frame-Options`           | `DENY`                                     |
| `/*`        | `Permissions-Policy`        | `camera=(), microphone=(), geolocation=()` |
| `/*`        | `Strict-Transport-Security` | `max-age=31536000`                         |

After saving, check a response (`curl -I https://insomnia-js.onrender.com/assets/<any file>`): the hashed files must come back with the one-year cache. If Render applies the `/*` cache rule to them too, replace that rule with `/index.html` and `/lecturas/*`. A Content-Security-Policy is left out for now: `index.html` has inline scripts (the 3D check and the JSON-LD) that would need hashes kept in sync.

## Launch checklist

- [ ] Add the headers above in the Render dashboard and confirm them with `curl -I`.
- [ ] Check that `/robots.txt`, `/sitemap.xml`, `/og.png`, `/favicon.ico` and `/site.webmanifest` are served as files, not as the app's index page (Render serves existing files before the rewrite).
- [ ] Paste the live URL and an article URL into the Facebook Sharing Debugger, the LinkedIn Post Inspector and a WhatsApp chat to see the preview; re-scrape if an old preview is cached.
- [ ] Add the site to Google Search Console, submit `https://insomnia-js.onrender.com/sitemap.xml` and inspect the home page and one article.
- [ ] Run Lighthouse on the live site (mobile and desktop, home and one article).
- [ ] Test on a real iPhone (Safari) and Android phone (Chrome): the entrance and the fall (slow and fast scrolling), the 3D chain, the intro, both dialogs and WhatsApp links, an article and its title morph, the language toggle, and the tab in the background and back.
- [ ] Test in Firefox (not covered by the automated checks).
- [ ] Remaining placeholders: none in the site copy; see the step 9 report for internal ones.

## Author

Designed and developed by **Joel Soto**, Costa Rica.
