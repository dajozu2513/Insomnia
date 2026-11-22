import { createElement } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';

import { TEES, type TeeColour } from '../../data/tees';
import type { Lang } from '../../i18n';
import type { RackTee, TeeAtlas } from '../chain/types';
import { TeeMockup } from '../tees/TeeMockup';
import { TEE_FRAME } from '../tees/teeGeometry';

/*
 * The rack's prints (step 14): the step 6 mockups exactly as the dialog draws
 * them (front view, the word and its meaning, the meaning in the site
 * language), rendered once into one SVG and rasterised to a canvas for the 3D
 * tees. An SVG drawn as an image cannot use the page's fonts or styles, so the
 * mockup and print rules (tees.css) and the four faces the prints use are
 * embedded in it, the fonts as data URLs.
 */

/** Black and white alternate around the ring, for rhythm. */
export function rackColour(index: number): TeeColour {
  return index % 2 === 0 ? 'black' : 'white';
}

const COLUMNS = 5;
const ROWS = 2;

/** The faces the prints use (latin subset: it covers É and the Spanish accents). */
const FACES = [
  { family: 'Cormorant Garamond', weight: '400', style: 'normal' },
  { family: 'Cormorant Garamond', weight: '600', style: 'normal' },
  { family: 'Cormorant Garamond', weight: '300', style: 'italic' },
  { family: 'EB Garamond', weight: '400', style: 'normal' },
] as const;

/** The tokens the mockup and print rules read. */
const TOKENS = [
  '--ink',
  '--bone',
  '--tee-white',
  '--ink-rgb',
  '--text-on-dark-rgb',
  '--font-display',
  '--font-body',
];

function styleRules(): CSSRule[] {
  const rules: CSSRule[] = [];
  for (const sheet of Array.from(document.styleSheets)) {
    try {
      rules.push(...Array.from(sheet.cssRules));
    } catch {
      // A stylesheet from another origin: not ours
    }
  }
  return rules;
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = () => {
      reject(new Error('Could not read a font file'));
    };
    reader.readAsDataURL(blob);
  });
}

let embeddedFonts: Promise<string> | null = null;

/** @font-face rules for FACES with the font files inlined (fetched once per visit). */
function fontFaces(): Promise<string> {
  embeddedFonts ??= Promise.all(
    FACES.map(async (face) => {
      const rule = styleRules().find((r): r is CSSFontFaceRule => {
        if (!(r instanceof CSSFontFaceRule)) return false;
        const s = r.style;
        return (
          s.getPropertyValue('font-family').replace(/["']/g, '').trim() === face.family &&
          s.getPropertyValue('font-weight').trim() === face.weight &&
          s.getPropertyValue('font-style').trim() === face.style &&
          // The latin subset (its files are named ...-latin-<weight>-..., not latin-ext)
          /-latin-\d/.test(s.getPropertyValue('src'))
        );
      });
      const src = rule?.style.getPropertyValue('src') ?? '';
      const url = /url\(["']?([^"')]+)["']?\)/.exec(src)?.[1];
      if (!rule || !url) return '';
      const base = rule.parentStyleSheet?.href ?? window.location.href;
      const response = await fetch(new URL(url, base));
      const data = await blobToDataUrl(await response.blob());
      return `@font-face{font-family:'${face.family}';font-weight:${face.weight};font-style:${face.style};src:url(${data}) format('woff2');}`;
    }),
  ).then((faces) => faces.join(''));
  return embeddedFonts;
}

/** The mockup and print rules from tees.css, with the tokens they read. */
function teeStyles(): string {
  const root = getComputedStyle(document.documentElement);
  const tokens = TOKENS.map((name) => `${name}:${root.getPropertyValue(name).trim()};`).join('');
  const rules = styleRules()
    .filter((r): r is CSSStyleRule => r instanceof CSSStyleRule)
    .filter((r) => /(^|[\s,])\.(tee|print)[\w-]*/.test(r.selectorText))
    .map((r) => r.cssText)
    .join('');
  return `:root{${tokens}}${rules}`;
}

/** One mockup as SVG markup, placed in its atlas cell. */
function mockupMarkup(index: number, lang: Lang): string {
  const tee = TEES[index];
  if (!tee) return '';
  const host = document.createElement('div');
  const root = createRoot(host);
  flushSync(() => {
    root.render(
      createElement(TeeMockup, {
        tee,
        colour: rackColour(index),
        lang,
        side: 'front',
        placement: 'front',
      }),
    );
  });
  const markup = host.innerHTML;
  root.unmount();
  const x = (index % COLUMNS) * TEE_FRAME.width;
  const y = Math.floor(index / COLUMNS) * TEE_FRAME.height;
  return markup.replace(
    '<svg ',
    `<svg x="${String(x)}" y="${String(y)}" width="${String(TEE_FRAME.width)}" height="${String(TEE_FRAME.height)}" `,
  );
}

const nextFrame = () =>
  new Promise<void>((resolve) => {
    requestAnimationFrame(() => {
      resolve();
    });
  });

/**
 * The ten tees in one canvas, 5 x 2 cells (each the whole 300 x 330 mockup).
 * `cell` is a cell's width in pixels (smaller on small screens).
 */
export async function renderTeeAtlas(lang: Lang, cell: number): Promise<TeeAtlas> {
  const width = COLUMNS * TEE_FRAME.width;
  const height = ROWS * TEE_FRAME.height;
  const style = `${await fontFaces()}${teeStyles()}`;
  const cells = TEES.map((_, i) => mockupMarkup(i, lang)).join('');
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${String(width)}" height="${String(height)}" viewBox="0 0 ${String(width)} ${String(height)}"><style>${style}</style>${cells}</svg>`;

  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  try {
    const image = new Image();
    image.src = url;
    await image.decode();
    // Give the embedded fonts a frame to settle before drawing
    await nextFrame();
    await nextFrame();
    const canvas = document.createElement('canvas');
    canvas.width = COLUMNS * cell;
    canvas.height = Math.round(ROWS * cell * (TEE_FRAME.height / TEE_FRAME.width));
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('2D canvas unavailable');
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const tees: RackTee[] = TEES.map((tee, i) => ({
      id: tee.id,
      word: tee.word,
      colour: rackColour(i),
      u: (i % COLUMNS) / COLUMNS,
      v: 1 - (Math.floor(i / COLUMNS) + 1) / ROWS,
      w: 1 / COLUMNS,
      h: 1 / ROWS,
    }));
    return { canvas, tees };
  } finally {
    URL.revokeObjectURL(url);
  }
}
