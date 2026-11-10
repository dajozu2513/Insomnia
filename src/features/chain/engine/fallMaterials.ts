import { DoubleSide, FrontSide, ShaderMaterial, UniformsLib, UniformsUtils } from 'three';

import { HOLE_RADIUS, SHAFT_RADIUS, SHAFT_Z, WIDEN_FROM, WIDEN_TO } from './constants';
import { HOLE_LIGHT_GLSL, NOISE_GLSL, ROSE_LIGHT, SKY_LIGHT } from './glsl';

/*
 * The fall's procedural materials. Each is lit by holeLight() (dusk from the
 * mouth, rose from below) and fogged by holeFog(). All support instancing
 * (instanceMatrix), so roots and stones can be InstancedMeshes.
 */

function lightUniforms() {
  return UniformsUtils.merge([
    UniformsLib.fog,
    { uSky: { value: SKY_LIGHT.clone() }, uRose: { value: ROSE_LIGHT.clone() } },
  ]);
}

const WORLD_VERTEX = /* glsl */ `
  varying vec3 vP;
  varying vec3 vN;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    mat4 m = modelMatrix;
    #ifdef USE_INSTANCING
      m = m * instanceMatrix;
    #endif
    vec4 wp = m * vec4(position, 1.0);
    vP = wp.xyz;
    vN = normalize(mat3(m) * normal);
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

/**
 * The walls of the hole and the shaft: an open cylinder segment of radius 1
 * whose vertices are pushed out to the hole's radius at their height (narrow,
 * widening into the shaft) plus a little noise, so the walls are irregular
 * and seamless from segment to segment. Earth and rock in strata, cracks and
 * damp patches, all from layered noise in world space.
 */
export function createWallMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: UniformsUtils.merge([
      lightUniforms(),
      {
        uAxisZ: { value: SHAFT_Z },
        uHoleR: { value: HOLE_RADIUS },
        uShaftR: { value: SHAFT_RADIUS },
        uWidenFrom: { value: WIDEN_FROM },
        uWidenTo: { value: WIDEN_TO },
      },
    ]),
    vertexShader: /* glsl */ `
      uniform float uAxisZ;
      uniform float uHoleR;
      uniform float uShaftR;
      uniform float uWidenFrom;
      uniform float uWidenTo;
      varying vec3 vP;
      varying vec3 vN;
      ${NOISE_GLSL}
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        float a = atan(position.z, position.x);
        vec2 dir = vec2(cos(a), sin(a));
        float k = 1.0 - smoothstep(uWidenTo, uWidenFrom, wp.y);
        float r = mix(uHoleR, uShaftR, k * k);
        // Bulges and hollows, fading out at the mouth so the rim meets the ground
        float bulge = (fbm3(vec3(dir * 1.6, wp.y * 0.32)) - 0.5) * r * 0.32;
        bulge *= 1.0 - smoothstep(-0.9, 0.0, wp.y);
        float R = r + bulge;
        wp.xz = vec2(dir.x * R, uAxisZ + dir.y * R);
        vP = wp.xyz;
        vN = -vec3(dir.x, 0.0, dir.y);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vP;
      varying vec3 vN;
      ${NOISE_GLSL}
      ${HOLE_LIGHT_GLSL}
      void main() {
        vec3 q = vec3(vP.x, vP.y, vP.z - ${SHAFT_Z.toFixed(1)});
        // As the walls widen into the shaft they dissolve into its mist
        float dissolve = smoothstep(3.8, 14.0, length(q.xz)) * 0.86;
        float fogged = max(fogAmount(vP), dissolve);
        if (fogged > 0.985) {
          gl_FragColor = vec4(fogTint(vP), 1.0);
          return;
        }
        // Strata: bands of earth, clay and rock, wavering along the wall
        float s = vP.y + fbm3(q * 0.35) * 5.0;
        float layer = fract(s * 0.12);
        vec3 loam = vec3(0.13, 0.095, 0.075);
        vec3 earth = vec3(0.24, 0.17, 0.12);
        vec3 clay = vec3(0.34, 0.22, 0.15);
        vec3 rock = vec3(0.21, 0.19, 0.17);
        vec3 c = mix(loam, earth, smoothstep(0.1, 0.3, layer));
        c = mix(c, clay, smoothstep(0.45, 0.55, layer) * (1.0 - smoothstep(0.62, 0.7, layer)));
        c = mix(c, rock, smoothstep(0.84, 0.9, layer) * 0.8);
        // Grain and small pebbles in the earth
        float grain = noise3(q * vec3(9.0, 14.0, 9.0));
        c *= 0.82 + 0.3 * grain;
        // Cracks: thin dark ridges
        float ridge = 1.0 - abs(noise3(q * vec3(2.2, 0.9, 2.2)) * 2.0 - 1.0);
        c *= 1.0 - 0.18 * smoothstep(0.95, 0.99, ridge);
        // Damp patches: darker, with a faint rose sheen
        float damp = smoothstep(0.58, 0.78, fbm3(q * 0.6 + vec3(0.0, 0.0, 3.3)));
        c *= 1.0 - 0.35 * damp;
        vec3 lit = c * holeLight(vN, vP) * 2.2 + damp * uRose * 0.08;
        gl_FragColor = vec4(mix(holeFog(lit, vP), fogTint(vP), dissolve), 1.0);
      }
    `,
    side: DoubleSide,
    fog: true,
  });
}

/**
 * Roots: dark bark in long grooves along the root (TubeGeometry uv: x along
 * its length, y around it), rim-lit by the rose glow.
 */
export function createBarkMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: UniformsUtils.merge([lightUniforms(), { uRim: { value: 1.0 } }]),
    vertexShader: WORLD_VERTEX,
    fragmentShader: /* glsl */ `
      uniform float uRim;
      varying vec3 vP;
      varying vec3 vN;
      varying vec2 vUv;
      ${NOISE_GLSL}
      ${HOLE_LIGHT_GLSL}
      void main() {
        vec3 N = normalize(vN);
        vec3 V = normalize(cameraPosition - vP);
        float n = fbm3(vec3(vUv.x * 18.0, vUv.y * 5.0, 0.0));
        float grooves = abs(sin(vUv.y * 6.2832 * 6.0 + n * 9.0 + vUv.x * 4.0));
        vec3 dark = vec3(0.1, 0.07, 0.05);
        vec3 light = vec3(0.32, 0.23, 0.16);
        vec3 c = mix(dark, light, (0.25 + 0.75 * smoothstep(0.5, 1.0, grooves)) * (0.45 + 0.55 * n));
        float knot = smoothstep(0.78, 0.9, noise3(vec3(vUv.x * 30.0, vUv.y * 3.0, 7.0)));
        c *= 1.0 - 0.5 * knot;
        float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
        vec3 lit = c * holeLight(N, vP) * 2.6 + uRose * rim * uRim * 0.7;
        gl_FragColor = vec4(holeFog(lit, vP), 1.0);
      }
    `,
    side: FrontSide,
    fog: true,
  });
}

/** Stones embedded in the walls: grey-brown, a little speckled. */
export function createStoneMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: lightUniforms(),
    vertexShader: WORLD_VERTEX,
    fragmentShader: /* glsl */ `
      varying vec3 vP;
      varying vec3 vN;
      ${NOISE_GLSL}
      ${HOLE_LIGHT_GLSL}
      void main() {
        vec3 N = normalize(vN);
        vec3 V = normalize(cameraPosition - vP);
        float n = noise3(vP * 6.0);
        vec3 c = mix(vec3(0.22, 0.21, 0.2), vec3(0.42, 0.39, 0.36), n);
        float rim = pow(1.0 - max(dot(N, V), 0.0), 3.0);
        vec3 lit = c * holeLight(N, vP) * 2.2 + uRose * rim * 0.5;
        gl_FragColor = vec4(holeFog(lit, vP), 1.0);
      }
    `,
    fog: true,
  });
}

/**
 * The ground at the edge of the hole: earth with a little moss, darker
 * towards the rim, with the faint rose light rising out of the hole on it.
 */
export function createGroundMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: UniformsUtils.merge([lightUniforms(), { uHoleR: { value: HOLE_RADIUS } }]),
    vertexShader: WORLD_VERTEX,
    fragmentShader: /* glsl */ `
      uniform float uHoleR;
      varying vec3 vP;
      ${NOISE_GLSL}
      ${HOLE_LIGHT_GLSL}
      void main() {
        vec3 q = vec3(vP.x, 0.0, vP.z - ${SHAFT_Z.toFixed(1)});
        float d = length(q.xz) - uHoleR;
        float n = fbm3(q * 0.9);
        vec3 c = mix(vec3(0.13, 0.1, 0.075), vec3(0.22, 0.165, 0.12), n);
        float moss = smoothstep(0.52, 0.72, fbm3(q * 0.55 + vec3(4.0, 0.0, 1.0)));
        moss *= smoothstep(0.4, 1.6, d);
        c = mix(c, vec3(0.13, 0.17, 0.09), moss * 0.85);
        c *= 0.85 + 0.3 * noise3(q * 12.0);
        // Darker at the lip, and the rose light rising out of the hole
        c *= mix(0.45, 1.0, smoothstep(0.0, 0.9, d));
        vec3 lit = c * holeLight(vec3(0.0, 1.0, 0.0), vP) * 2.0;
        lit += uRose * 0.12 * (1.0 - smoothstep(0.0, 1.4, d));
        gl_FragColor = vec4(holeFog(lit, vP), 1.0);
      }
    `,
    fog: true,
  });
}
