import { HOLE_RADIUS, SHAFT_RADIUS, WIDEN_FROM, WIDEN_TO } from './constants';
import { tfbm3, tnoise3 } from './tableNoise';

/*
 * The shape of the hole's wall, written twice from one formula: in GLSL for
 * the wall's vertex shader, and in TypeScript so roots and stones sit on the
 * wall the visitor sees (an irregular wall would leave them floating or buried).
 *
 * In the hole the wall is earth (step 16.5): an irregular cross-section that
 * changes with depth, bumps, hard layers of rock that stick out as ledges and
 * outcrops, and crumbled hollows, all from the table noise (tableNoise.ts,
 * mirrored exactly in TypeScript). Once it widens into the misty shaft it keeps
 * the step 11 bulge, from the hashed noise of glsl.ts (NOISE_GLSL, mirrored
 * below to within the GPU's float precision), so the bands look across exactly
 * the same mist as before.
 */

const fract = (x: number): number => x - Math.floor(x);
const smoothstep = (a: number, b: number, x: number): number => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1);
  return t * t * (3 - 2 * t);
};
const mix = (a: number, b: number, t: number): number => a + (b - a) * t;

/* NOISE_GLSL in TypeScript, for the shaft's bulge only. */
function hash3(x: number, y: number, z: number): number {
  const px = fract(x * 0.3183099 + 0.1) * 17;
  const py = fract(y * 0.3183099 + 0.1) * 17;
  const pz = fract(z * 0.3183099 + 0.1) * 17;
  return fract(px * py * pz * (px + py + pz));
}
function noise3(x: number, y: number, z: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const iz = Math.floor(z);
  const fx = (x - ix) * (x - ix) * (3 - 2 * (x - ix));
  const fy = (y - iy) * (y - iy) * (3 - 2 * (y - iy));
  const fz = (z - iz) * (z - iz) * (3 - 2 * (z - iz));
  return mix(
    mix(
      mix(hash3(ix, iy, iz), hash3(ix + 1, iy, iz), fx),
      mix(hash3(ix, iy + 1, iz), hash3(ix + 1, iy + 1, iz), fx),
      fy,
    ),
    mix(
      mix(hash3(ix, iy, iz + 1), hash3(ix + 1, iy, iz + 1), fx),
      mix(hash3(ix, iy + 1, iz + 1), hash3(ix + 1, iy + 1, iz + 1), fx),
      fy,
    ),
    fz,
  );
}
function fbm3(x: number, y: number, z: number): number {
  let v = 0;
  let a = 0.5;
  for (let i = 0; i < 4; i++) {
    v += a * noise3(x, y, z);
    x = x * 2.03 + 1.7;
    y = y * 2.03 + 9.2;
    z = z * 2.03 + 3.1;
    a *= 0.5;
  }
  return v / 0.9375;
}

/** Height of the layer boundaries along the strata coordinate. */
const LAYER = 1.35;

/** The radius of the hole at a height, before the wall's own shape (entrance.ts shaftRadius). */
function baseRadius(y: number): number {
  const k = 1 - smoothstep(WIDEN_TO, WIDEN_FROM, y);
  return mix(HOLE_RADIUS, SHAFT_RADIUS, k * k);
}

/**
 * The strata coordinate at direction (dx, dz) and height y: the layers tilt
 * (higher on one side of the hole) and waver, and their thickness changes from
 * layer to layer.
 */
function strata(dx: number, dz: number, y: number, r: number): number {
  const s = y + 0.3 * dx * r + 0.12 * dz * r + (tfbm3(dx * 0.8, dz * 0.8, y * 0.05) - 0.5) * 2;
  return s + 1.4 * Math.sin(s * 0.37) + 0.8 * Math.sin(s * 0.91 + 1.3);
}

/** 0..1 per layer: above 0.62 the layer is hard rock (where its mask lets it, it sticks out as a ledge). */
const layerHash = (index: number): number => fract(index * 0.6180339 + 0.137);

/** The earth's offset from the base radius (in the hole). */
function earth(dx: number, dz: number, y: number, r: number): number {
  const section = (tfbm3(dx * 1.1, dz * 1.1, y * 0.09 + 5) - 0.5) * 1.3;
  const bumps = (tfbm3(dx * 3.2 + 2, dz * 3.2 + 2, y * 0.6 + 2) - 0.5) * 0.45;
  const s2 = strata(dx, dz, y, r) / LAYER;
  const index = Math.floor(s2);
  const f = s2 - index;
  const hard =
    (layerHash(index) > 0.62 ? 1 : 0) * smoothstep(0.35, 0.6, tnoise3(dx * 2, dz * 2, index * 3.1));
  const ledge = hard * smoothstep(0, 0.08, f) * (1 - smoothstep(0.85, 1, f)) * 0.45;
  const crumble = smoothstep(0.6, 0.72, tfbm3(dx * 2.3, dz * 2.3, y * 0.22 + 17));
  const rough = (tnoise3(dx * 9, dz * 9, y * 2.5) - 0.5) * 0.15 * crumble;
  return section + bumps - ledge + crumble * 0.4 + rough;
}

/** The wall's distance from the axis at angle `a` (radians, from +x towards +z) and height y. */
export function wallRadius(a: number, y: number): number {
  const dx = Math.cos(a);
  const dz = Math.sin(a);
  const r = baseRadius(y);
  const mistBulge = (fbm3(dx * 1.6, dz * 1.6, y * 0.32) - 0.5) * r * 0.32;
  const hole = 1 - smoothstep(3.8, 9.0, r);
  const offset = hole > 0 ? mix(mistBulge, earth(dx, dz, y, r), hole) : mistBulge;
  return r + offset * (1 - smoothstep(-0.9, 0, y));
}

/**
 * The same shape in GLSL (needs NOISE_GLSL and TNOISE_GLSL before it):
 * `baseRadius(y)`, `holeAmount(r)`, `mouthFade(y)`, `mistBulge(dir, y, r)`,
 * `strataS(dir, y, r)`, `hardAt(dir, index)`, `crumbleAt(dir, y)` and
 * `earthR(dir, y, r)`. The wall's radius is
 * r + mix(mistBulge, earthR, holeAmount) * mouthFade.
 */
export const WALL_SHAPE_GLSL = /* glsl */ `
  float baseRadius(float y) {
    float k = 1.0 - smoothstep(${WIDEN_TO.toFixed(1)}, ${WIDEN_FROM.toFixed(1)}, y);
    return mix(${HOLE_RADIUS.toFixed(3)}, ${SHAFT_RADIUS.toFixed(1)}, k * k);
  }
  float holeAmount(float r) {
    return 1.0 - smoothstep(3.8, 9.0, r);
  }
  float mouthFade(float y) {
    return 1.0 - smoothstep(-0.9, 0.0, y);
  }
  float mistBulge(vec2 dir, float y, float r) {
    return (fbm3(vec3(dir * 1.6, y * 0.32)) - 0.5) * r * 0.32;
  }
  float layerHash(float index) {
    return fract(index * 0.6180339 + 0.137);
  }
  float strataS(vec2 dir, float y, float r) {
    float s = y + 0.3 * dir.x * r + 0.12 * dir.y * r
      + (tfbm3(vec3(dir * 0.8, y * 0.05)) - 0.5) * 2.0;
    return s + 1.4 * sin(s * 0.37) + 0.8 * sin(s * 0.91 + 1.3);
  }
  float hardAt(vec2 dir, float index) {
    return step(0.62, layerHash(index)) * smoothstep(0.35, 0.6, tnoise3(vec3(dir * 2.0, index * 3.1)));
  }
  float crumbleAt(vec2 dir, float y) {
    return smoothstep(0.6, 0.72, tfbm3(vec3(dir * 2.3, y * 0.22 + 17.0)));
  }
  float earthR(vec2 dir, float y, float r) {
    float section = (tfbm3(vec3(dir * 1.1, y * 0.09 + 5.0)) - 0.5) * 1.3;
    float bumps = (tfbm3(vec3(dir * 3.2 + 2.0, y * 0.6 + 2.0)) - 0.5) * 0.45;
    float s2 = strataS(dir, y, r) / ${LAYER.toFixed(2)};
    float index = floor(s2);
    float f = s2 - index;
    float ledge = hardAt(dir, index) * smoothstep(0.0, 0.08, f) * (1.0 - smoothstep(0.85, 1.0, f)) * 0.45;
    float crumble = crumbleAt(dir, y);
    float rough = (tnoise3(vec3(dir * 9.0, y * 2.5)) - 0.5) * 0.15 * crumble;
    return section + bumps - ledge + crumble * 0.4 + rough;
  }
`;
