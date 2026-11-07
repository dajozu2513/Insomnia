import type { ReactNode } from 'react';

/*
 * Pillar icons: thin line art in a 48-unit box shown at 48px, stroke 1.3 (the
 * legacy pillar-icon weight and the motif weight). Outlines draw themselves;
 * solid shapes must say stroke="none" so they fade in instead (see Pillars.tsx).
 */

function PillarSvg({ children }: { children: ReactNode }) {
  return (
    <svg
      className="pillar-icon"
      viewBox="0 0 48 48"
      width="48"
      height="48"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** Steel: a single chain link, tilted as if hanging. */
export function LinkIcon() {
  return (
    <PillarSvg>
      <g transform="rotate(-35 24 24)">
        <rect x="7" y="15" width="34" height="18" rx="9" />
        <rect x="12.5" y="20" width="23" height="8" rx="4" />
      </g>
    </PillarSvg>
  );
}

/** Words: an open quotation mark, two solid dots with drawn tails. */
export function QuoteIcon() {
  return (
    <PillarSvg>
      <path d="M13.4 27 C12.6 20.5 15.6 15.6 21.4 13.4" />
      <path d="M27.4 27 C26.6 20.5 29.6 15.6 35.4 13.4" />
      <circle cx="17.4" cy="28.6" r="4.4" fill="currentColor" stroke="none" />
      <circle cx="31.4" cy="28.6" r="4.4" fill="currentColor" stroke="none" />
    </PillarSvg>
  );
}

/** Vigil: a crescent moon and one small star. */
export function MoonIcon() {
  return (
    <PillarSvg>
      <path d="M27 8.5 A16 16 0 1 0 39.5 33 A12.5 12.5 0 1 1 27 8.5 Z" />
      <path
        d="M37 10 L37.9 12.6 L40.5 13.5 L37.9 14.4 L37 17 L36.1 14.4 L33.5 13.5 L36.1 12.6 Z"
        fill="currentColor"
        stroke="none"
      />
    </PillarSvg>
  );
}
