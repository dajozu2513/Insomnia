import { Color } from 'three';

import { rawColor } from './rawColor';

/*
 * GLSL shared by the fall's procedural materials (walls, roots, stones, the
 * ground at the edge). No image textures anywhere: everything is noise.
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

/**
 * The light inside the hole, at a point P with normal N: dusk light from the
 * mouth that dies away with depth, the rose glow rising from far below, and a
 * faint presence around the viewer so the walls rushing past are always
 * readable. Then the fog: towards the clear colour, tinted rose in the deep.
 */
export const HOLE_LIGHT_GLSL = /* glsl */ `
  uniform vec3 uSky;
  uniform vec3 uRose;
  uniform vec3 fogColor;
  uniform float fogNear;
  uniform float fogFar;

  vec3 holeLight(vec3 N, vec3 P) {
    float mouth = smoothstep(-26.0, 1.0, P.y);
    float sky = mouth * (0.35 + 0.65 * max(N.y, 0.0));
    float deep = 1.0 - smoothstep(-40.0, -3.0, P.y);
    float rose = deep * (0.55 + 0.45 * max(-N.y, 0.0));
    float near = exp(-distance(P, cameraPosition) / 7.0);
    return uSky * sky + uRose * rose + vec3(0.2, 0.18, 0.2) * near + vec3(0.03);
  }

  vec3 fogTint(vec3 P) {
    vec3 fogScreen = fogColor;
    vec3 deepRose = uRose * 0.22 + fogScreen;
    return mix(fogScreen, deepRose, 1.0 - smoothstep(-45.0, -6.0, P.y));
  }

  vec3 holeFog(vec3 colour, vec3 P) {
    float f = smoothstep(fogNear, fogFar, distance(P, cameraPosition));
    return mix(colour, fogTint(P), f);
  }

  float fogAmount(vec3 P) {
    return smoothstep(fogNear, fogFar, distance(P, cameraPosition));
  }
`;

/** Dusk light from the mouth of the hole, and the rose glow from below. */
export const SKY_LIGHT: Color = rawColor('#2c2a3c');
export const ROSE_LIGHT: Color = rawColor('#d65470').multiplyScalar(0.26);
