import { useId, type ReactNode } from 'react';

import {
  printContent,
  type Placement,
  type PrintLanguage,
  type Tee,
  type TeeColour,
  type TeeSide,
} from '../../../data/tees';
import { capsEm, layoutLetters, letters, r2, wrapLines } from './metrics';

/** Every print is drawn in a 200 x 240 box; the mockup places and scales it. */
const VIEW_BOX = '0 0 200 240';

export interface CompositionProps {
  tee: Tee;
  colour: TeeColour;
  /** Language of the printed meaning. */
  lang: PrintLanguage;
  side: TeeSide;
  placement: Placement;
  /** Position and size inside a parent <svg> (the mockup); omitted, CSS sizes it. */
  box?: { x: number; y: number; width: number; height: number };
  className?: string;
}

/** Where a composition draws its word, in print units. */
export interface Region {
  /** "full": the word above its meaning; "word": the word alone, large. */
  mode: 'full' | 'word';
  cx: number;
  cy: number;
  top: number;
  bottom: number;
  width: number;
  /** Prefix for ids inside this print (masks), unique on the page. */
  uid: string;
}

const REGIONS = {
  full: { top: 16, bottom: 124, width: 176 },
  word: { top: 12, bottom: 152, width: 196 },
} as const;

/** Meaning: EB Garamond, centred under the word. */
const MEANING = { size: 10.5, leading: 14.6, maxWidth: 164, firstBaseline: 148 } as const;

/** Baseline of the brand mark. */
const MARK_Y = { full: 228, word: 178 } as const;

/**
 * The frame every composition shares: the root <svg> in the print colour (ink
 * on the white tee, bone on the black one, set in tees.css), the meaning in
 * the print language under the word ("full"), and the quiet brand mark at the
 * bottom. Draws nothing when the side carries no print. Monochrome only: flat
 * tints (opacity) at most, never a gradient, no stroke under 0.8 print units.
 */
export function PrintFrame({
  tee,
  colour,
  lang,
  side,
  placement,
  box,
  className,
  children,
}: CompositionProps & { children: (region: Region) => ReactNode }) {
  const uid = `p${useId().replace(/[^\w-]/g, '')}`;
  const mode = printContent(placement, side);
  if (!mode) return null;

  const { top, bottom, width } = REGIONS[mode];
  const region: Region = { mode, cx: 100, cy: (top + bottom) / 2, top, bottom, width, uid };

  return (
    <svg
      viewBox={VIEW_BOX}
      {...box}
      className={`print print--${colour}${className ? ` ${className}` : ''}`}
      fill="currentColor"
      stroke="none"
      aria-hidden="true"
      focusable="false"
    >
      {children(region)}
      {mode === 'full' && <Meaning text={tee.meaning[lang]} />}
      <Mark y={MARK_Y[mode]} />
    </svg>
  );
}

function Meaning({ text }: { text: string }) {
  const lines = wrapLines(text, MEANING.size, MEANING.maxWidth);
  return (
    <text
      className="print-meaning"
      x={100}
      y={MEANING.firstBaseline}
      fontSize={MEANING.size}
      textAnchor="middle"
    >
      {lines.map((line, i) => (
        <tspan key={i} x={100} dy={i === 0 ? 0 : MEANING.leading}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

/** "INSOMNIA by Joel Soto", small and solid: quiet by size, not by tint. */
const MARK = { nameSize: 5.6, tracking: 0.28, bySize: 6.4, byEm: 4.113, gap: 2.6 } as const;

function Mark({ y }: { y: number }) {
  const name = letters('Insomnia');
  const nameWidth = capsEm(name, MARK.tracking) * MARK.nameSize;
  const total = nameWidth + MARK.gap + MARK.byEm * MARK.bySize;
  const left = 100 - total / 2;
  const { xs } = layoutLetters(name, MARK.nameSize, left + nameWidth / 2, MARK.tracking);
  return (
    <g className="print-mark">
      <text className="print-mark-name" x={xs.map(r2).join(' ')} y={y} fontSize={MARK.nameSize}>
        {name.join('')}
      </text>
      <text
        className="print-mark-by"
        x={r2(left + nameWidth + MARK.gap)}
        y={y}
        fontSize={MARK.bySize}
      >
        by Joel Soto
      </text>
    </g>
  );
}
