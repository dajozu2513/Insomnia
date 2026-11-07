import {
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  Points,
  PointsMaterial,
  SRGBColorSpace,
} from 'three';

import {
  PARTICLE_COLOR,
  PARTICLE_OPACITY,
  PARTICLE_RISE,
  PARTICLE_SIZE,
  PARTICLE_SWAY,
} from './constants';

export interface Particles {
  points: Points;
  /**
   * Moves the dust and keeps it in a box around the camera, so it is there in
   * every window. `dt` 0 (reduced motion) only re-wraps it: no drift.
   */
  update: (dt: number, cameraY: number, halfWidth: number, viewHeight: number) => void;
  dispose: () => void;
}

/** A soft round sprite drawn on a canvas: no image files. */
function spriteTexture(): CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * A few slow motes of dust or ash, in front of and behind the chain: one Points
 * object, tiny, soft and faint, rising slowly with a gentle sway. They live in
 * a box that travels with the camera, so every window has them.
 */
export function createParticles(count: number): Particles {
  const geometry = new BufferGeometry();
  const positions = new Float32Array(count * 3);
  // Per mote: unit-space x (-1..1), y (-0.5..0.5), world z, sway phase, speed factor
  const seeds = new Float32Array(count * 5);
  for (let i = 0; i < count; i++) {
    seeds[i * 5] = Math.random() * 2 - 1;
    seeds[i * 5 + 1] = Math.random() - 0.5;
    seeds[i * 5 + 2] = -8 + Math.random() * 20; // z from -8 (behind) to 12 (in front)
    seeds[i * 5 + 3] = Math.random() * Math.PI * 2;
    seeds[i * 5 + 4] = 0.6 + Math.random() * 0.8;
  }
  geometry.setAttribute('position', new BufferAttribute(positions, 3));

  const texture = spriteTexture();
  const material = new PointsMaterial({
    color: PARTICLE_COLOR,
    map: texture,
    size: PARTICLE_SIZE,
    sizeAttenuation: true,
    transparent: true,
    opacity: PARTICLE_OPACITY,
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
    update(dt, cameraY, halfWidth, viewHeight) {
      time += dt;
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
