import { MotifSvg, type MotifProps } from '../motifs/MotifSvg';

/*
 * The nine links as line art: one family on a shared 64-unit box, drawn at the
 * pillar-icon stroke weight (MOTIF_STROKE, non-scaling) in currentColor. Each
 * is a single link drawn from its technical description; station chains (Star,
 * Heart, Echo) carry their small rings so they read as part of a chain. Solid
 * details say stroke="none".
 */

const VIEWBOX = '0 0 64 64';

/** Void: a long stadium of round wire, the most open link. */
export function VoidLink(props: MotifProps) {
  return (
    <MotifSvg viewBox={VIEWBOX} {...props}>
      <rect x="22" y="4" width="20" height="56" rx="10" />
      <rect x="26.5" y="8.5" width="11" height="47" rx="5.5" />
    </MotifSvg>
  );
}

/** Star: a flat five-pointed star with a small ring at each side arm. */
export function StarLink(props: MotifProps) {
  const points = Array.from({ length: 10 }, (_, i) => {
    const r = i % 2 === 0 ? 14 : 6;
    const a = ((-90 + i * 36) * Math.PI) / 180;
    return `${(32 + r * Math.cos(a)).toFixed(2)},${(33 + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
  return (
    <MotifSvg viewBox={VIEWBOX} {...props}>
      <polygon points={points} />
      <circle cx="14" cy="27.2" r="3.4" />
      <circle cx="50" cy="27.2" r="3.4" />
      <path d="M8.2 27.2 H5" />
      <path d="M55.8 27.2 H59" />
    </MotifSvg>
  );
}

/** Monolith: a twisted, flattened curb link with diamond-cut facets. */
export function MonolithLink(props: MotifProps) {
  return (
    <MotifSvg viewBox={VIEWBOX} {...props}>
      <g transform="rotate(-16 32 32)">
        <rect x="19" y="5" width="26" height="54" rx="13" />
        <rect x="26" y="14" width="12" height="36" rx="6" />
        {/* Flat cut faces between the edges */}
        <path d="M19.6 22 L26 25" />
        <path d="M44.4 22 L38 25" />
        <path d="M19.6 42 L26 39" />
        <path d="M44.4 42 L38 39" />
        <path d="M32 5.2 L32 14" />
        <path d="M32 50 L32 58.8" />
      </g>
    </MotifSvg>
  );
}

/** Static: a small oval whose surface is finely engraved. */
export function StaticLink(props: MotifProps) {
  const ticks = Array.from({ length: 18 }, (_, i) => {
    const t = (i / 18) * Math.PI * 2;
    const t2 = t + 0.16; // slanted cut
    return {
      key: i,
      x1: 32 + 8.6 * Math.cos(t),
      y1: 32 + 14.6 * Math.sin(t),
      x2: 32 + 11.6 * Math.cos(t2),
      y2: 32 + 17.6 * Math.sin(t2),
    };
  });
  return (
    <MotifSvg viewBox={VIEWBOX} {...props}>
      <ellipse cx="32" cy="32" rx="13.5" ry="19.5" />
      <ellipse cx="32" cy="32" rx="7" ry="13" />
      {ticks.map(({ key, ...line }) => (
        <line key={key} {...line} />
      ))}
    </MotifSvg>
  );
}

/** Together: an elongated rectangle of square-section wire, square corners. */
export function TogetherLink(props: MotifProps) {
  return (
    <MotifSvg viewBox={VIEWBOX} {...props}>
      <rect x="21" y="4" width="22" height="56" rx="1.2" />
      <rect x="26" y="9" width="12" height="46" rx="0.6" />
      {/* Mitred corners: the square section */}
      <path d="M21 4 L26 9 M43 4 L38 9 M21 60 L26 55 M43 60 L38 55" />
    </MotifSvg>
  );
}

/** Meridian: a small, smooth oval of fine wire, the most delicate link. */
export function MeridianLink(props: MotifProps) {
  return (
    <MotifSvg viewBox={VIEWBOX} {...props}>
      <ellipse cx="32" cy="32" rx="12" ry="17.5" />
      <ellipse cx="32" cy="32" rx="9.8" ry="15.3" />
      <path d="M24.6 24 C25.4 20.4 27.4 17.8 30 17.2" />
    </MotifSvg>
  );
}

/** Heart: a puffed, polished heart with a small ring at each lobe. */
export function HeartLink(props: MotifProps) {
  return (
    <MotifSvg viewBox={VIEWBOX} {...props}>
      <path d="M32 48 C18 38 13 30 17 23 C21 16.5 29 17 32 23.5 C35 17 43 16.5 47 23 C51 30 46 38 32 48 Z" />
      <path d="M23 24 C21.2 26.4 21.4 29.6 23.6 32" />
      <circle cx="14.6" cy="20.5" r="3.4" />
      <circle cx="49.4" cy="20.5" r="3.4" />
      <path d="M8.8 19.6 H5" />
      <path d="M55.2 19.6 H59" />
    </MotifSvg>
  );
}

/** Echo: a flat disc pierced near both edges, joined by rings, shining like a coin. */
export function EchoLink(props: MotifProps) {
  return (
    <MotifSvg viewBox={VIEWBOX} {...props}>
      <circle cx="32" cy="32" r="14" />
      <circle cx="32" cy="21.6" r="1.9" />
      <circle cx="32" cy="42.4" r="1.9" />
      <path d="M23.6 30 A9 9 0 0 1 29.6 23.6" />
      <ellipse cx="32" cy="14.4" rx="3" ry="6.2" />
      <ellipse cx="32" cy="49.6" rx="3" ry="6.2" />
    </MotifSvg>
  );
}

/** Snake: a soft-edged cubic link in light perspective, its round opening on the face. */
export function SnakeLink(props: MotifProps) {
  return (
    <MotifSvg viewBox={VIEWBOX} {...props}>
      <rect x="17" y="24" width="27" height="27" rx="5" />
      <path d="M21 24 L28 16.5 Q29.4 15 31.4 15 L46 15 Q51 15 50 19 L44.6 25.6" />
      <path d="M50 19 L50 41 Q50 43 48.6 44.6 L44 49.6" />
      <rect x="23.5" y="30.5" width="14" height="14" rx="4" />
    </MotifSvg>
  );
}
