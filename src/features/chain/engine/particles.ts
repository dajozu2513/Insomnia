import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Points,
  ShaderMaterial,
  SRGBColorSpace,
  UniformsLib,
  UniformsUtils,
} from 'three';

import {
  HOLE_RADIUS,
  MOTE_COLOUR,
  MOTE_OPACITY,
  MOTE_SIZE,
  MOTE_TWINKLE,
  PARTICLE_RISE,
  PARTICLE_SWAY,
  SHAFT_Z,
} from './constants';
import { rawColor } from './rawColor';

export interface Particles {
  points: Points;
  /**
   * Moves the motes and keeps them in a box around the camera, so they are in
   * every window. `dt` 0 (reduced motion) only re-wraps them: no drift and no
   * twinkle. `pixelHeight` is the drawing buffer's height (the motes' size scale).
   * `inHole` 1 gathers them in the narrow hole around the axis (around and below
   * the camera), 0 spreads them across the page's view; `stretch` (1 and up)
   * draws them as short vertical streaks while falling fast.
   */
  update: (
    dt: number,
    cameraY: number,
    halfWidth: number,
    viewHeight: number,
    pixelHeight: number,
    inHole: number,
    stretch: number,
  ) => void;
  /** Scales the motes' brightness (1 as built; the landing thins them out at dawn). */
  setOpacity: (fraction: number) => void;
  dispose: () => void;
}

/** In the hole the motes are dust and grains of soil: earth coloured, dim, not glowing. */
const DUST_COLOUR = '#8a7d6c';
const GRAIN_COLOUR = '#6e6256';
const DUST_BRIGHTNESS = 0.32;
const GRAIN_BRIGHTNESS = 0.55;

/** A glowing sprite drawn on a canvas (a bright core and a wide halo): no image files. */
function spriteTexture(): CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.12, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.3, 'rgba(255,255,255,0.32)');
    g.addColorStop(0.6, 'rgba(255,255,255,0.08)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * Tiny glowing motes, like fireflies or stardust, in front of and behind the
 * chain: one additive Points object whose brightness breathes slowly, each mote
 * on its own phase and rate. They rise slowly with a gentle sway in a box that
 * travels with the camera, so every window has them, and fade with the fog
 * distance (towards no light, since they add light).
 */
export function createParticles(count: number): Particles {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  // Per mote: unit-space x (-1..1), y (-0.5..0.5), world z, sway phase, speed factor
  const seeds = new Float32Array(count * 5);
  const phases = new Float32Array(count);
  const rates = new Float32Array(count);
  // In the hole one mote in four is a grain of soil falling with the visitor
  const grains = new Float32Array(count);
  // In the hole: an angle and a radius around the axis
  const around = new Float32Array(count * 2);
  for (let i = 0; i < count; i++) {
    seeds[i * 5] = Math.random() * 2 - 1;
    seeds[i * 5 + 1] = Math.random() - 0.5;
    seeds[i * 5 + 2] = -8 + Math.random() * 20; // z from -8 (behind) to 12 (in front)
    seeds[i * 5 + 3] = Math.random() * Math.PI * 2;
    seeds[i * 5 + 4] = 0.6 + Math.random() * 0.8;
    phases[i] = Math.random() * Math.PI * 2;
    rates[i] = 0.5 + Math.random() * 1.1; // a breath every 3.5 to 12 s
    around[i * 2] = Math.random() * Math.PI * 2;
    around[i * 2 + 1] = Math.sqrt(Math.random()) * HOLE_RADIUS * 0.85;
    grains[i] = i % 4 === 0 ? 1 : 0;
  }
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aPhase', new BufferAttribute(phases, 1));
  geometry.setAttribute('aRate', new BufferAttribute(rates, 1));
  geometry.setAttribute('aGrain', new BufferAttribute(grains, 1));

  const texture = spriteTexture();
  const material = new ShaderMaterial({
    uniforms: UniformsUtils.merge([
      UniformsLib.fog,
      {
        uColor: { value: rawColor(MOTE_COLOUR) },
        uOpacity: { value: MOTE_OPACITY },
        uSize: { value: MOTE_SIZE },
        uScale: { value: 400 },
        uTime: { value: 0 },
        uTwinkle: { value: MOTE_TWINKLE },
        uStretch: { value: 1 },
        uMap: { value: texture },
        uDust: { value: 0 },
        uDustColor: { value: rawColor(DUST_COLOUR) },
        uGrainColor: { value: rawColor(GRAIN_COLOUR) },
      },
    ]),
    vertexShader: /* glsl */ `
      attribute float aPhase;
      attribute float aRate;
      attribute float aGrain;
      uniform float uSize;
      uniform float uScale;
      uniform float uTime;
      uniform float uTwinkle;
      uniform float uStretch;
      uniform float uDust;
      varying float vBrightness;
      varying float vDepth;
      varying float vStretch;
      varying float vGrain;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        // Grains fall with the visitor, so they never streak; dust and grains are smaller than motes
        vGrain = aGrain * uDust;
        vStretch = mix(uStretch, 1.0, vGrain);
        float size = uSize * mix(1.0, mix(0.55, 0.8, aGrain), uDust);
        gl_PointSize = size * (uScale / -mvPosition.z) * vStretch;
        // Dust right in front of the eye would be a large soft blot: capped, and faded out up close
        gl_PointSize = min(gl_PointSize, mix(1.0e4, uScale * 0.025 * vStretch, uDust));
        gl_Position = projectionMatrix * mvPosition;
        // Breathing: a slow sine per mote, between 1 - uTwinkle and 1 (dust does not breathe)
        float twinkle = uTwinkle * (1.0 - uDust);
        vBrightness = 1.0 - twinkle * (0.5 + 0.5 * sin(uTime * aRate + aPhase));
        // In the hole only part of the dust shows: a thin haze, not a swarm
        vBrightness *= mix(1.0, step(fract(aPhase * 7.31), 0.6) * ${DUST_BRIGHTNESS.toFixed(2)}, uDust * (1.0 - aGrain));
        vBrightness *= mix(1.0, ${GRAIN_BRIGHTNESS.toFixed(2)}, vGrain);
        vBrightness *= mix(1.0, smoothstep(0.6, 1.6, -mvPosition.z), uDust);
        vDepth = -mvPosition.z;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform vec3 uDustColor;
      uniform vec3 uGrainColor;
      uniform float uOpacity;
      uniform float uDust;
      uniform sampler2D uMap;
      uniform float fogNear;
      uniform float fogFar;
      varying float vBrightness;
      varying float vDepth;
      varying float vStretch;
      varying float vGrain;
      void main() {
        // Squeezed sideways by the stretch, so a falling mote reads as a short vertical streak
        vec2 pc = vec2((gl_PointCoord.x - 0.5) * vStretch + 0.5, gl_PointCoord.y);
        if (pc.x < 0.0 || pc.x > 1.0) discard;
        float a = texture2D(uMap, pc).a / sqrt(vStretch);
        // Dust and grains have no halo: they are specks, not lights
        a = pow(a, mix(1.0, 2.6, uDust));
        float fade = 1.0 - smoothstep(fogNear, fogFar, vDepth);
        vec3 colour = mix(uColor, mix(uDustColor, uGrainColor, vGrain), uDust);
        gl_FragColor = vec4(colour * a * uOpacity * vBrightness * fade, 1.0);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    fog: true,
  });
  const points = new Points(geometry, material);
  points.frustumCulled = false;

  let time = 0;
  // Each mote's own drift, accumulated so it survives the box moving with the camera
  const rise = new Float32Array(count);

  return {
    points,
    update(dt, cameraY, halfWidth, viewHeight, pixelHeight, inHole, stretch) {
      time += dt;
      const { uTime, uScale, uStretch, uDust } = material.uniforms;
      if (uTime) uTime.value = time;
      if (uScale) uScale.value = pixelHeight / 2;
      if (uStretch) uStretch.value = stretch;
      if (uDust) uDust.value = inHole;
      const holeHeight = 22;
      const boxHeight = viewHeight * 1.6;
      for (let i = 0; i < count; i++) {
        const s = i * 5;
        const speed = seeds[s + 4] ?? 1;
        rise[i] = (rise[i] ?? 0) + dt * PARTICLE_RISE * speed;
        const sway = Math.sin(time * 0.25 * speed + (seeds[s + 3] ?? 0)) * PARTICLE_SWAY * 8;
        // Wrap vertically inside a box centred on the camera
        const baseY = (seeds[s + 1] ?? 0) * boxHeight + (rise[i] ?? 0);
        let y = baseY - cameraY;
        y = ((((y + boxHeight / 2) % boxHeight) + boxHeight) % boxHeight) - boxHeight / 2;
        const pageX = (seeds[s] ?? 0) * halfWidth * 1.3 + sway;
        const pageY = cameraY + y;
        const pageZ = seeds[s + 2] ?? 0;
        // In the hole: around the axis, from a little above the camera to well below it.
        // Dust hangs in the air (the visitor falls past it) and settles slowly; grains
        // of soil fall with the visitor, a little faster.
        const seedY = (seeds[s + 1] ?? 0) * holeHeight;
        const settle = (rise[i] ?? 0) * (holeHeight / boxHeight);
        const grain = grains[i] === 1;
        let hy = grain ? seedY - settle * 3 : seedY - settle * 0.5 - (cameraY - 8);
        hy = ((((hy + holeHeight / 2) % holeHeight) + holeHeight) % holeHeight) - holeHeight / 2;
        const angle = (around[i * 2] ?? 0) + sway * 0.2;
        const radius = around[i * 2 + 1] ?? 0;
        const holeX = Math.cos(angle) * radius;
        const holeY = cameraY - 8 + hy;
        const holeZ = SHAFT_Z + Math.sin(angle) * radius;
        positions[i * 3] = pageX + (holeX - pageX) * inHole;
        positions[i * 3 + 1] = pageY + (holeY - pageY) * inHole;
        positions[i * 3 + 2] = pageZ + (holeZ - pageZ) * inHole;
      }
      const attribute = geometry.getAttribute('position');
      attribute.needsUpdate = true;
    },
    setOpacity(fraction) {
      const uniform = material.uniforms.uOpacity;
      if (uniform) uniform.value = MOTE_OPACITY * fraction;
    },
    dispose() {
      geometry.dispose();
      material.dispose();
      texture.dispose();
    },
  };
}
