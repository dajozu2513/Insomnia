import { Color, MathUtils } from 'three';

/*
 * Night-cycle lighting (docs/brand/design-direction.md, "The night cycle").
 * Only cheap parameters change: fog colour and range, tone-mapping exposure in
 * a narrow band, a rim light's colour and intensity, and a faint rose glow far
 * behind the chain. The baked studio environment (what makes the steel read as
 * steel) never changes, so the chain stays neutral silver.
 */

interface Keyframe {
  /** Night progress: 0 dusk (top of the page), 1 dawn (bottom). */
  at: number;
  /** Fog and background colour (the canvas clears to it, so far things dissolve into it). */
  fog: string;
  fogNear: number;
  fogFar: number;
  exposure: number;
  rimColor: string;
  rimIntensity: number;
  /** Strength of the rose glow far behind the chain (light only, never on the steel). */
  glow: number;
}

/** The night's keyframes. Change values here only, and re-measure the chain colour. */
export const NIGHT_KEYFRAMES: readonly Keyframe[] = [
  // Dusk: slightly warm, lighter fog
  {
    at: 0,
    fog: '#1a1718',
    fogNear: 13,
    fogFar: 39,
    exposure: 1.15,
    rimColor: '#f6e3d2',
    rimIntensity: 0.35,
    glow: 0,
  },
  // Midnight: deepest, the rose glow at its strongest
  {
    at: 0.5,
    fog: '#0b0a0d',
    fogNear: 12,
    fogFar: 36,
    exposure: 1.13,
    rimColor: '#e6e3ea',
    rimIntensity: 0.28,
    glow: 0.2,
  },
  // Small hours: coldest
  {
    at: 0.75,
    fog: '#0b0c10',
    fogNear: 12,
    fogFar: 36,
    exposure: 1.13,
    rimColor: '#dcdfe7',
    rimIntensity: 0.3,
    glow: 0.03,
  },
  // Dawn: pale, cool grey
  {
    at: 1,
    fog: '#1b1e22',
    fogNear: 13,
    fogFar: 39,
    exposure: 1.15,
    rimColor: '#e9edf4',
    rimIntensity: 0.36,
    glow: 0,
  },
];

export interface NightState {
  fog: Color;
  fogNear: number;
  fogFar: number;
  exposure: number;
  rimColor: Color;
  rimIntensity: number;
  glow: number;
}

const fogA = new Color();
const fogB = new Color();
const rimA = new Color();
const rimB = new Color();

/** Fills `out` with the lighting for night progress `p`, eased between keyframes. */
export function sampleNight(p: number, out: NightState): NightState {
  const t = MathUtils.clamp(p, 0, 1);
  let i = 0;
  while (i < NIGHT_KEYFRAMES.length - 2 && t > (NIGHT_KEYFRAMES[i + 1]?.at ?? 1)) i++;
  const a = NIGHT_KEYFRAMES[i];
  const b = NIGHT_KEYFRAMES[i + 1];
  if (!a || !b) return out;
  const k = MathUtils.smoothstep(t, a.at, b.at);
  out.fog.copy(fogA.set(a.fog)).lerp(fogB.set(b.fog), k);
  out.fogNear = MathUtils.lerp(a.fogNear, b.fogNear, k);
  out.fogFar = MathUtils.lerp(a.fogFar, b.fogFar, k);
  out.exposure = MathUtils.lerp(a.exposure, b.exposure, k);
  out.rimColor.copy(rimA.set(a.rimColor)).lerp(rimB.set(b.rimColor), k);
  out.rimIntensity = MathUtils.lerp(a.rimIntensity, b.rimIntensity, k);
  out.glow = MathUtils.lerp(a.glow, b.glow, k);
  return out;
}

export function createNightState(): NightState {
  return {
    fog: new Color(),
    fogNear: 0,
    fogFar: 0,
    exposure: 1,
    rimColor: new Color(),
    rimIntensity: 0,
    glow: 0,
  };
}
