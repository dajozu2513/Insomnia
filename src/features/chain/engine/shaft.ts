import {
  CylinderGeometry,
  Euler,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  Quaternion,
  Vector3,
} from 'three';

import {
  GROUND_Y,
  ROOTS_PER_SEGMENT,
  ROOTS_PER_SEGMENT_SMALL,
  SEGMENT_HEIGHT,
  SEGMENTS_DESKTOP,
  SEGMENTS_SMALL,
  SHAFT_Z,
  STONES_PER_SEGMENT,
  STONES_PER_SEGMENT_SMALL,
} from './constants';
import { shaftRadius } from './entrance';
import { createBarkMaterial, createStoneMaterial, createWallMaterial } from './fallMaterials';
import { hangingRootGeometry, seeded, stoneGeometry } from './fallGeometry';

export interface Shaft {
  group: Group;
  /** Keeps the segments around the camera, recycling the ones it has left behind. */
  update: (cameraY: number) => void;
  dispose: () => void;
}

/** How far above the camera the highest segment reaches (the rest hang below). */
const ABOVE = 14;

/**
 * The hole and the shaft as an endless tunnel of recycled segments: a fixed
 * number of short wall cylinders (one shared geometry and procedural material)
 * that wrap from above the camera to below it as it descends. Each segment
 * slot owns a few instanced roots (hanging from the wall, or pushing out of it)
 * and embedded stones, re-seeded from the segment's index whenever the slot
 * moves to a new segment, so the same depth always looks the same.
 */
export function createShaft(small: boolean): Shaft {
  const segments = small ? SEGMENTS_SMALL : SEGMENTS_DESKTOP;
  const rootsPer = small ? ROOTS_PER_SEGMENT_SMALL : ROOTS_PER_SEGMENT;
  const stonesPer = small ? STONES_PER_SEGMENT_SMALL : STONES_PER_SEGMENT;
  const group = new Group();

  const wallGeometry = new CylinderGeometry(
    1,
    1,
    SEGMENT_HEIGHT,
    small ? 40 : 56,
    small ? 6 : 8,
    true,
  );
  const wallMaterial = createWallMaterial();
  const walls = Array.from({ length: segments }, () => {
    const mesh = new Mesh(wallGeometry, wallMaterial);
    mesh.frustumCulled = false;
    group.add(mesh);
    return mesh;
  });

  const rootGeometry = hangingRootGeometry();
  const barkMaterial = createBarkMaterial();
  const roots = new InstancedMesh(rootGeometry, barkMaterial, segments * rootsPer);
  roots.frustumCulled = false;
  group.add(roots);

  const rockGeometry = stoneGeometry();
  const stoneMaterial = createStoneMaterial();
  const stones = new InstancedMesh(rockGeometry, stoneMaterial, segments * stonesPer);
  stones.frustumCulled = false;
  group.add(stones);

  const slotSegment = new Array<number>(segments).fill(Number.NaN);
  const m = new Matrix4();
  const q = new Quaternion();
  const e = new Euler(0, 0, 0, 'YXZ');
  const p = new Vector3();
  const s = new Vector3();
  const hidden = new Matrix4().makeScale(0, 0, 0);

  // Where the walls widen and dissolve into the mist, nothing clings to them:
  // roots and stones there would float in the mist, off the bulging wall.
  const BARE_RADIUS = 3.8;

  function fill(slot: number, k: number): void {
    const random = seeded(k * 7919 + 17);
    const bottom = k * SEGMENT_HEIGHT;
    for (let j = 0; j < rootsPer; j++) {
      const index = slot * rootsPer + j;
      const y = bottom + random() * SEGMENT_HEIGHT;
      const a = random() * Math.PI * 2;
      const r = shaftRadius(y);
      if (y > GROUND_Y - 0.4 || r > BARE_RADIUS) {
        roots.setMatrixAt(index, hidden);
        continue;
      }
      // Local +x faces the axis; some roots hang down, some push up and out
      const pushing = random() < 0.3;
      e.set(pushing ? Math.PI : (random() - 0.5) * 0.5, Math.PI - a, (random() - 0.5) * 0.3);
      q.setFromEuler(e);
      const scale = (0.7 + random() * 0.8) * Math.sqrt(r / 2.6);
      s.set(scale, scale * (0.8 + random() * 0.6), scale);
      p.set(Math.cos(a) * r, y, SHAFT_Z + Math.sin(a) * r);
      roots.setMatrixAt(index, m.compose(p, q, s));
    }
    for (let j = 0; j < stonesPer; j++) {
      const index = slot * stonesPer + j;
      const y = bottom + random() * SEGMENT_HEIGHT;
      const a = random() * Math.PI * 2;
      const r = shaftRadius(y) * (0.96 + random() * 0.03);
      if (y > GROUND_Y - 0.3 || r > BARE_RADIUS) {
        stones.setMatrixAt(index, hidden);
        continue;
      }
      e.set(random() * 6.28, random() * 6.28, random() * 6.28);
      q.setFromEuler(e);
      const size = (0.05 + random() ** 2 * 0.2) * Math.sqrt(r / 2.6);
      s.set(size, size, size);
      p.set(Math.cos(a) * r, y, SHAFT_Z + Math.sin(a) * r);
      stones.setMatrixAt(index, m.compose(p, q, s));
    }
    roots.instanceMatrix.needsUpdate = true;
    stones.instanceMatrix.needsUpdate = true;
  }

  return {
    group,
    update(cameraY) {
      const top = Math.floor((cameraY + ABOVE) / SEGMENT_HEIGHT);
      for (let i = 0; i < segments; i++) {
        const k = top - i;
        const slot = ((k % segments) + segments) % segments;
        const wall = walls[slot];
        if (!wall) continue;
        if (slotSegment[slot] !== k) {
          slotSegment[slot] = k;
          fill(slot, k);
        }
        wall.position.set(0, (k + 0.5) * SEGMENT_HEIGHT, 0);
        // No walls above the ground: the hole starts at its mouth
        wall.visible = (k + 1) * SEGMENT_HEIGHT <= GROUND_Y + 1e-6;
      }
    },
    dispose() {
      wallGeometry.dispose();
      wallMaterial.dispose();
      rootGeometry.dispose();
      barkMaterial.dispose();
      roots.dispose();
      rockGeometry.dispose();
      stoneMaterial.dispose();
      stones.dispose();
    },
  };
}
