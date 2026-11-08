import { PrintFrame, type CompositionProps, type Region } from './PrintFrame';
import { CAP_HEIGHT, capAdvance, fitSize, layoutLetters, letters, r2, seeded } from './metrics';

/*
 * The ten prints, one per word (docs/brand/design-direction.md, "Products").
 * Each draws its word inside the region PrintFrame gives it: "full" (the word
 * above its meaning) or "word" (the word alone, large, for the front of a
 * front-and-back print). Print-safe by construction: one colour, flat tints
 * only (never below 0.2), strokes of 0.9 print units or more, no gradients.
 * The word is set in Cormorant Garamond capitals, letter by letter, from the
 * measured metrics, so every layout is deterministic.
 */

const STROKE = 1.1;

interface LettersProps {
  chars: readonly string[];
  xs: readonly number[];
  y: number;
  size: number;
  opacity?: number | undefined;
}

/** One line of capitals, each letter at its own x. */
function Letters({ chars, xs, y, size, opacity }: LettersProps) {
  return (
    <text
      className="print-word"
      x={xs.map(r2).join(' ')}
      y={r2(y)}
      fontSize={r2(size)}
      fillOpacity={opacity}
    >
      {chars.join('')}
    </text>
  );
}

/** Baseline that centres a single line of capitals on the region. */
function centredBaseline(region: Region, size: number): number {
  return region.cy + (CAP_HEIGHT * size) / 2;
}

/** Quantizes a tint to flat steps of 0.05 (printable as a single halftone screen). */
function tint(value: number): number {
  return Math.max(0.2, Math.round(value * 20) / 20);
}

/* ── 1. SONDER: the word among a faint crowd of tiny "sonder", like strangers ── */

interface Stranger {
  x: number;
  y: number;
  size: number;
  opacity: number;
}

const STRANGER_SIZES = [4.6, 4.6, 5.4, 5.4, 6.4, 7.6, 9];
/** Width of the lowercase "sonder" in Cormorant Garamond, in em. */
const STRANGER_EM = 2.62;

function crowd(region: Region, word: { left: number; right: number; top: number; bottom: number }) {
  const random = seeded(region.mode === 'full' ? 11 : 23);
  const target = region.mode === 'full' ? 36 : 46;
  const placed: { box: [number, number, number, number]; s: Stranger }[] = [];
  const left = region.cx - region.width / 2;
  const right = region.cx + region.width / 2;
  for (let tries = 0; tries < 3000 && placed.length < target; tries++) {
    const size = STRANGER_SIZES[Math.floor(random() * STRANGER_SIZES.length)] ?? 5;
    const w = STRANGER_EM * size;
    const x = left + w / 2 + random() * (right - left - w);
    const y = region.top + size + random() * (region.bottom - region.top - size);
    const box: [number, number, number, number] = [
      x - w / 2,
      y - 0.72 * size,
      x + w / 2,
      y + 0.1 * size,
    ];
    const pad = 2;
    const hitsWord =
      box[2] > word.left - 4 &&
      box[0] < word.right + 4 &&
      box[3] > word.top - 4 &&
      box[1] < word.bottom + 4;
    const hitsOther = placed.some(
      ({ box: b }) =>
        box[2] + pad > b[0] && box[0] - pad < b[2] && box[3] + pad > b[1] && box[1] - pad < b[3],
    );
    if (hitsWord || hitsOther) continue;
    // Smaller strangers are farther away: fainter
    const opacity = tint(0.25 + ((size - 4.6) / (9 - 4.6)) * 0.4 + random() * 0.08);
    placed.push({ box, s: { x, y, size, opacity } });
  }
  return placed.map(({ s }) => s);
}

export function SonderPrint(props: CompositionProps) {
  return (
    <PrintFrame {...props}>
      {(region) => {
        const chars = letters(props.tee.word);
        const tracking = 0.16;
        const size = fitSize(chars, region.width * 0.7, tracking, region.mode === 'full' ? 36 : 44);
        const { xs, width } = layoutLetters(chars, size, region.cx, tracking);
        const base = centredBaseline(region, size);
        const strangers = crowd(region, {
          left: region.cx - width / 2,
          right: region.cx + width / 2,
          top: base - CAP_HEIGHT * size,
          bottom: base,
        });
        return (
          <>
            {strangers.map((s, i) => (
              <text
                key={i}
                className="print-crowd"
                x={r2(s.x)}
                y={r2(s.y)}
                fontSize={s.size}
                fillOpacity={s.opacity}
                textAnchor="middle"
              >
                sonder
              </text>
            ))}
            <Letters chars={chars} xs={xs} y={base} size={size} />
          </>
        );
      }}
    </PrintFrame>
  );
}

/* ── 2. ONISM: the word in a thin frame that is just slightly too tight ── */

export function OnismPrint(props: CompositionProps) {
  return (
    <PrintFrame {...props}>
      {(region) => {
        const chars = letters(props.tee.word);
        const tracking = 0.14;
        const size = fitSize(
          chars,
          region.width * 0.66,
          tracking,
          region.mode === 'full' ? 40 : 50,
        );
        const { xs, width } = layoutLetters(chars, size, region.cx, tracking);
        const base = centredBaseline(region, size);
        // The sides cut into the first and last letters; top and bottom touch the capitals.
        const inset = 0.05 * size;
        const top = base - CAP_HEIGHT * size - 0.3;
        return (
          <>
            <rect
              x={r2(region.cx - width / 2 + inset)}
              y={r2(top)}
              width={r2(width - 2 * inset)}
              height={r2(base + 0.9 - top)}
              fill="none"
              stroke="currentColor"
              strokeWidth={STROKE}
            />
            <Letters chars={chars} xs={xs} y={base} size={size} />
          </>
        );
      }}
    </PrintFrame>
  );
}

/* ── 3. MONACHOPSIS: letters on a strict grid, except one that sits out of place ── */

const GRID_COLUMNS = 6;
/** The letter that does not belong where it is (the A of MONACH). */
const MISPLACED = 3;

export function MonachopsisPrint(props: CompositionProps) {
  return (
    <PrintFrame {...props}>
      {(region) => {
        const chars = letters(props.tee.word);
        const rows = [chars.slice(0, GRID_COLUMNS), chars.slice(GRID_COLUMNS)];
        const cell = (region.width * 0.9) / GRID_COLUMNS;
        const size = Math.min(cell / 0.98, region.mode === 'full' ? 30 : 34);
        const capH = CAP_HEIGHT * size;
        const pitch = capH + 0.5 * size;
        const left = region.cx - (cell * GRID_COLUMNS) / 2;
        const firstBase = region.cy - (pitch + capH) / 2 + capH;
        const pad = (pitch - capH) / 2;

        const ticks: string[] = [];
        for (let row = 0; row <= rows.length; row++) {
          const y = firstBase - capH - pad + row * pitch;
          for (let col = 0; col <= GRID_COLUMNS; col++) {
            const x = left + col * cell;
            ticks.push(`M${r2(x - 2)} ${r2(y)}h4M${r2(x)} ${r2(y - 2)}v4`);
          }
        }

        return (
          <>
            <path
              d={ticks.join('')}
              fill="none"
              stroke="currentColor"
              strokeWidth={0.9}
              strokeOpacity={0.5}
            />
            {rows.map((row, r) =>
              row.map((letter, c) => {
                const index = r * GRID_COLUMNS + c;
                const x = left + (c + 0.5) * cell - (capAdvance(letter) * size) / 2;
                const y = firstBase + r * pitch;
                const out = index === MISPLACED;
                const cx = left + (c + 0.5) * cell;
                return (
                  <text
                    key={index}
                    className="print-word"
                    x={r2(x)}
                    y={r2(y)}
                    fontSize={r2(size)}
                    transform={
                      out
                        ? `translate(${r2(cell * 0.2)} ${r2(size * 0.3)}) rotate(9 ${r2(cx)} ${r2(y - capH / 2)})`
                        : undefined
                    }
                  >
                    {letter}
                  </text>
                );
              }),
            )}
          </>
        );
      }}
    </PrintFrame>
  );
}

/* ── 4. NODUS TOLLENS: the plot runs under the words and knots between them ── */

function trefoil(cx: number, cy: number, radius: number, t: number): [number, number] {
  return [
    cx + (radius * (Math.sin(t) + 2 * Math.sin(2 * t))) / 3,
    cy + (radius * (Math.cos(t) - 2 * Math.cos(2 * t))) / 3,
  ];
}

export function NodusTollensPrint(props: CompositionProps) {
  return (
    <PrintFrame {...props}>
      {(region) => {
        const [first = '', second = ''] = props.tee.word.split(' ');
        const top = letters(first);
        const bottom = letters(second);
        const tracking = 0.14;
        const size = fitSize(
          bottom,
          region.width * 0.78,
          tracking,
          region.mode === 'full' ? 32 : 38,
        );
        const capH = CAP_HEIGHT * size;
        const knot = size * 0.55;
        const under = 0.24 * size;
        // Vertical stack: row 1, its underline, the knot (1 radius above its centre,
        // 0.69 below), row 2, its underline
        const span = capH + under + knot * 0.69 + knot + 2 * 3.5 + capH + under;
        const base1 = region.cy - span / 2 + capH;
        const line1 = base1 + under;
        const knotY = line1 + 3.5 + knot;
        const base2 = knotY + knot * 0.69 + 3.5 + capH;
        const line2 = base2 + under;
        const row1 = layoutLetters(top, size, region.cx, tracking);
        const row2 = layoutLetters(bottom, size, region.cx, tracking);
        const left1 = region.cx - row1.width / 2;
        const right1 = region.cx + row1.width / 2;
        const left2 = region.cx - row2.width / 2;
        const right2 = region.cx + row2.width / 2;

        // The knot: enter at the rightmost lobe, go round more than once, leave at the leftmost.
        const samples = 240;
        let tRight = 0;
        let tLeft = 0;
        for (let i = 0; i < samples; i++) {
          const t = (i / samples) * Math.PI * 2;
          const [x] = trefoil(region.cx, knotY, knot, t);
          if (x > trefoil(region.cx, knotY, knot, tRight)[0]) tRight = t;
          if (x < trefoil(region.cx, knotY, knot, tLeft)[0]) tLeft = t;
        }
        let tEnd = tLeft;
        while (tEnd < tRight + Math.PI * 2) tEnd += Math.PI * 2;
        const loop: string[] = [];
        const steps = 160;
        for (let i = 0; i <= steps; i++) {
          const [x, y] = trefoil(region.cx, knotY, knot, tRight + ((tEnd - tRight) * i) / steps);
          loop.push(`${r2(x)} ${r2(y)}`);
        }
        const [inX, inY] = trefoil(region.cx, knotY, knot, tRight);
        const [, outY] = trefoil(region.cx, knotY, knot, tEnd);
        // The plot runs under NODUS, turns back on the right, tangles in the knot, runs
        // out to the left, turns again and runs under TOLLENS: it never crosses a letter.
        const s = size;
        const d = [
          `M${r2(left1 - 0.25 * s)} ${r2(line1)}`,
          `L${r2(right1 + 0.1 * s)} ${r2(line1)}`,
          `C${r2(right1 + 0.5 * s)} ${r2(line1)} ${r2(right1 + 0.5 * s)} ${r2(inY)} ${r2(right1 + 0.1 * s)} ${r2(inY)}`,
          `L${r2(inX)} ${r2(inY)}`,
          `L${loop.join(' L')}`,
          `L${r2(left2 - 0.1 * s)} ${r2(outY)}`,
          `C${r2(left2 - 0.5 * s)} ${r2(outY)} ${r2(left2 - 0.5 * s)} ${r2(line2)} ${r2(left2 - 0.1 * s)} ${r2(line2)}`,
          `L${r2(right2 + 0.25 * s)} ${r2(line2)}`,
        ].join(' ');

        return (
          <>
            <path
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth={STROKE}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <Letters chars={top} xs={row1.xs} y={base1} size={size} />
            <Letters chars={bottom} xs={row2.xs} y={base2} size={size} />
          </>
        );
      }}
    </PrintFrame>
  );
}

/* ── 5. ANEMOIA: the word in offset layers that fade, like an old misregistered print ── */

/** Each earlier impression further off register and fainter (offsets in em). */
const GHOSTS = [
  { dx: 0.3, dy: -0.21, opacity: 0.2 },
  { dx: 0.2, dy: -0.14, opacity: 0.3 },
  { dx: 0.1, dy: -0.07, opacity: 0.5 },
];

export function AnemoiaPrint(props: CompositionProps) {
  return (
    <PrintFrame {...props}>
      {(region) => {
        const chars = letters(props.tee.word);
        const tracking = 0.14;
        const size = fitSize(
          chars,
          region.width * 0.72,
          tracking,
          region.mode === 'full' ? 38 : 46,
        );
        const { xs } = layoutLetters(chars, size, region.cx - 0.15 * size, tracking);
        const base = centredBaseline(region, size) + 0.1 * size;
        return (
          <>
            {GHOSTS.map((ghost, i) => (
              <Letters
                key={i}
                chars={chars}
                xs={xs.map((x) => x + ghost.dx * size)}
                y={base + ghost.dy * size}
                size={size}
                opacity={ghost.opacity}
              />
            ))}
            <Letters chars={chars} xs={xs} y={base} size={size} />
          </>
        );
      }}
    </PrintFrame>
  );
}

/* ── 6. LIBEROSIS: the letters loosen and drift apart towards the end, lighter ── */

export function LiberosisPrint(props: CompositionProps) {
  return (
    <PrintFrame {...props}>
      {(region) => {
        const chars = letters(props.tee.word);
        const n = chars.length;
        const at = (i: number) => i / (n - 1);
        const gaps = chars.map((_, i) => 0.06 + 0.8 * at(i) ** 2);
        const em = chars.reduce(
          (sum, c, i) => sum + capAdvance(c) + (i < n - 1 ? (gaps[i] ?? 0) : 0),
          0,
        );
        const size = Math.min(region.mode === 'full' ? 34 : 40, (region.width * 0.92) / em);
        const { xs } = layoutLetters(chars, size, region.cx, gaps);
        const base = centredBaseline(region, size) + 0.22 * size;
        return chars.map((letter, i) => {
          const x = xs[i] ?? 0;
          const t = at(i);
          const y = base - 0.55 * size * t ** 2.2;
          const turn = -16 * t ** 2.5;
          const mid = x + (capAdvance(letter) * size) / 2;
          return (
            <text
              key={i}
              className="print-word"
              x={r2(x)}
              y={r2(y)}
              fontSize={r2(size)}
              fillOpacity={i === 0 ? undefined : tint(1 - 0.62 * t ** 1.4)}
              transform={
                turn
                  ? `rotate(${r2(turn)} ${r2(mid)} ${r2(y - (CAP_HEIGHT * size) / 2)})`
                  : undefined
              }
            >
              {letter}
            </text>
          );
        });
      }}
    </PrintFrame>
  );
}

/* ── 7. EXULANSIS: the word after an opening quotation mark, never closed ── */

export function ExulansisPrint(props: CompositionProps) {
  return (
    <PrintFrame {...props}>
      {(region) => {
        const chars = letters(props.tee.word);
        const tracking = 0.12;
        const size = fitSize(
          chars,
          region.width * 0.82,
          tracking,
          region.mode === 'full' ? 34 : 40,
        );
        const quote = size * 4.2;
        // The mark spans 0.38 to 0.64 em above its baseline; it hangs over the word's start.
        const markHeight = 0.26 * quote;
        const capH = CAP_HEIGHT * size;
        const span = markHeight + 3 + capH;
        const base = region.cy + span / 2;
        const { xs } = layoutLetters(chars, size, region.cx + 0.1 * size, tracking);
        const left = xs[0] ?? region.cx;
        const quoteBase = base - capH - 3 + 0.38 * quote;
        return (
          <>
            <text
              className="print-word"
              x={r2(left - 0.06 * quote)}
              y={r2(quoteBase)}
              fontSize={r2(quote)}
            >
              {'“'}
            </text>
            <Letters chars={chars} xs={xs} y={base} size={size} />
          </>
        );
      }}
    </PrintFrame>
  );
}

/* ── 8. ALTSCHMERZ: the word stacked many times, worn at the top, crisp at the bottom ── */

export function AltschmerzPrint(props: CompositionProps) {
  return (
    <PrintFrame {...props}>
      {(region) => {
        const chars = letters(props.tee.word);
        const rows = region.mode === 'full' ? 5 : 7;
        const tracking = 0.08;
        const height = region.bottom - region.top - 4;
        const byHeight = height / (rows * CAP_HEIGHT + (rows - 1) * 0.36);
        const size = Math.min(byHeight, fitSize(chars, region.width * 0.86, tracking, 30));
        const capH = CAP_HEIGHT * size;
        const pitch = capH + 0.36 * size;
        const total = rows * capH + (rows - 1) * 0.36 * size;
        const firstBase = region.cy - total / 2 + capH;
        const { xs, width } = layoutLetters(chars, size, region.cx, tracking);

        // Wear: knocked-out specks, dense on the top rows, none on the last (print-safe distress)
        const random = seeded(region.mode === 'full' ? 5 : 9);
        const specks: { x: number; y: number; r: number }[] = [];
        for (let row = 0; row < rows - 1; row++) {
          const wear = (1 - row / (rows - 1)) ** 1.5;
          const count = Math.round(110 * wear);
          const y0 = firstBase + row * pitch - capH - 1;
          for (let i = 0; i < count; i++) {
            specks.push({
              x: region.cx - width / 2 + random() * width,
              y: y0 + random() * (capH + 2),
              r: 0.6 + random() * (0.5 + wear),
            });
          }
        }
        const mask = `${region.uid}-wear`;

        return (
          <>
            <mask id={mask} maskUnits="userSpaceOnUse" x={0} y={0} width={200} height={240}>
              <rect width={200} height={240} fill="white" />
              {specks.map((s, i) => (
                <circle key={i} cx={r2(s.x)} cy={r2(s.y)} r={r2(s.r)} fill="black" />
              ))}
            </mask>
            <g mask={`url(#${mask})`}>
              {Array.from({ length: rows }, (_, row) => (
                <Letters
                  key={row}
                  chars={chars}
                  xs={xs}
                  y={firstBase + row * pitch}
                  size={size}
                  opacity={
                    row === rows - 1 ? undefined : tint(0.3 + 0.7 * (row / (rows - 1)) ** 1.3)
                  }
                />
              ))}
            </g>
          </>
        );
      }}
    </PrintFrame>
  );
}

/* ── 9. ZENOSYNE: the spacing shrinks letter by letter, as if time were speeding up ── */

export function ZenosynePrint(props: CompositionProps) {
  return (
    <PrintFrame {...props}>
      {(region) => {
        const chars = letters(props.tee.word);
        const n = chars.length;
        const gaps = chars.map((_, i) => 0.95 * (1 - i / (n - 2)) ** 1.35 - 0.03);
        const em = chars.reduce(
          (sum, c, i) => sum + capAdvance(c) + (i < n - 1 ? (gaps[i] ?? 0) : 0),
          0,
        );
        const size = Math.min(region.mode === 'full' ? 34 : 40, (region.width * 0.94) / em);
        const { xs } = layoutLetters(chars, size, region.cx, gaps);
        const base = centredBaseline(region, size) - 0.12 * size;
        // A time scale under the word: one tick under each letter, closing in like the letters
        const centres = chars.map((c, i) => (xs[i] ?? 0) + (capAdvance(c) * size) / 2);
        const ruleY = base + 0.3 * size;
        const first = centres[0] ?? region.cx;
        const last = centres[n - 1] ?? region.cx;
        const d = [
          `M${r2(first)} ${r2(ruleY)}H${r2(last)}`,
          ...centres.map((x) => `M${r2(x)} ${r2(ruleY)}v${r2(0.14 * size)}`),
        ].join('');
        return (
          <>
            <path
              d={d}
              fill="none"
              stroke="currentColor"
              strokeWidth={0.9}
              strokeOpacity={0.6}
              strokeLinecap="round"
            />
            <Letters chars={chars} xs={xs} y={base} size={size} />
          </>
        );
      }}
    </PrintFrame>
  );
}

/* ── 10. ÉNOUEMENT: the word over its faint inverted reflection, as in a mirror ── */

export function EnouementPrint(props: CompositionProps) {
  return (
    <PrintFrame {...props}>
      {(region) => {
        const chars = letters(props.tee.word);
        const tracking = 0.14;
        const size = fitSize(
          chars,
          region.width * 0.76,
          tracking,
          region.mode === 'full' ? 36 : 44,
        );
        const { xs } = layoutLetters(chars, size, region.cx, tracking);
        const capH = CAP_HEIGHT * size;
        const gap = 0.1 * size;
        const accent = 0.2 * size; // the É's accent rises above the capitals
        const span = accent + capH + 2 * gap + capH;
        const base = region.cy - span / 2 + accent + capH;
        const axis = base + gap;
        // The reflection fades through knocked-out lines that thicken downwards (no gradient)
        const mask = `${region.uid}-ripple`;
        const lines: { y: number; h: number }[] = [];
        for (let y = axis + 1.2, i = 0; y < axis + capH + accent + 2; i++) {
          const h = 0.5 + 0.22 * i;
          lines.push({ y, h });
          y += h + 1.6;
        }
        return (
          <>
            <mask id={mask} maskUnits="userSpaceOnUse" x={0} y={0} width={200} height={240}>
              <rect width={200} height={240} fill="white" />
              {lines.map((l, i) => (
                <rect key={i} x={0} y={r2(l.y)} width={200} height={r2(l.h)} fill="black" />
              ))}
            </mask>
            <g mask={`url(#${mask})`}>
              <g transform={`translate(0 ${r2(2 * axis)}) scale(1 -1)`}>
                <Letters chars={chars} xs={xs} y={base} size={size} opacity={0.3} />
              </g>
            </g>
            <Letters chars={chars} xs={xs} y={base} size={size} />
          </>
        );
      }}
    </PrintFrame>
  );
}
