/*
 * Font metrics for laying out the prints without measuring the DOM: advance
 * widths in em, measured in the browser (canvas measureText) from the fonts the
 * site loads. Every print is laid out letter by letter from these, so the
 * layout is deterministic and identical on the server, in /lab and on the tee.
 */

/** Cormorant Garamond 400, capitals (the printed word). */
const CAPS: Record<string, number> = {
  A: 0.702,
  B: 0.558,
  C: 0.686,
  D: 0.691,
  E: 0.537,
  F: 0.509,
  G: 0.713,
  H: 0.759,
  I: 0.332,
  J: 0.322,
  K: 0.65,
  L: 0.533,
  M: 0.835,
  N: 0.727,
  O: 0.766,
  P: 0.543,
  Q: 0.766,
  R: 0.673,
  S: 0.491,
  T: 0.634,
  U: 0.698,
  V: 0.666,
  W: 0.931,
  X: 0.652,
  Y: 0.609,
  Z: 0.595,
  É: 0.537,
  ' ': 0.234,
};

/** EB Garamond 400 (the printed meaning). */
const BODY: Record<string, number> = {
  a: 0.399,
  b: 0.515,
  c: 0.407,
  d: 0.506,
  e: 0.39,
  f: 0.318,
  g: 0.435,
  h: 0.515,
  i: 0.245,
  j: 0.226,
  k: 0.469,
  l: 0.24,
  m: 0.778,
  n: 0.528,
  o: 0.495,
  p: 0.519,
  q: 0.522,
  r: 0.334,
  s: 0.323,
  t: 0.314,
  u: 0.527,
  v: 0.438,
  w: 0.685,
  x: 0.43,
  y: 0.438,
  z: 0.377,
  ' ': 0.2,
  ',': 0.23,
  '.': 0.23,
};

/** Cap height of Cormorant Garamond, in em. */
export const CAP_HEIGHT = 0.63;

export function capAdvance(letter: string): number {
  return CAPS[letter] ?? 0.66;
}

function bodyAdvance(char: string): number {
  const plain = char.normalize('NFD').charAt(0);
  return BODY[char] ?? BODY[plain] ?? BODY[plain.toLowerCase()] ?? 0.62;
}

/** Width of a line of the meaning at `size`. */
export function bodyWidth(text: string, size: number): number {
  let em = 0;
  for (const char of text) em += bodyAdvance(char);
  return em * size;
}

/**
 * Breaks the meaning into centred lines no wider than `maxWidth`, balanced: as
 * few lines as the greedy break needs, but as even as possible, so no line ends
 * with a lone word.
 */
export function wrapLines(text: string, size: number, maxWidth: number): string[] {
  const count = greedyLines(text, size, maxWidth).length;
  let low = 0;
  let high = maxWidth;
  while (high - low > 0.5) {
    const mid = (low + high) / 2;
    if (greedyLines(text, size, mid).length > count) low = mid;
    else high = mid;
  }
  return greedyLines(text, size, high);
}

function greedyLines(text: string, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && bodyWidth(next, size) > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

/** The word as printed: capitals, one entry per letter (É stays one letter). */
export function letters(word: string): string[] {
  return Array.from(word.normalize('NFC').toLocaleUpperCase('es'));
}

/** Width in em of the letters plus `tracking` em between each pair. */
export function capsEm(chars: readonly string[], tracking: number): number {
  return chars.reduce((sum, c) => sum + capAdvance(c), 0) + tracking * (chars.length - 1);
}

/** The largest size (up to `max`) at which the letters fit in `width`. */
export function fitSize(
  chars: readonly string[],
  width: number,
  tracking: number,
  max: number,
): number {
  return Math.min(max, width / capsEm(chars, tracking));
}

/**
 * Left x of each letter for a word centred on `cx`, with `gaps[i]` em after
 * letter i (or a constant tracking). Returns the positions and the full width.
 */
export function layoutLetters(
  chars: readonly string[],
  size: number,
  cx: number,
  gaps: number | readonly number[],
): { xs: number[]; width: number } {
  const gapAt = (i: number) => (typeof gaps === 'number' ? gaps : (gaps[i] ?? 0));
  const advances = chars.map(
    (c, i) => (capAdvance(c) + (i < chars.length - 1 ? gapAt(i) : 0)) * size,
  );
  const width = advances.reduce((a, b) => a + b, 0);
  const xs: number[] = [];
  let x = cx - width / 2;
  for (const advance of advances) {
    xs.push(x);
    x += advance;
  }
  return { xs, width };
}

/** Deterministic pseudo-random numbers in [0, 1) (mulberry32), so prints never change. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A coordinate for an SVG attribute, rounded to 2 decimals: shorter output, stable. */
export function r2(value: number): string {
  return String(Math.round(value * 100) / 100);
}
