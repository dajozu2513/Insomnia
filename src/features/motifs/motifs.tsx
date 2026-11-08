import { useId } from 'react';

import { MotifSvg, type MotifProps } from './MotifSvg';

/*
 * Thin line ornaments from public-domain sources (Carroll's Alice books and
 * Tenniel's illustrations): objects and patterns only, never characters. All
 * drawn here in code; nothing is traced from a reference image.
 */

interface ChessboardProps extends MotifProps {
  /** Squares per side. */
  squares?: number;
  /** Opacity of the dark squares (the pattern stays quiet behind content). */
  fillOpacity?: number;
}

/** Chessboard tile: the bridge from the legacy site. Filled squares inside a fine grid. */
export function Chessboard({ squares = 4, fillOpacity = 0.85, ...props }: ChessboardProps) {
  const id = useId();
  const cell = 48 / squares;
  return (
    <MotifSvg viewBox="0 0 48 48" {...props}>
      <defs>
        <pattern id={id} width={cell * 2} height={cell * 2} patternUnits="userSpaceOnUse">
          <rect width={cell} height={cell} fill="currentColor" stroke="none" />
          <rect x={cell} y={cell} width={cell} height={cell} fill="currentColor" stroke="none" />
        </pattern>
      </defs>
      <rect width="48" height="48" fill={`url(#${id})`} fillOpacity={fillOpacity} stroke="none" />
      <rect x="0.5" y="0.5" width="47" height="47" />
    </MotifSvg>
  );
}

// Left half of the filigree; the right half is the same paths mirrored.
const FILIGREE_HALF = [
  'M8 12 H96', // rule
  'M8 12 C3 12 2 6 6 5 C9 4.4 10.5 8 8 9', // end curl
  'M96 12 C101 12 103 5 108 6.5 C112 8 110.5 13 107 12.2', // inner scroll toward the centre
  'M96 12 C101 12 103 19 108 17.5 C112 16 110.5 11 107 11.8',
  'M60 12 C63 9 67 9 69 11', // small leaf on the rule
  'M60 12 C63 15 67 15 69 13',
];

/** Wrought-iron filigree divider: a rule with mirrored scrolls around a diamond. */
export function FiligreeDivider(props: MotifProps) {
  return (
    <MotifSvg viewBox="0 0 240 24" size={240} {...props}>
      {FILIGREE_HALF.map((d) => (
        <path key={d} d={d} />
      ))}
      <g transform="matrix(-1 0 0 1 240 0)">
        {FILIGREE_HALF.map((d) => (
          <path key={d} d={d} />
        ))}
      </g>
      <path d="M120 4 L127 12 L120 20 L113 12 Z" />
      <circle cx="120" cy="12" r="1.6" fill="currentColor" stroke="none" />
    </MotifSvg>
  );
}

/** A rose with thorns: cupped bloom, inner spiral, stem, two thorns, one leaf. */
export function Rose(props: MotifProps) {
  return (
    <MotifSvg viewBox="0 0 48 48" {...props}>
      <path d="M15 15 C15 23 33 23 33 15" />
      <path d="M15 15 C16 9 21 8 24 11 C27 8 32 9 33 15" />
      <path d="M24 11 C20.5 12 20.5 17 24 17 C27.5 17 27.5 12.5 24.5 13.2" />
      <path d="M19 19.5 C21 17.5 22 15 21.5 13" />
      <path d="M29 19.5 C27 17.5 26 15 26.5 13" />
      <path d="M24 21 C24 29 23 36 24 45" />
      <path d="M23.8 27.5 L27 25.8" />
      <path d="M23.5 38 L20.4 36.6" />
      <path d="M23.7 32 C27.5 28.5 32 29.5 33.5 31.5 C30.5 34.2 26.5 34.2 23.7 32 Z" />
      <path d="M26 31.6 C28.5 31 30.5 31 32 31.4" />
    </MotifSvg>
  );
}

/** An old key: ringed bow with a quatrefoil, collar, shaft and a toothed bit. */
export function Key(props: MotifProps) {
  return (
    <MotifSvg viewBox="0 0 48 48" {...props}>
      <circle cx="11" cy="24" r="6.5" />
      <path d="M11 20.2 C12.6 21.6 12.6 22.4 11 24 C9.4 22.4 9.4 21.6 11 20.2 Z" />
      <path d="M11 27.8 C12.6 26.4 12.6 25.6 11 24 C9.4 25.6 9.4 26.4 11 27.8 Z" />
      <path d="M7.2 24 C8.6 22.4 9.4 22.4 11 24 C9.4 25.6 8.6 25.6 7.2 24 Z" />
      <path d="M14.8 24 C13.4 22.4 12.6 22.4 11 24 C12.6 25.6 13.4 25.6 14.8 24 Z" />
      <path d="M17.5 24 H43" />
      <path d="M19.5 21.8 V26.2" />
      <path d="M21.5 21.8 V26.2" />
      <path d="M43 24 V30 H40 V27.5 H37.5 V30 H35 V24" />
    </MotifSvg>
  );
}

interface ClockFaceProps extends MotifProps {
  /** Time shown by the hands, in minutes after midnight. */
  minutes?: number;
}

/** Clock-face linework: double ring, twelve ticks (longer at the quarters), two hands. */
export function ClockFace({ minutes = 21 * 60 + 47, ...props }: ClockFaceProps) {
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const inner = i % 3 === 0 ? 14.5 : 16;
    return {
      key: i,
      x1: 24 + Math.sin(a) * inner,
      y1: 24 - Math.cos(a) * inner,
      x2: 24 + Math.sin(a) * 17.5,
      y2: 24 - Math.cos(a) * 17.5,
    };
  });
  const minuteAngle = ((minutes % 60) / 60) * Math.PI * 2;
  const hourAngle = (((minutes / 60) % 12) / 12) * Math.PI * 2;
  return (
    <MotifSvg viewBox="0 0 48 48" {...props}>
      <circle cx="24" cy="24" r="21" />
      <circle cx="24" cy="24" r="19" />
      {ticks.map(({ key, ...line }) => (
        <line key={key} {...line} />
      ))}
      <line x1="24" y1="24" x2={24 + Math.sin(hourAngle) * 9} y2={24 - Math.cos(hourAngle) * 9} />
      <line
        x1="24"
        y1="24"
        x2={24 + Math.sin(minuteAngle) * 13.5}
        y2={24 - Math.cos(minuteAngle) * 13.5}
      />
      <circle cx="24" cy="24" r="1.4" fill="currentColor" stroke="none" />
    </MotifSvg>
  );
}

/** PLACEHOLDER single chain link (an oval, upright) until the nine link drawings exist. */
export function OvalLink(props: MotifProps) {
  return (
    <MotifSvg viewBox="0 0 48 48" {...props}>
      <rect x="15" y="4" width="18" height="40" rx="9" />
      <rect x="19.5" y="9" width="9" height="30" rx="4.5" />
      <path d="M17.5 14 C17.5 10.5 19 8 21 7" />
    </MotifSvg>
  );
}
