/*
 * Every number that shapes the chain's look and motion, ported unchanged from
 * the legacy js/chain3d.js. Change a value only on purpose and say why: the
 * owner tuned these by eye against the product photos.
 */

// ── CAMERA ──
// The camera always looks straight down -z from DIST; only its x/y move.
export const DIST = 20;
export const CAMERA_FOV = 32;
export const CAMERA_NEAR = 0.1;
export const CAMERA_FAR = 100;

// ── RENDERER ──
/** Pixel ratio cap: sharp enough on retina screens, cheap enough for phones. */
export const MAX_PIXEL_RATIO = 1.5;
export const TONE_MAPPING_EXPOSURE = 1.15;

// ── FOG ──
// Links far behind the necklace fade into the page's ink colour.
export const FOG_COLOR = 0x0e0e0d;
export const FOG_NEAR = DIST - 8;
export const FOG_FAR = DIST + 16;

// ── LIGHTING ──
/** Blur (sigma) used when baking the studio into the environment map. */
export const ENV_BLUR = 0.02;
/** Room colour of the studio box: dark, so the steel reads silver, not white. */
export const STUDIO_ROOM_COLOR = 0x3a3a3a;
export const STUDIO_ROOM_SIZE = 24;
/**
 * Light panels of the studio: [width, height, x, y, z, intensity]. Each faces
 * the origin. Intensities above 1 act as bright HDR lights.
 */
export const STUDIO_PANELS: readonly (readonly [number, number, number, number, number, number])[] =
  [
    [16, 1.4, 0, 9, 3, 7], // long strip overhead: the main highlight
    [1.2, 14, -9, 1, 4, 4.5], // tall strip at the left
    [1.0, 12, 9, -1, -3, 2.2], // dimmer strip at the right, behind
    [18, 11, 1, 2, 11, 1.3], // big soft box in front: faces toward the camera read light silver
    [14, 14, 0, -10, 0, 0.6], // faint bounce from below, like the white paper
  ];
/** A small, sharp key adds the pin-point glints real steel shows. */
export const KEY_LIGHT_COLOR = 0xffffff;
export const KEY_LIGHT_INTENSITY = 0.8;
export const KEY_LIGHT_POSITION = [-3, 7, 9] as const;

// ── LINK GEOMETRY ──
// A chain link is a tube swept along a "stadium": two straights joined by half circles.
export const LINK_STRAIGHT = 0.55;
export const LINK_RADIUS = 0.34;
export const WIRE = 0.13;
export const LINK_TUBULAR_SEGMENTS = 64;
export const LINK_RADIAL_SEGMENTS = 12;

// ── MATERIAL ──
export const STEEL_COLOR = 0xc4c7ca; // a touch cool, like stainless steel
export const STEEL_METALNESS = 1;
export const STEEL_ROUGHNESS = 0.26;
export const STEEL_ENV_MAP_INTENSITY = 1;

// ── CHAIN ──
/** Distance between link centres when neighbouring wires touch. */
export const PITCH = 2 * (LINK_STRAIGHT / 2 + LINK_RADIUS) - 2.2 * WIRE;
export const MAX_LINKS = 600;
/** Samples of the path's Frenet frames; links snap to the nearest one. */
export const FRAME_SAMPLES = 2048;

// ── MOTION ──
/** The chain scrolls slower than the page (1 with reduced motion: no parallax). */
export const PARALLAX = 0.75;
/** s: camera covers ~63% of a scroll jump in this time. */
export const SCROLL_EASE = 0.6;
/** Links travel this fraction of the scrolled distance along the chain. */
export const PULL = 0.35;
/** s: how quickly a pull takes hold. */
export const PULL_GRIP = 0.08;
/** s: how long the chain keeps sliding after the pull stops. */
export const PULL_COAST = 0.5;
/** World units/s the chain creeps on its own. */
export const DRIFT = 0.22;
/** Longest frame step in seconds, so a stalled tab does not jump. */
export const MAX_FRAME_DT = 0.05;

// ── LAYOUT ──
/** Body resizes are coalesced for this long before the path is rebuilt. */
export const RESIZE_DEBOUNCE_MS = 120;

// ── ATMOSPHERE (step 4) ──
// docs/brand/design-direction.md, "Atmosphere" and "The night cycle". Every
// value here is subordinate to one rule: the chain must read as silver steel.

/** Chessboard floor under the hero necklace: plane size (world units). */
export const FLOOR_WIDTH = 140;
export const FLOOR_DEPTH = 110;
/** World size of one chessboard square. */
export const FLOOR_SQUARE = 1.8;
/** Floor height as a fraction of the viewport's world height below the centre: tall screens lower. */
export const FLOOR_DROP_PORTRAIT = 0.66;
export const FLOOR_DROP_WIDE = 0.54;
/** Square colours: muted ink and dimmed bone, far below the steel's contrast. */
export const FLOOR_DARK = '#0f0e11';
export const FLOOR_LIGHT = '#3e3a35';

/** Floating dust: count on large and small screens. */
export const PARTICLES_DESKTOP = 120;
export const PARTICLES_SMALL = 60;
/** Viewport width (CSS px) at or below which the small-screen budget applies. */
export const SMALL_SCREEN_MAX = 700;
/** World units/s the dust rises; plus a slow sideways sway. */
export const PARTICLE_RISE = 0.09;
export const PARTICLE_SWAY = 0.05;
export const PARTICLE_SIZE = 0.2;
export const PARTICLE_OPACITY = 0.35;
export const PARTICLE_COLOR = '#e6e0d4';

/** Rim light behind and above the chain, tinted by the night cycle. */
export const RIM_LIGHT_POSITION = [0, 6, -12] as const;

/**
 * How the chain crosses the bands. 'legacy': sags low across the first band and
 * hangs high across the second (cleared the legacy phrases). 'centred': both
 * drapes centred in their band, for the text-free bands.
 */
export const DRAPE_STYLE = 'centred' as 'legacy' | 'centred';

/**
 * Anisotropic filtering for the floor texture. The far squares sit in the fog,
 * so a modest level costs less and looks the same.
 */
export const FLOOR_ANISOTROPY = 4;
