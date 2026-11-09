import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  type Material,
  Points,
  PointsMaterial,
  ShaderMaterial,
  SRGBColorSpace,
  UniformsLib,
  UniformsUtils,
} from 'three';

import type { SceneAtmosphere } from '../../atmosphere/variants';
import { PARTICLE_RISE, PARTICLE_SWAY } from './constants';
import { rawColor } from './rawColor';

export interface Particles {
  points: Points;
  /**
   * Moves the motes and keeps them in a box around the camera, so they are in
   * every window. `dt` 0 (reduced motion) only re-wraps them: no drift and no
   * twinkle. `pixelHeight` is the drawing buffer's height (the motes' size scale).
   */
  update: (
    dt: number,
    cameraY: number,
    halfWidth: number,
    viewHeight: number,
    pixelHeight: number,
  ) => void;
  dispose: () => void;
}

/** A soft round sprite drawn on a canvas: no image files. `glow` gives it a bright core and a wide halo. */
function spriteTexture(glow: boolean): CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    if (glow) {
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.12, 'rgba(255,255,255,0.9)');
      g.addColorStop(0.3, 'rgba(255,255,255,0.32)');
      g.addColorStop(0.6, 'rgba(255,255,255,0.08)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
    } else {
      g.addColorStop(0, 'rgba(255,255,255,1)');
      g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
      g.addColorStop(1, 'rgba(255,255,255,0)');
    }
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * Glowing motes (the dreamlike variants): additive points whose brightness
 * breathes slowly, each on its own phase. They fade with the fog distance
 * (towards no light, since they add light).
 */
function moteMaterial(motes: SceneAtmosphere['motes'], texture: CanvasTexture): ShaderMaterial {
  return new ShaderMaterial({
    uniforms: UniformsUtils.merge([
      UniformsLib.fog,
      {
        uColor: { value: rawColor(motes.colour) },
        uOpacity: { value: motes.opacity },
        uSize: { value: motes.size },
        uScale: { value: 400 },
        uTime: { value: 0 },
        uTwinkle: { value: motes.twinkle },
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
      varying float vBrightness;
      varying float vDepth;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = uSize * (uScale / -mvPosition.z);
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
      uniform float fogNear;
      uniform float fogFar;
      varying float vBrightness;
      varying float vDepth;
      void main() {
        float a = texture2D(uMap, gl_PointCoord).a;
        float fade = 1.0 - smoothstep(fogNear, fogFar, vDepth);
        gl_FragColor = vec4(uColor * a * uOpacity * vBrightness * fade, 1.0);
      }
    `,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    fog: true,
  });
}

/**
 * The floating particles, in front of and behind the chain: one Points object,
 * rising slowly with a gentle sway in a box that travels with the camera, so
 * every window has them. 'dust' is the current soft grey dust; 'motes' are the
 * dreamlike variants' glowing, twinkling motes.
 */
export function createParticles(count: number, motes: SceneAtmosphere['motes']): Particles {
  const glowing = motes.kind === 'motes';
  const geometry = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  // Per mote: unit-space x (-1..1), y (-0.5..0.5), world z, sway phase, speed factor
  const seeds = new Float32Array(count * 5);
  const phases = new Float32Array(count);
  const rates = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    seeds[i * 5] = Math.random() * 2 - 1;
    seeds[i * 5 + 1] = Math.random() - 0.5;
    seeds[i * 5 + 2] = -8 + Math.random() * 20; // z from -8 (behind) to 12 (in front)
    seeds[i * 5 + 3] = Math.random() * Math.PI * 2;
    seeds[i * 5 + 4] = 0.6 + Math.random() * 0.8;
    phases[i] = Math.random() * Math.PI * 2;
    rates[i] = 0.5 + Math.random() * 1.1; // a breath every 3.5 to 12 s
  }
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aPhase', new BufferAttribute(phases, 1));
  geometry.setAttribute('aRate', new BufferAttribute(rates, 1));

  const texture = spriteTexture(glowing);
  const material: Material = glowing
    ? moteMaterial(motes, texture)
    : new PointsMaterial({
        color: motes.colour,
        map: texture,
        size: motes.size,
        sizeAttenuation: true,
        transparent: true,
        opacity: motes.opacity,
        depthWrite: false,
        fog: true,
      });
  const points = new Points(geometry, material);
  points.frustumCulled = false;

  let time = 0;
  // Each mote's own drift, accumulated so it survives the box moving with the camera
  const rise = new Float32Array(count);

  return {
    points,
    update(dt, cameraY, halfWidth, viewHeight, pixelHeight) {
      time += dt;
      if (material instanceof ShaderMaterial) {
        const { uTime, uScale } = material.uniforms;
        if (uTime) uTime.value = time;
        if (uScale) uScale.value = pixelHeight / 2;
      }
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
        positions[i * 3] = (seeds[s] ?? 0) * halfWidth * 1.3 + sway;
        positions[i * 3 + 1] = cameraY + y;
        positions[i * 3 + 2] = seeds[s + 2] ?? 0;
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
