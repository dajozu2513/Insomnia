import {
  DoubleSide,
  FrontSide,
  ShaderMaterial,
  type Texture,
  UniformsLib,
  UniformsUtils,
} from 'three';

import { HOLE_RADIUS, SHAFT_Z } from './constants';
import { HOLE_LIGHT_GLSL, MIST_SKY_LIGHT, NOISE_GLSL, ROSE_LIGHT, SKY_LIGHT } from './glsl';
import { TNOISE_GLSL } from './tableNoise';
import { WALL_SHAPE_GLSL } from './wallShape';

/*
 * The fall's procedural materials. Inside the hole and at its edge everything
 * is dry, matte earth lit by holeLight() (the dusk through the mouth, grazing
 * down the walls) and fogged by holeFog(): no specular, no sheen, no rose.
 * The earth's noise is the table noise (tableNoise.ts: one texture fetch per
 * call, so the shaders stay small and compile quickly), shared by every
 * material through `noise`. All support instancing (instanceMatrix), so
 * roots, stones and grass can be InstancedMeshes.
 */

const AXIS_Z = SHAFT_Z.toFixed(1);

function lightUniforms(noise: Texture) {
  const uniforms = UniformsUtils.merge([
    UniformsLib.fog,
    {
      uSky: { value: SKY_LIGHT.clone() },
      uMistSky: { value: MIST_SKY_LIGHT.clone() },
      uRose: { value: ROSE_LIGHT.clone() },
    },
  ]);
  // Set after the merge, which would clone the texture (one upload per material)
  uniforms.uNoise = { value: noise };
  return uniforms;
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
 * whose vertices are pushed out to the wall's radius at their angle and height
 * (wallShape.ts: an irregular, changing cross-section with ledges, outcrops and
 * crumbled hollows in the hole; the gentle step 11 bulge in the shaft). In the
 * hole the normal comes from the shape itself (two nearby points on it), so the
 * light from the mouth catches the tops of ledges and skims the sheer wall.
 *
 * In the hole: strata of dark soil, umber loam, muted ochre clay, pale clay and
 * grey stone, tilted and of uneven thickness, under a band of dark topsoil;
 * fine grain, crumbs, small pebbles and cracks, all matte and dry. As the walls
 * widen into the shaft they turn into its mist with the step 11 look
 * (mistWall, on the hashed noise as before), so the bands are unchanged.
 */
export function createWallMaterial(noise: Texture): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: lightUniforms(noise),
    vertexShader: /* glsl */ `
      varying vec3 vP;
      varying vec3 vN;
      varying vec2 vDir;
      varying float vS;
      varying float vCrumble;
      ${NOISE_GLSL}
      ${TNOISE_GLSL}
      ${WALL_SHAPE_GLSL}
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        float a = atan(position.z, position.x);
        vec2 dir = vec2(cos(a), sin(a));
        float y = wp.y;
        float r = baseRadius(y);
        float hole = holeAmount(r);
        float fade = mouthFade(y);
        float bulge = hole < 1.0 ? mistBulge(dir, y, r) : 0.0;
        float R = r + bulge * fade;
        vec3 n = -vec3(dir.x, 0.0, dir.y);
        if (hole > 0.0) {
          R = r + mix(bulge, earthR(dir, y, r), hole) * fade;
          // The earth's own normal, from two nearby points on the same surface
          vec2 dirA = vec2(cos(a + 0.01), sin(a + 0.01));
          float yB = y + 0.02;
          float rB = baseRadius(yB);
          float Ra = r + mix(bulge, earthR(dirA, y, r), hole) * fade;
          float Rb = rB + mix(bulge, earthR(dir, yB, rB), hole) * mouthFade(yB);
          vec3 p0 = vec3(dir.x * R, y, dir.y * R);
          vec3 pa = vec3(dirA.x * Ra, y, dirA.y * Ra);
          vec3 pb = vec3(dir.x * Rb, yB, dir.y * Rb);
          vec3 shaped = normalize(cross(pb - p0, pa - p0));
          if (dot(shaped, vec3(dir.x, 0.0, dir.y)) > 0.0) shaped = -shaped;
          n = normalize(mix(n, shaped, hole));
        }
        vN = n;
        vDir = dir;
        vS = strataS(dir, y, r);
        vCrumble = crumbleAt(dir, y);
        wp.xz = vec2(dir.x * R, ${AXIS_Z} + dir.y * R);
        vP = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      varying vec3 vP;
      varying vec3 vN;
      varying vec2 vDir;
      varying float vS;
      varying float vCrumble;
      ${NOISE_GLSL}
      ${TNOISE_GLSL}
      ${HOLE_LIGHT_GLSL}
      ${WALL_SHAPE_GLSL}

      /** The step 11 wall, kept for the shaft (the bands look across it). */
      vec3 mistWall(vec3 q) {
        float s = vP.y + fbm3(q * 0.35) * 5.0;
        float layer = fract(s * 0.12);
        vec3 loam = vec3(0.13, 0.095, 0.075);
        vec3 earth = vec3(0.24, 0.17, 0.12);
        vec3 clay = vec3(0.34, 0.22, 0.15);
        vec3 rock = vec3(0.21, 0.19, 0.17);
        vec3 c = mix(loam, earth, smoothstep(0.1, 0.3, layer));
        c = mix(c, clay, smoothstep(0.45, 0.55, layer) * (1.0 - smoothstep(0.62, 0.7, layer)));
        c = mix(c, rock, smoothstep(0.84, 0.9, layer) * 0.8);
        float grain = noise3(q * vec3(9.0, 14.0, 9.0));
        c *= 0.82 + 0.3 * grain;
        float ridge = 1.0 - abs(noise3(q * vec3(2.2, 0.9, 2.2)) * 2.0 - 1.0);
        c *= 1.0 - 0.18 * smoothstep(0.95, 0.99, ridge);
        float damp = smoothstep(0.58, 0.78, fbm3(q * 0.6 + vec3(0.0, 0.0, 3.3)));
        c *= 1.0 - 0.35 * damp;
        return c * mistLight(-vec3(vDir.x, 0.0, vDir.y), vP) * 2.2 + damp * uRose * 0.08;
      }

      void main() {
        vec3 q = vec3(vP.x, vP.y, vP.z - ${AXIS_Z});

        // Fine detail fades out where a pixel covers more than a few centimetres
        float fine = 1.0 - smoothstep(0.025, 0.1, length(fwidth(q)));

        // Strata: tilted layers of uneven thickness (the coordinate comes from the shape).
        // Hard layers are lenses of stone: they come and go around the hole (the same
        // mask makes them stick out as ledges in the shape), never a full ring.
        float s2 = vS / 1.35;
        float index = floor(s2);
        float f = s2 - index;
        float hard = hardAt(normalize(q.xz), index);
        float kind = fract(index * 0.7548776 + 0.31);

        // Surface detail: grain, crumbs, small pebbles, cracks
        float grain = tnoise3(q * vec3(22.0, 30.0, 22.0));
        float speck = tnoise3(q * 38.0);
        float crumbLight = smoothstep(0.8, 0.86, speck) * fine;
        float crumbDark = (1.0 - smoothstep(0.14, 0.2, speck)) * fine;
        float pebbleNoise = tnoise3(q * vec3(9.0, 11.0, 9.0) + 3.7);
        float pebbles = smoothstep(0.78, 0.83, pebbleNoise);
        pebbles *= mix(1.0, 0.35, hard) + vCrumble * 0.6;
        // Cracks run mostly up and down, as earth splits when it dries
        float ridge = 1.0 - abs(tnoise3(q * vec3(2.6, 0.35, 2.6)) * 2.0 - 1.0);
        float crack = smoothstep(0.975, 0.995, ridge);
        float seam = 1.0 - smoothstep(0.0, 0.05, f);
        float height = (grain - 0.5) * 0.6 * fine + pebbles * 1.8 + crumbLight * 0.7
          - crumbDark * 0.5 - crack * 1.4 - seam * 0.8;
        vec3 N = bumped(normalize(vN), vP, height, 0.018);

        float dissolve = smoothstep(3.8, 14.0, length(q.xz)) * 0.86;
        float fogged = max(fogAmount(vP), dissolve);
        if (fogged > 0.985) {
          gl_FragColor = vec4(fogTint(vP), 1.0);
          return;
        }

        vec3 darkSoil = vec3(0.078, 0.07, 0.062);
        vec3 umber = vec3(0.152, 0.132, 0.11);
        vec3 ochre = vec3(0.25, 0.21, 0.162);
        vec3 paleClay = vec3(0.29, 0.268, 0.236);
        vec3 stone = vec3(0.235, 0.232, 0.225);
        vec3 c = kind < 0.3 ? darkSoil : (kind < 0.6 ? umber : (kind < 0.82 ? ochre : paleClay));
        c = mix(c, stone * (0.82 + 0.36 * kind), hard);
        // Each layer drifts lighter and darker along its length
        c *= 0.8 + 0.4 * tfbm3(q * vec3(0.9, 2.2, 0.9) + vec3(index * 1.7));
        // Crumbled hollows: looser, lighter earth
        c = mix(c, umber * 1.25, vCrumble * 0.45);
        c *= 0.86 + 0.28 * mix(0.5, grain, fine);
        c = mix(c, vec3(0.2, 0.195, 0.186) * (0.75 + 0.5 * pebbleNoise), pebbles * 0.7);
        c *= 1.0 + 0.3 * crumbLight - 0.35 * crumbDark;
        c *= 1.0 - 0.45 * crack;
        c *= 1.0 - 0.4 * seam;
        // Dark topsoil under the ground, full of fine roots, before the strata begin
        float topsoil = smoothstep(-1.8, -0.5, vP.y + (tnoise3(q * 1.3) - 0.5) * 0.8);
        c = mix(c, darkSoil * (0.9 + 0.3 * grain), topsoil);
        vec3 lit = c * holeLight(N, vP) * 1.7;

        float mist = shaftness(vP);
        if (mist > 0.001) lit = mix(lit, mistWall(q), mist);
        gl_FragColor = vec4(mix(holeFog(lit, vP), fogTint(vP), dissolve), 1.0);
      }
    `,
    side: DoubleSide,
    fog: true,
  });
}

/**
 * Roots: dry, pale, fibrous bark. Long fibres run along the root (TubeGeometry
 * uv: x along its length, y around it, sampled on a circle so it closes without
 * a seam) as furrows and ridges that catch the light from the mouth, with
 * split, flaking patches; matte, with no rim light.
 */
export function createBarkMaterial(noise: Texture): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: lightUniforms(noise),
    vertexShader: WORLD_VERTEX,
    fragmentShader: /* glsl */ `
      varying vec3 vP;
      varying vec3 vN;
      varying vec2 vUv;
      ${TNOISE_GLSL}
      ${HOLE_LIGHT_GLSL}
      void main() {
        vec2 round = vec2(cos(vUv.y * 6.2832), sin(vUv.y * 6.2832));
        float fibre = tnoise3(vec3(vUv.x * 3.0, round * 7.0));
        float strand = tnoise3(vec3(vUv.x * 9.0, round * 17.5 + 4.0));
        float split = smoothstep(0.7, 0.84, tnoise3(vec3(vUv.x * 7.0, round * 1.4 + 9.0)));
        float furrow = 1.0 - smoothstep(0.0, 0.16, abs(fibre - 0.5));
        vec3 N = bumped(normalize(vN), vP, fibre * 0.8 + strand * 0.5 - split * 0.8 - furrow, 0.02);
        vec3 dark = vec3(0.1, 0.092, 0.082);
        vec3 pale = vec3(0.34, 0.315, 0.28);
        vec3 c = mix(dark, pale, 0.25 + 0.55 * fibre * (0.6 + 0.4 * strand));
        c *= 1.0 - 0.45 * furrow;
        c = mix(c, vec3(0.38, 0.35, 0.31), split * 0.5);
        vec3 lit = c * holeLight(N, vP) * 1.8;
        gl_FragColor = vec4(holeFog(lit, vP), 1.0);
      }
    `,
    side: FrontSide,
    fog: true,
  });
}

/** Stones in the walls and on the ground: grey, speckled, matte. */
export function createStoneMaterial(noise: Texture): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: lightUniforms(noise),
    vertexShader: WORLD_VERTEX,
    fragmentShader: /* glsl */ `
      varying vec3 vP;
      varying vec3 vN;
      ${TNOISE_GLSL}
      ${HOLE_LIGHT_GLSL}
      void main() {
        float n = tnoise3(vP * 6.0);
        float speck = tnoise3(vP * 41.0);
        vec3 N = bumped(normalize(vN), vP, n * 0.6 + speck * 0.3, 0.02);
        vec3 c = mix(vec3(0.19, 0.186, 0.18), vec3(0.37, 0.358, 0.34), n);
        c *= 0.85 + 0.3 * speck;
        vec3 lit = c * holeLight(N, vP) * 1.8;
        gl_FragColor = vec4(holeFog(lit, vP), 1.0);
      }
    `,
    fog: true,
  });
}

/**
 * The ground at the edge of the hole: dry soil with crumbs and small stones,
 * a little moss away from the lip, darker where it breaks over into the hole.
 * Lit by the dusk sky above; no rose on it.
 */
export function createGroundMaterial(noise: Texture): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: lightUniforms(noise),
    vertexShader: WORLD_VERTEX,
    fragmentShader: /* glsl */ `
      varying vec3 vP;
      ${TNOISE_GLSL}
      ${HOLE_LIGHT_GLSL}
      void main() {
        vec3 q = vec3(vP.x, 0.0, vP.z - ${AXIS_Z});
        float d = length(q.xz) - ${HOLE_RADIUS.toFixed(2)};
        float fine = 1.0 - smoothstep(0.02, 0.09, length(fwidth(vP)));
        float n = tfbm3(q * 0.9);
        float grain = tnoise3(vP * 26.0);
        float speck = tnoise3(vP * 34.0);
        float pebbleNoise = tnoise3(vP * 9.0 + 1.3);
        float pebbles = smoothstep(0.8, 0.85, pebbleNoise);
        float crumbs = smoothstep(0.8, 0.86, speck) * fine;
        float height = (grain - 0.5) * 0.6 * fine + pebbles * 1.6 + crumbs * 0.6;
        vec3 N = bumped(vec3(0.0, 1.0, 0.0), vP, height, 0.02);
        vec3 c = mix(vec3(0.1, 0.088, 0.075), vec3(0.19, 0.168, 0.145), n);
        float moss = smoothstep(0.52, 0.72, tfbm3(q * 0.55 + vec3(4.0, 0.0, 1.0)));
        moss *= smoothstep(0.4, 1.6, d);
        c = mix(c, vec3(0.11, 0.13, 0.085), moss * 0.8);
        c *= 0.86 + 0.28 * mix(0.5, grain, fine);
        c = mix(c, vec3(0.2, 0.193, 0.182) * (0.75 + 0.5 * pebbleNoise), pebbles * 0.7);
        c *= 1.0 + 0.3 * crumbs - 0.35 * (1.0 - smoothstep(0.14, 0.2, speck)) * fine;
        // Darker at the lip, where the soil breaks over into the hole
        c *= mix(0.45, 1.0, smoothstep(0.0, 0.9, d));
        vec3 lit = c * holeLight(N, vP) * 2.3;
        gl_FragColor = vec4(holeFog(lit, vP), 1.0);
      }
    `,
    fog: true,
  });
}

/**
 * Grass at the edge: thin dry blades in tufts (instanced), dark at the root,
 * pale olive grey at the tip (uv.y from root to tip), each tuft a little
 * different. Lit like the ground, from the sky above.
 */
export function createGrassMaterial(noise: Texture): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: lightUniforms(noise),
    vertexShader: WORLD_VERTEX,
    fragmentShader: /* glsl */ `
      varying vec3 vP;
      varying vec2 vUv;
      ${TNOISE_GLSL}
      ${HOLE_LIGHT_GLSL}
      void main() {
        float tuft = tnoise3(floor(vP * 3.0) + 0.5);
        vec3 root = vec3(0.07, 0.072, 0.056);
        vec3 tip = mix(vec3(0.21, 0.215, 0.16), vec3(0.25, 0.235, 0.18), tuft);
        vec3 c = mix(root, tip, smoothstep(0.0, 1.0, vUv.y));
        vec3 lit = c * holeLight(vec3(0.0, 1.0, 0.0), vP) * 2.2;
        gl_FragColor = vec4(holeFog(lit, vP), 1.0);
      }
    `,
    side: DoubleSide,
    fog: true,
  });
}
