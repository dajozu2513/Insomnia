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
  dispose: () => void;
}

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
  }
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aPhase', new BufferAttribute(phases, 1));
  geometry.setAttribute('aRate', new BufferAttribute(rates, 1));

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
      },
    ]),
    vertexShader: /* glsl */ `
      attribute float aPhase;
      attribute float aRate;
      uniform float uSize;
      uniform float uScale;
      uniform float uTime;
      uniform float uTwinkle;
      uniform float uStretch;
      varying float vBrightness;
      varying float vDepth;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uSize * (uScale / -mvPosition.z) * uStretch;
        gl_Position = projectionMatrix * mvPosition;
        // Breathing: a slow sine per mote, between 1 - uTwinkle and 1
        vBrightness = 1.0 - uTwinkle * (0.5 + 0.5 * sin(uTime * aRate + aPhase));
        vDepth = -mvPosition.z;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpacity;
      uniform sampler2D uMap;
      uniform float uStretch;
      uniform float fogNear;
      uniform float fogFar;
      varying float vBrightness;
      varying float vDepth;
      void main() {
        // Squeezed sideways by the stretch, so a falling mote reads as a short vertical streak
        vec2 pc = vec2((gl_PointCoord.x - 0.5) * uStretch + 0.5, gl_PointCoord.y);
        if (pc.x < 0.0 || pc.x > 1.0) discard;
        float a = texture2D(uMap, pc).a / sqrt(uStretch);
        float fade = 1.0 - smoothstep(fogNear, fogFar, vDepth);
        gl_FragColor = vec4(uColor * a * uOpacity * vBrightness * fade, 1.0);
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
      const { uTime, uScale, uStretch } = material.uniforms;
      if (uTime) uTime.value = time;
      if (uScale) uScale.value = pixelHeight / 2;
      if (uStretch) uStretch.value = stretch;
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
        // In the hole: around the axis, from a little above the camera to well below it
        let hy = baseY * (holeHeight / boxHeight) - (cameraY - 8);
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
    dispose() {
      geometry.dispose();
      material.dispose();
      texture.dispose();
    },
  };
}
