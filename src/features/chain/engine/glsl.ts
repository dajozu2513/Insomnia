import { Color } from 'three';

import { SHAFT_Z } from './constants';
import { rawColor } from './rawColor';

/*
 * GLSL shared by the fall's procedural materials (walls, roots, stones, the
 * ground and grass at the edge). No image textures anywhere: everything is noise.
 *
 * Colours are written as they show (rawColor), like the atmosphere shaders.
 * three.js hands the fog colour to shaders already in the output colour space
 * (as it does the clear colour), so far walls dissolve into exactly the clear
 * colour.
 */

export const NOISE_GLSL = /* glsl */ `
  float hash3(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise3(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash3(i), hash3(i + vec3(1.0, 0.0, 0.0)), f.x),
          mix(hash3(i + vec3(0.0, 1.0, 0.0)), hash3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
      mix(mix(hash3(i + vec3(0.0, 0.0, 1.0)), hash3(i + vec3(1.0, 0.0, 1.0)), f.x),
          mix(hash3(i + vec3(0.0, 1.0, 1.0)), hash3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
      f.z);
  }
  float fbm3(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * noise3(p);
      p = p * 2.03 + vec3(1.7, 9.2, 3.1);
      a *= 0.5;
    }
    return v / 0.9375;
  }
`;

const AXIS_Z = SHAFT_Z.toFixed(1);

/**
 * Light and fog of the fall.
 *
 * holeLight(), inside the hole and at its edge: the only real light is the
 * cool, pale dusk entering through the mouth, grazing down the walls (faces
 * turned up towards the mouth, the tops of ledges and outcrops, catch it; the
 * sheer wall only skims it) and falling off into darkness with depth as the
 * mouth shrinks overhead. A faint neutral presence around the viewer keeps the
 * walls rushing past readable. No rose: the rose stays far below, a small
 * distant light seen down the hole.
 *
 * mistLight(), the walls once they have widened into the misty shaft (the bands
 * look across them): the step 11 light, dusk from the mouth and the rose glow
 * rising from below, kept as it was so nothing outside the hole changes.
 *
 * The fog goes towards the clear colour; the rose tints it only where the walls
 * have widened into the shaft, never in the hole.
 */
export const HOLE_LIGHT_GLSL = /* glsl */ `
  uniform vec3 uSky;
  uniform vec3 uMistSky;
  uniform vec3 uRose;
  uniform vec3 fogColor;
  uniform float fogNear;
  uniform float fogFar;

  vec3 holeLight(vec3 N, vec3 P) {
    float depth = max(-P.y, 0.0);
    vec3 toMouth = normalize(vec3(0.0, 1.5, ${AXIS_Z}) - P);
    vec3 L = normalize(mix(vec3(0.0, 1.0, 0.0), toMouth, smoothstep(0.0, 2.0, depth)));
    float aperture = 1.0 / (1.0 + depth * depth / 81.0);
    float graze = max(dot(N, L), 0.0);
    vec3 sky = uSky * aperture * (0.16 + 0.84 * graze);
    vec3 bounce = vec3(0.05, 0.047, 0.043) * aperture;
    vec3 near = vec3(0.3) * exp(-distance(P, cameraPosition) / 6.0);
    return sky + bounce + near + vec3(0.02);
  }

  vec3 mistLight(vec3 N, vec3 P) {
    float mouth = smoothstep(-26.0, 1.0, P.y);
    float sky = mouth * (0.35 + 0.65 * max(N.y, 0.0));
    float deep = 1.0 - smoothstep(-40.0, -3.0, P.y);
    float rose = deep * (0.55 + 0.45 * max(-N.y, 0.0));
    float near = exp(-distance(P, cameraPosition) / 7.0);
    return uMistSky * sky + uRose * rose + vec3(0.2, 0.18, 0.2) * near + vec3(0.03);
  }

  /** 0 in the hole, 1 where the walls have widened into the misty shaft. */
  float shaftness(vec3 P) {
    return smoothstep(7.0, 20.0, length(vec2(P.x, P.z - ${AXIS_Z})));
  }

  vec3 fogTint(vec3 P) {
    vec3 fogScreen = fogColor;
    vec3 deepRose = uRose * 0.22 + fogScreen;
    return mix(fogScreen, deepRose, (1.0 - smoothstep(-45.0, -6.0, P.y)) * shaftness(P));
  }

  vec3 holeFog(vec3 colour, vec3 P) {
    float f = smoothstep(fogNear, fogFar, distance(P, cameraPosition));
    return mix(colour, fogTint(P), f);
  }

  float fogAmount(vec3 P) {
    return smoothstep(fogNear, fogFar, distance(P, cameraPosition));
  }

  /** A normal tilted by the slope of a height h along the surface (bump mapping from derivatives). */
  vec3 bumped(vec3 N, vec3 P, float h, float strength) {
    vec3 dpdx = dFdx(P);
    vec3 dpdy = dFdy(P);
    vec3 r1 = cross(dpdy, N);
    vec3 r2 = cross(N, dpdx);
    float det = dot(dpdx, r1);
    vec3 grad = sign(det) * (dFdx(h) * r1 + dFdy(h) * r2) * strength;
    return normalize(abs(det) * N - grad);
  }
`;

/** Dusk light through the mouth of the hole: cool and pale, grazing down the walls. */
export const SKY_LIGHT: Color = rawColor('#a9b2c6').multiplyScalar(0.55);
/** The step 11 dusk light, kept for the walls once they open into the shaft. */
export const MIST_SKY_LIGHT: Color = rawColor('#2c2a3c');
/** The rose glow from far below (the shaft's walls and fog only, never the hole). */
export const ROSE_LIGHT: Color = rawColor('#d65470').multiplyScalar(0.26);
