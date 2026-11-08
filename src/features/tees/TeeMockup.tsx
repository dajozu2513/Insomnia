import {
  printContent,
  type Placement,
  type PrintLanguage,
  type Tee,
  type TeeColour,
  type TeeSide,
} from '../../data/tees';
import { COMPOSITIONS } from './print/compositionMap';
import { GRID_CROP, TEE_FRAME, viewBox } from './teeGeometry';

/*
 * A flat T-shirt in line art (300 x 330 units, about 0.13 in per unit on a
 * medium tee), filled black or white, with the print at a realistic size and
 * position: front prints sit on the chest (about 10.5 in wide, 3.5 in below the
 * collar), the word alone a little wider (about 11 in); back prints sit higher and wider
 * (about 12 in). No photos and no shading beyond the seams.
 */

/** The outline; its top edge is the back neckline (the higher one). */
const BODY =
  'M121 22C108 26 84 32 66 38L16 100L50 125L76 110C74 170 76 250 77 314Q150 319 223 314C224 250 226 170 224 110L250 125L284 100L234 38C216 32 192 26 179 22C172 32 128 32 121 22Z';
/** Front view: the inside of the back collar shows above the deeper front neckline. */
const INSIDE_BACK = 'M121 22C128 32 172 32 179 22C172 44 128 44 121 22Z';
const FRONT_NECK = 'M121 22C128 44 172 44 179 22M113 23.6C121 55 179 55 187 23.6';
const BACK_NECK = 'M114 23.8C124 41 176 41 186 23.8';
/** Armhole seams, sleeve and body hem stitching. */
const SEAMS =
  'M66 38C70 62 73 88 76 110M234 38C230 62 227 88 224 110M20.5 96.5L52.5 120M279.5 96.5L247.5 120M77.6 306Q150 311 222.4 306';

/** Print boxes (200 x 240 print units, scaled), by side and content. */
const BOXES = {
  front: { full: { x: 102, y: 66, width: 96 }, word: { x: 96, y: 62, width: 108 } },
  back: { full: { x: 96, y: 56, width: 108 }, word: { x: 96, y: 56, width: 108 } },
} as const;

interface TeeMockupProps {
  tee: Tee;
  colour: TeeColour;
  /** Language of the printed meaning. */
  lang: PrintLanguage;
  side: TeeSide;
  placement: Placement;
  /** Accessible name; without one the mockup is decorative. */
  label?: string;
  className?: string;
  /** Show only the grid crop on the chest print (same frame for every tee). */
  crop?: boolean;
}

export function TeeMockup({
  tee,
  colour,
  lang,
  side,
  placement,
  label,
  className,
  crop = false,
}: TeeMockupProps) {
  const Composition = COMPOSITIONS[tee.composition];
  const content = printContent(placement, side);
  const box = content ? BOXES[side][content] : undefined;

  return (
    <svg
      className={`tee tee--${colour}${className ? ` ${className}` : ''}`}
      viewBox={viewBox(crop ? GRID_CROP : TEE_FRAME)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <path className="tee-body" d={BODY} />
      {side === 'front' && <path className="tee-inside" d={INSIDE_BACK} />}
      <path className="tee-line" d={side === 'front' ? FRONT_NECK : BACK_NECK} />
      <path className="tee-line" d={SEAMS} />
      {box && (
        <Composition
          tee={tee}
          colour={colour}
          lang={lang}
          side={side}
          placement={placement}
          box={{ ...box, height: box.width * 1.2 }}
        />
      )}
    </svg>
  );
}
