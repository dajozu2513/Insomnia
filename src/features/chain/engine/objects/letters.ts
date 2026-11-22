import {
  DoubleSide,
  Euler,
  InstancedBufferAttribute,
  InstancedMesh,
  Matrix4,
  PlaneGeometry,
  Quaternion,
  ShaderMaterial,
  UniformsLib,
  UniformsUtils,
  Vector3,
} from 'three';

import { seeded } from '../fallGeometry';
import { rawColor } from '../rawColor';
import { createSdfAtlas, type GlyphCell } from './textures';

/*
 * Band 2: letters tumbling in the mist that drift together, as the band
 * reaches the middle of the screen, to spell one of the T-shirt words, hold
 * it for a moment and drift apart again.
 *
 * Technique: signed distance field text. Each capital of Cormorant Garamond is
 * drawn once on a canvas and turned into a distance field (textures.ts); a
 * letter is a quad that samples it with a smoothstep on the 0.5 contour, so
 * its edges stay crisp at any size. A letter's slight thickness comes from a
 * few slices of the same quad stacked behind it (the outer two lit as faces,
 * the inner ones darker, as its sides). All letters and slices are one
 * InstancedMesh.
 */

const BONE = rawColor('#e8e1d3');
const SILVER = rawColor('#b8bbc1');
/** Letters that drift with the word but never join it. */
const STRAYS = 'AEINORSTLMUC';

export interface LetterFrame {
  time: number;
  /** World y of the camera when band 2 is centred on screen. */
  bandY: number;
  /** 0 scattered, 1 the word spelled. */
  assembly: number;
  /** World half-width of the view at distance d from the camera. */
  halfWidthAt: (d: number) => number;
  /** World half-height of the band's window at distance d. */
  windowHalfAt: (d: number) => number;
  cameraZ: number;
}

export interface Letters {
  mesh: InstancedMesh;
  update: (frame: LetterFrame) => void;
  dispose: () => void;
}

export function createLetters(word: string, small: boolean): Letters {
  const slices = small ? 4 : 6;
  const strays = small ? 8 : 14;
  const chars = Array.from(word.toUpperCase());
  const glyphChars = Array.from(
    new Set([...chars.filter((c) => c !== ' '), ...Array.from(STRAYS)]),
  );
  const atlas = createSdfAtlas(glyphChars);
  const random = seeded(Array.from(word).reduce((a, c) => a * 31 + c.charCodeAt(0), 7));

  interface Letter {
    glyph: GlyphCell;
    /** Index in the word, or -1 for a stray. */
    slot: number;
    colour: typeof BONE;
    u: number;
    v: number;
    d: number;
    phase: number;
    spin: Vector3;
    stagger: number;
  }
  const letters: Letter[] = [];
  const pick = (c: string): GlyphCell | undefined => atlas.glyphs.get(c);
  chars.forEach((c, i) => {
    const glyph = pick(c);
    if (!glyph) return;
    letters.push({
      glyph,
      slot: i,
      colour: random() < 0.55 ? BONE : SILVER,
      u: random() * 2 - 1,
      v: random() * 2 - 1,
      d: 9 + random() * 8,
      phase: random() * Math.PI * 2,
      spin: new Vector3(random() - 0.5, random() - 0.5, random() - 0.5).multiplyScalar(0.9),
      stagger: random(),
    });
  });
  for (let i = 0; i < strays; i++) {
    const glyph = pick(STRAYS[Math.floor(random() * STRAYS.length)] ?? 'A');
    if (!glyph) continue;
    letters.push({
      glyph,
      slot: -1,
      colour: random() < 0.5 ? BONE : SILVER,
      u: random() * 2 - 1,
      v: random() * 2 - 1,
      // Behind the word, so they never cover it
      d: 14 + random() * 12,
      phase: random() * Math.PI * 2,
      spin: new Vector3(random() - 0.5, random() - 0.5, random() - 0.5).multiplyScalar(0.9),
      stagger: random(),
    });
  }

  // Where each word letter sits when the word is spelled (in letter-cell units, centred)
  const advances = chars.map((c) => (c === ' ' ? 0.28 : (pick(c)?.advance ?? 0.5)));
  const wordWidth = advances.reduce((a, b) => a + b, 0);
  const centres: number[] = [];
  advances.reduce((x, a) => {
    centres.push(x + a / 2 - wordWidth / 2);
    return x + a;
  }, 0);

  const count = letters.length * slices;
  const geometry = new PlaneGeometry(1, 1);
  const cell = new Float32Array(count * 4);
  const colour = new Float32Array(count * 3);
  const slice = new Float32Array(count);
  letters.forEach((letter, i) => {
    for (let s = 0; s < slices; s++) {
      const k = i * slices + s;
      cell.set([letter.glyph.u, letter.glyph.v, letter.glyph.w, letter.glyph.h], k * 4);
      colour.set([letter.colour.r, letter.colour.g, letter.colour.b], k * 3);
      slice[k] = s / (slices - 1);
    }
  });
  geometry.setAttribute('aCell', new InstancedBufferAttribute(cell, 4));
  geometry.setAttribute('aColour', new InstancedBufferAttribute(colour, 3));
  geometry.setAttribute('aSlice', new InstancedBufferAttribute(slice, 1));

  const material = new ShaderMaterial({
    uniforms: UniformsUtils.merge([
      UniformsLib.fog,
      { uAtlas: { value: atlas.texture }, uThickness: { value: 0.03 } },
    ]),
    vertexShader: /* glsl */ `
      attribute vec4 aCell;
      attribute vec3 aColour;
      attribute float aSlice;
      uniform float uThickness;
      varying vec2 vUv;
      varying vec3 vColour;
      varying float vShade;
      varying float vDepth;
      varying float vEdge;
      void main() {
        vUv = aCell.xy + uv * aCell.zw;
        vec3 p = position;
        p.z -= aSlice * uThickness;
        vec4 mv = modelViewMatrix * instanceMatrix * vec4(p, 1.0);
        vec3 n = normalize(normalMatrix * mat3(instanceMatrix) * vec3(0.0, 0.0, 1.0));
        float facing = abs(n.z);
        bool face = aSlice < 0.01 || aSlice > 0.99;
        vShade = face ? 0.62 + 0.38 * facing : 0.5;
        // The inner slices are a little thinner, so seen face on they hide behind the face
        vEdge = face ? 0.5 : 0.56;
        vColour = aColour;
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D uAtlas;
      uniform vec3 fogColor;
      uniform float fogNear;
      uniform float fogFar;
      varying vec2 vUv;
      varying vec3 vColour;
      varying float vShade;
      varying float vDepth;
      varying float vEdge;
      void main() {
        float d = texture2D(uAtlas, vUv).r;
        float w = max(fwidth(d) * 0.7, 0.01);
        float a = smoothstep(vEdge - w, vEdge + w, d);
        if (a < 0.03) discard;
        float f = smoothstep(fogNear, fogFar, vDepth);
        gl_FragColor = vec4(mix(vColour * vShade, fogColor, f), a);
      }
    `,
    side: DoubleSide,
    fog: true,
    alphaToCoverage: true,
  });

  const mesh = new InstancedMesh(geometry, material, count);
  mesh.frustumCulled = false;

  const m = new Matrix4();
  const q = new Quaternion();
  const tumble = new Quaternion();
  const still = new Quaternion();
  const e = new Euler();
  const p = new Vector3();
  const target = new Vector3();
  const s = new Vector3();

  return {
    mesh,
    update(frame) {
      // The word's size: it fits the band's window, across 80% of its width
      const wordD = 12;
      const halfW = frame.halfWidthAt(wordD);
      const cellSize = Math.min(
        (1.6 * halfW) / Math.max(wordWidth, 1),
        frame.windowHalfAt(wordD) * 1.3,
      );
      letters.forEach((letter, i) => {
        const t = frame.time;
        // Drifting and tumbling in the mist
        const d = letter.d;
        const size =
          letter.slot >= 0 ? cellSize : cellSize * (0.7 + 0.5 * ((letter.phase / 6.28) % 1));
        p.set(
          letter.u * frame.halfWidthAt(d) * 0.85 + Math.sin(t * 0.11 + letter.phase) * 0.35,
          frame.bandY +
            letter.v * frame.windowHalfAt(d) * 0.9 +
            Math.sin(t * 0.17 + letter.phase * 2) * 0.25,
          frame.cameraZ - d,
        );
        e.set(
          t * letter.spin.x + letter.phase,
          t * letter.spin.y + letter.phase * 0.7,
          t * letter.spin.z * 0.5,
        );
        tumble.setFromEuler(e);
        if (letter.slot >= 0) {
          // Gathering into the word, each letter a little after the last
          const k = Math.min(Math.max(frame.assembly * 1.5 - letter.stagger * 0.5, 0), 1);
          const a = k * k * (3 - 2 * k);
          target.set((centres[letter.slot] ?? 0) * cellSize, frame.bandY, frame.cameraZ - wordD);
          p.lerp(target, a);
          q.copy(tumble).slerp(still, a);
        } else {
          q.copy(tumble);
        }
        s.setScalar(size);
        m.compose(p, q, s);
        for (let k = 0; k < slices; k++) mesh.setMatrixAt(i * slices + k, m);
      });
      mesh.instanceMatrix.needsUpdate = true;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      atlas.texture.dispose();
    },
  };
}
