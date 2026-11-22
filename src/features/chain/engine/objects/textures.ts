import { CanvasTexture, DataTexture, LinearFilter, RedFormat, SRGBColorSpace } from 'three';

import type { FallCard } from '../../types';

/*
 * Every texture of the objects of the fall is drawn here, in code, on canvases:
 * no image files. Colours are the site's tokens (docs/brand/design-direction.md).
 */

const INK = '#141215';
const INK_RAISED = '#1d1a20';
const BONE_RAISED = '#efe9dd';
const BONE_DEEP = '#d6cdbb';
const DISPLAY = "'Cormorant Garamond', Georgia, serif";
const UI = "'Montserrat', Arial, sans-serif";

function canvas2d(
  width: number,
  height: number,
): {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
} {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');
  return { canvas, ctx };
}

function colourTexture(canvas: HTMLCanvasElement): CanvasTexture {
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** Waits for the faces the canvases draw with (they may not be in use on the page yet). */
export function loadFaces(text: string): Promise<unknown> {
  return Promise.all([
    document.fonts.load(`400 76px ${DISPLAY}`, text),
    document.fonts.load(`600 40px ${DISPLAY}`, text),
    document.fonts.load(`500 30px ${UI}`, text),
  ]).catch(() => undefined);
}

// ── THE BOTTLE'S TAG ─────────────────────────────────────────────────────────

export interface LabelTexture {
  texture: CanvasTexture;
  /** Redraws the tag in place (same texture, so nothing leaks on a language change). */
  draw: (text: string) => void;
}

/** A small paper tag in the site language ("BÉBEME" / "DRINK ME"), Cormorant capitals. */
export function createLabelTexture(): LabelTexture {
  const { canvas, ctx } = canvas2d(512, 256);
  const texture = colourTexture(canvas);
  const draw = (text: string): void => {
    ctx.fillStyle = '#e6dcc6';
    ctx.fillRect(0, 0, 512, 256);
    // Paper grain and a thin printed border
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = `rgba(80, 60, 40, ${(0.02 + Math.random() * 0.04).toFixed(3)})`;
      ctx.fillRect(Math.random() * 512, Math.random() * 256, 1.5, 1.5);
    }
    ctx.strokeStyle = 'rgba(20, 18, 21, 0.55)';
    ctx.lineWidth = 3;
    ctx.strokeRect(22, 22, 468, 212);
    // The punched hole the string goes through
    ctx.fillStyle = 'rgba(20, 18, 21, 0.75)';
    ctx.beginPath();
    ctx.arc(52, 128, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let size = 96;
    ctx.font = `600 ${String(size)}px ${DISPLAY}`;
    const width = ctx.measureText(text).width;
    if (width > 360) {
      size = Math.floor((size * 360) / width);
      ctx.font = `600 ${String(size)}px ${DISPLAY}`;
    }
    ctx.fillText(text, 280, 134);
    texture.needsUpdate = true;
  };
  return { texture, draw };
}

// ── THE CAKE'S CURRANTS ──────────────────────────────────────────────────────

/**
 * Where the currants go to spell `text` on top of the cake: the text is set
 * small on a canvas and every inked cell of a coarse grid becomes a currant.
 * Points are in -1..1 (x) and about -0.25..0.25 (y), centred.
 */
export function currantPoints(text: string): [number, number][] {
  const width = 220;
  const height = 48;
  const { ctx } = canvas2d(width, height);
  ctx.fillStyle = '#000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `500 34px ${UI}`;
  const measured = ctx.measureText(text).width;
  const size = Math.min(34, Math.floor((34 * (width - 12)) / Math.max(measured, 1)));
  ctx.font = `500 ${String(size)}px ${UI}`;
  ctx.fillText(text, width / 2, height / 2 + 1);
  const { data } = ctx.getImageData(0, 0, width, height);
  const step = 3;
  const points: [number, number][] = [];
  for (let y = step / 2; y < height; y += step) {
    for (let x = step / 2; x < width; x += step) {
      const alpha = data[(Math.floor(y) * width + Math.floor(x)) * 4 + 3] ?? 0;
      if (alpha > 110) points.push([(x / width) * 2 - 1, ((height / 2 - y) / width) * 2]);
    }
  }
  return points;
}

// ── PAGES ────────────────────────────────────────────────────────────────────

/** A page with faint, unreadable lines of text: rows of short grey dashes. */
export function createPageTexture(): CanvasTexture {
  const w = 256;
  const h = 340;
  const { canvas, ctx } = canvas2d(w, h);
  ctx.fillStyle = '#ece5d6';
  ctx.fillRect(0, 0, w, h);
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  ctx.fillStyle = 'rgba(20, 18, 21, 0.2)';
  for (let row = 0; row < 22; row++) {
    const y = 34 + row * 12.5;
    let x = 26;
    const end = row % 7 === 6 ? 26 + random() * 120 : w - 26;
    while (x < end) {
      const word = 8 + random() * 26;
      ctx.fillRect(x, y, Math.min(word, end - x), 3);
      x += word + 5;
    }
  }
  return colourTexture(canvas);
}

// ── THE DECK ─────────────────────────────────────────────────────────────────

/** Card cells in the atlas: 9 faces (in LINKS order) and the back, last. */
export const CARD_COLUMNS = 5;
export const CARD_ROWS = 2;
const CARD_W = 256;
const CARD_H = 358;

async function svgImage(svg: string, size: number): Promise<HTMLImageElement> {
  const markup = svg
    .replace(/<svg\b/, `<svg xmlns="http://www.w3.org/2000/svg" color="${INK}"`)
    .replace(/\swidth="[^"]*"/, ` width="${String(size)}"`)
    .replace(/\sheight="[^"]*"/, ` height="${String(size)}"`)
    .replace(/stroke-width="[^"]*"/, 'stroke-width="1.1"');
  const image = new Image(size, size);
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`;
  await image.decode();
  return image;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

/**
 * Our deck as an atlas (step 5's cards): each face on raised bone paper with a
 * thin frame, the link drawn in line art, its name in Cormorant small capitals
 * and the rank in two corners with a tiny link as the suit mark; the back on
 * ink, a steel chessboard inside a thin steel frame. Nothing is red.
 */
export async function createCardAtlas(cards: readonly FallCard[]): Promise<CanvasTexture> {
  const { canvas, ctx } = canvas2d(CARD_W * CARD_COLUMNS, CARD_H * CARD_ROWS);
  const cell = (i: number) => ({
    x: (i % CARD_COLUMNS) * CARD_W,
    y: Math.floor(i / CARD_COLUMNS) * CARD_H,
  });

  const images = await Promise.all(
    cards.map(async (card) => ({
      art: await svgImage(card.svg, 150),
      suit: await svgImage(card.svg, 30),
    })),
  );

  cards.slice(0, CARD_COLUMNS * CARD_ROWS - 1).forEach((card, i) => {
    const { x, y } = cell(i);
    const image = images[i];
    ctx.save();
    ctx.translate(x, y);
    roundRect(ctx, 2, 2, CARD_W - 4, CARD_H - 4, 16);
    ctx.fillStyle = BONE_RAISED;
    ctx.fill();
    roundRect(ctx, 14, 14, CARD_W - 28, CARD_H - 28, 10);
    ctx.strokeStyle = BONE_DEEP;
    ctx.lineWidth = 2;
    ctx.stroke();
    if (image) ctx.drawImage(image.art, (CARD_W - 150) / 2, 92, 150, 150);
    ctx.fillStyle = INK;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'alphabetic';
    ctx.font = `600 26px ${DISPLAY}`;
    ctx.letterSpacing = '6px';
    ctx.fillText(card.name.toUpperCase(), CARD_W / 2 + 3, 296);
    ctx.letterSpacing = '0px';
    // Rank and suit mark in two corners, the bottom one turned half a turn
    for (const turn of [0, Math.PI]) {
      ctx.save();
      ctx.translate(CARD_W / 2, CARD_H / 2);
      ctx.rotate(turn);
      ctx.translate(-CARD_W / 2, -CARD_H / 2);
      ctx.font = `600 34px ${DISPLAY}`;
      ctx.fillText(card.rank, 42, 64);
      if (image) ctx.drawImage(image.suit, 27, 72, 30, 30);
      ctx.restore();
    }
    ctx.restore();
  });

  // The back, in the last cell
  const { x, y } = cell(CARD_COLUMNS * CARD_ROWS - 1);
  ctx.save();
  ctx.translate(x, y);
  roundRect(ctx, 2, 2, CARD_W - 4, CARD_H - 4, 16);
  ctx.fillStyle = INK_RAISED;
  ctx.fill();
  ctx.save();
  roundRect(ctx, 30, 44, CARD_W - 60, CARD_H - 88, 4);
  ctx.clip();
  ctx.fillStyle = 'rgba(184, 187, 193, 0.16)';
  const square = 16;
  for (let row = 0; row * square < CARD_H; row++) {
    for (let col = 0; col * square < CARD_W; col++) {
      if ((row + col) % 2 === 0) ctx.fillRect(30 + col * square, 44 + row * square, square, square);
    }
  }
  ctx.restore();
  roundRect(ctx, 16, 16, CARD_W - 32, CARD_H - 32, 12);
  ctx.strokeStyle = 'rgba(184, 187, 193, 0.55)';
  ctx.lineWidth = 2;
  ctx.stroke();
  roundRect(ctx, 10, 10, CARD_W - 20, CARD_H - 20, 14);
  ctx.strokeStyle = 'rgba(184, 187, 193, 0.22)';
  ctx.stroke();
  ctx.restore();

  return colourTexture(canvas);
}

// ── LETTERS (SDF) ────────────────────────────────────────────────────────────

export interface GlyphCell {
  /** uv rectangle in the atlas: left, bottom, width, height. */
  u: number;
  v: number;
  w: number;
  h: number;
  /** Advance width over the cell's size (for setting words). */
  advance: number;
}

export interface SdfAtlas {
  texture: DataTexture;
  glyphs: Map<string, GlyphCell>;
}

const SDF_CELL = 128;
const SDF_FONT = 100;
const SDF_SPREAD = 12;
const INF = 1e20;

/** Squared distance transform in one dimension (Felzenszwalb and Huttenlocher). */
function edt1d(f: Float64Array, n: number, d: Float64Array, v: Int32Array, z: Float64Array): void {
  let k = 0;
  v[0] = 0;
  z[0] = -INF;
  z[1] = INF;
  const at = (i: number) => f[i] ?? INF;
  for (let q = 1; q < n; q++) {
    let vk = v[k] ?? 0;
    let s = (at(q) + q * q - (at(vk) + vk * vk)) / (2 * q - 2 * vk);
    while (s <= (z[k] ?? -INF)) {
      k--;
      vk = v[k] ?? 0;
      s = (at(q) + q * q - (at(vk) + vk * vk)) / (2 * q - 2 * vk);
    }
    k++;
    v[k] = q;
    z[k] = s;
    z[k + 1] = INF;
  }
  k = 0;
  for (let q = 0; q < n; q++) {
    while ((z[k + 1] ?? INF) < q) k++;
    const vk = v[k] ?? 0;
    d[q] = (q - vk) * (q - vk) + at(vk);
  }
}

/** Squared distance from every pixel to the nearest pixel where `grid` is 0. */
function edt2d(grid: Float64Array, size: number): void {
  const f = new Float64Array(size);
  const d = new Float64Array(size);
  const v = new Int32Array(size);
  const z = new Float64Array(size + 1);
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) f[y] = grid[y * size + x] ?? INF;
    edt1d(f, size, d, v, z);
    for (let y = 0; y < size; y++) grid[y * size + x] = d[y] ?? INF;
  }
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) f[x] = grid[y * size + x] ?? INF;
    edt1d(f, size, d, v, z);
    for (let x = 0; x < size; x++) grid[y * size + x] = d[x] ?? INF;
  }
}

/**
 * Signed distance fields of Cormorant Garamond capitals, built at runtime from
 * the site's own font (drawn on a canvas, then a two-pass Euclidean distance
 * transform seeded from its antialiased coverage), so the letters stay crisp at any size with a cheap shader.
 * One channel: 0.5 on the outline, more inside.
 */
export function createSdfAtlas(chars: readonly string[]): SdfAtlas {
  const columns = 8;
  const rows = Math.ceil(chars.length / columns);
  const width = columns * SDF_CELL;
  const height = rows * SDF_CELL;
  const data = new Uint8Array(width * height);
  const glyphs = new Map<string, GlyphCell>();
  const { ctx } = canvas2d(SDF_CELL, SDF_CELL);
  ctx.font = `400 ${String(SDF_FONT)}px ${DISPLAY}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const inside = new Float64Array(SDF_CELL * SDF_CELL);
  const outside = new Float64Array(SDF_CELL * SDF_CELL);

  chars.forEach((char, index) => {
    ctx.clearRect(0, 0, SDF_CELL, SDF_CELL);
    ctx.fillStyle = '#000';
    // Capitals centred in the cell, with room for an accent (É) above them
    ctx.fillText(char, SDF_CELL / 2, SDF_CELL * 0.72);
    const alpha = ctx.getImageData(0, 0, SDF_CELL, SDF_CELL).data;
    // Seeded from the antialiased coverage (as TinySDF does), so the outline
    // falls between pixels instead of following them in steps
    for (let i = 0; i < SDF_CELL * SDF_CELL; i++) {
      const a = (alpha[i * 4 + 3] ?? 0) / 255;
      if (a >= 1) {
        outside[i] = 0;
        inside[i] = INF;
      } else if (a <= 0) {
        outside[i] = INF;
        inside[i] = 0;
      } else {
        outside[i] = Math.max(0, 0.5 - a) ** 2;
        inside[i] = Math.max(0, a - 0.5) ** 2;
      }
    }
    edt2d(outside, SDF_CELL);
    edt2d(inside, SDF_CELL);
    const cx = (index % columns) * SDF_CELL;
    const cy = Math.floor(index / columns) * SDF_CELL;
    for (let y = 0; y < SDF_CELL; y++) {
      for (let x = 0; x < SDF_CELL; x++) {
        const i = y * SDF_CELL + x;
        const signed = Math.sqrt(outside[i] ?? 0) - Math.sqrt(inside[i] ?? 0);
        const value = Math.min(Math.max(0.5 - signed / (2 * SDF_SPREAD), 0), 1);
        // DataTexture rows run bottom to top
        data[(height - 1 - (cy + y)) * width + cx + x] = Math.round(value * 255);
      }
    }
    glyphs.set(char, {
      u: cx / width,
      v: (height - cy - SDF_CELL) / height,
      w: SDF_CELL / width,
      h: SDF_CELL / height,
      advance: ctx.measureText(char).width / SDF_CELL,
    });
  });

  const texture = new DataTexture(data, width, height, RedFormat);
  texture.minFilter = LinearFilter;
  texture.magFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return { texture, glyphs };
}
