import { DataTexture, LinearFilter, RepeatWrapping, RGBAFormat, UnsignedByteType } from 'three';

import { seeded } from './fallGeometry';

/*
 * Value noise read from a small table instead of computed by hashing: the
 * earth of the hole (its shape in the vertex shader, its surface in the
 * fragment shaders) calls noise dozens of times, and hashed noise, inlined at
 * every call, made those shaders take seconds to compile on some drivers. A
 * table lookup is one texture fetch.
 *
 * The table is 256 x 256 random bytes (seeded, so it is the same every visit).
 * A 3D lattice point (x, y, z) reads the table at (x + 37 z, y + 17 z): the red
 * channel holds layer z and the green channel the same table shifted by
 * (37, 17), layer z + 1, so one bilinear fetch at the smoothed fraction gives
 * both layers, mixed by the fraction along z. The same lookup is written in
 * TypeScript (tnoise3) for the roots and stones placed on the wall.
 */

const SIZE = 256;
const table = new Uint8Array(SIZE * SIZE);
{
  const random = seeded(52361);
  for (let i = 0; i < table.length; i++) table[i] = Math.floor(random() * 256);
}

const at = (x: number, y: number): number => table[(y & (SIZE - 1)) * SIZE + (x & (SIZE - 1))] ?? 0;

/** The table as an RGBA texture, filtered linearly and repeated. */
export function createNoiseTexture(): DataTexture {
  const data = new Uint8Array(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4;
      data[i] = at(x, y);
      data[i + 1] = at(x + 37, y + 17);
      data[i + 3] = 255;
    }
  }
  const texture = new DataTexture(data, SIZE, SIZE, RGBAFormat, UnsignedByteType);
  texture.wrapS = texture.wrapT = RepeatWrapping;
  texture.magFilter = texture.minFilter = LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

const smooth = (f: number): number => f * f * (3 - 2 * f);

function bilinear(u: number, v: number, dx: number, dy: number): number {
  const x = Math.floor(u);
  const y = Math.floor(v);
  const fx = u - x;
  const fy = v - y;
  const a = at(x + dx, y + dy);
  const b = at(x + 1 + dx, y + dy);
  const c = at(x + dx, y + 1 + dy);
  const d = at(x + 1 + dx, y + 1 + dy);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/** Value noise in 0..1, the same as tnoise3() in TNOISE_GLSL. */
export function tnoise3(x: number, y: number, z: number): number {
  const iz = Math.floor(z);
  const fz = smooth(z - iz);
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const u = ix + 37 * iz + smooth(x - ix);
  const v = iy + 17 * iz + smooth(y - iy);
  const r = bilinear(u, v, 0, 0);
  const g = bilinear(u, v, 37, 17);
  return (r + (g - r) * fz) / 255;
}

/** Four octaves of tnoise3, as tfbm3() in TNOISE_GLSL. */
export function tfbm3(x: number, y: number, z: number): number {
  let v = 0;
  let a = 0.5;
  for (let i = 0; i < 4; i++) {
    v += a * tnoise3(x, y, z);
    x = x * 2.03 + 1.7;
    y = y * 2.03 + 9.2;
    z = z * 2.03 + 3.1;
    a *= 0.5;
  }
  return v / 0.9375;
}

/** The same noise in GLSL. Needs `uniform sampler2D uNoise` (the texture above). */
export const TNOISE_GLSL = /* glsl */ `
  uniform sampler2D uNoise;
  float tnoise3(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    vec2 uv = i.xy + vec2(37.0, 17.0) * i.z + f.xy;
    vec2 rg = texture2D(uNoise, (uv + 0.5) / ${SIZE.toFixed(1)}).rg;
    return mix(rg.r, rg.g, f.z);
  }
  float tfbm3(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * tnoise3(p);
      p = p * 2.03 + vec3(1.7, 9.2, 3.1);
      a *= 0.5;
    }
    return v / 0.9375;
  }
`;
