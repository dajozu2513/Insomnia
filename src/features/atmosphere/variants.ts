/*
 * Atmosphere variants under review (step 10): the current look and three
 * dreamlike alternatives. `?atmo=a|b|c` on any page chooses one and keeps it for
 * the browser session (any other value, e.g. ?atmo=current, goes back to the
 * current look). The inline script in index.html applies the choice to <html
 * data-atmo> before first paint; CSS reads it there (tokens.css, the mist
 * styles) and the 3D scene gets the matching palette from here.
 *
 * Three-free: the engine receives plain hex strings and numbers.
 */

export type AtmoVariant = 'current' | 'a' | 'b' | 'c';

export const ATMO_VARIANTS: readonly AtmoVariant[] = ['current', 'a', 'b', 'c'];

/** The 3D scene's part of a variant. */
export interface SceneAtmosphere {
  /**
   * The hero's haze. 'low': the current blood-red mist in the bottom and lower
   * corners. 'veils': soft horizontal veils high in the frame, rose light with
   * brighter cores (the glow), added behind the chain.
   */
  mist: {
    mode: 'low' | 'veils';
    /** Main colour (low: the accent; veils: the veil light). */
    colour: string;
    /** Second colour (low: the glow; veils: the light in the brightest cores). */
    light: string;
    /** Overall strength at the top of the hero. */
    strength: number;
  };
  /** The light far behind the chain, strongest at midnight. */
  glow: {
    colour: string;
    /** Multiplies the night cycle's glow. */
    gain: number;
    /** Added at every hour (0 for the current look). */
    base: number;
    /** Vertical offset of its centre, as a fraction of the view height (up is positive). */
    lift: number;
  };
  /** The floating particles. 'dust': the current soft grey dust; 'motes': additive, twinkling. */
  motes: {
    kind: 'dust' | 'motes';
    colour: string;
    opacity: number;
    size: number;
    /** Depth of the brightness breathing, 0..1 (0: none). */
    twinkle: number;
  };
}

export interface AtmoPalette {
  accent: string;
  accentGlow: string;
  /** Candlelight gold (variant C only): light in the motes and the mist, never text or fills. */
  gold?: string;
  scene: SceneAtmosphere;
}

export const ATMO_PALETTES: Record<AtmoVariant, AtmoPalette> = {
  current: {
    accent: '#8f1d22',
    accentGlow: 'rgba(196, 40, 45, 0.35)',
    scene: {
      mist: { mode: 'low', colour: '#8f1d22', light: '#c4282d', strength: 0.7 },
      glow: { colour: '#c4282d', gain: 1, base: 0, lift: 0 },
      motes: { kind: 'dust', colour: '#e6e0d4', opacity: 0.35, size: 0.2, twinkle: 0 },
    },
  },
  a: {
    accent: '#9e2a3a',
    accentGlow: 'rgba(214, 84, 112, 0.35)',
    scene: {
      mist: { mode: 'veils', colour: '#c4506a', light: '#ffd2dc', strength: 0.72 },
      glow: { colour: '#d65470', gain: 1.4, base: 0.05, lift: 0.18 },
      motes: { kind: 'motes', colour: '#fff1e6', opacity: 1, size: 0.34, twinkle: 0.6 },
    },
  },
  b: {
    accent: '#6e1f3a',
    accentGlow: 'rgba(164, 96, 150, 0.35)',
    scene: {
      mist: { mode: 'veils', colour: '#8e4a7a', light: '#e2cce8', strength: 0.86 },
      glow: { colour: '#a46096', gain: 1.4, base: 0.06, lift: 0.18 },
      motes: { kind: 'motes', colour: '#e6e4f2', opacity: 0.95, size: 0.32, twinkle: 0.55 },
    },
  },
  c: {
    accent: '#9e2a3a',
    accentGlow: 'rgba(214, 84, 112, 0.35)',
    gold: '#d9b26a',
    scene: {
      mist: { mode: 'veils', colour: '#c4506a', light: '#f0cc86', strength: 0.72 },
      glow: { colour: '#d9a46a', gain: 1.3, base: 0.05, lift: 0.18 },
      motes: { kind: 'motes', colour: '#f2d495', opacity: 1, size: 0.36, twinkle: 0.65 },
    },
  },
};

/** The variant this page loaded with (set on <html data-atmo> by index.html). */
export function currentAtmo(): AtmoVariant {
  const value = document.documentElement.dataset.atmo;
  return value === 'a' || value === 'b' || value === 'c' ? value : 'current';
}
