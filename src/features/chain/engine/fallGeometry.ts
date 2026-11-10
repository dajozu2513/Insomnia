import {
  BufferGeometry,
  CatmullRomCurve3,
  IcosahedronGeometry,
  TubeGeometry,
  Vector3,
} from 'three';

/** Small deterministic random numbers (mulberry32), so every segment is the same each visit. */
export function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A tube that tapers from `r0` at its start to `r1` at its end, like a root:
 * a TubeGeometry of radius 1 whose rings are scaled around the path.
 */
export function taperedTube(
  points: readonly Vector3[],
  r0: number,
  r1: number,
  tubular = 48,
  radial = 10,
): TubeGeometry {
  const curve = new CatmullRomCurve3([...points], false, 'centripetal');
  const geometry = new TubeGeometry(curve, tubular, 1, radial, false);
  const position = geometry.getAttribute('position');
  const centre = new Vector3();
  const v = new Vector3();
  for (let i = 0; i <= tubular; i++) {
    const t = i / tubular;
    curve.getPointAt(t, centre);
    // Roots thin out towards their tips, with a slight swelling near the base
    const r = (r0 + (r1 - r0) * t ** 0.8) * (1 + 0.18 * Math.exp(-t * 14));
    for (let j = 0; j <= radial; j++) {
      const index = i * (radial + 1) + j;
      v.fromBufferAttribute(position, index).sub(centre).multiplyScalar(r).add(centre);
      position.setXYZ(index, v.x, v.y, v.z);
    }
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * A root hanging from a wall, in local space: it leaves the wall along +x
 * (towards the axis), then droops down -y. Instances turn it to face the axis.
 */
export function hangingRootGeometry(): BufferGeometry {
  return taperedTube(
    [
      new Vector3(-0.2, 0.05, 0),
      new Vector3(0.25, -0.15, 0.04),
      new Vector3(0.55, -0.7, -0.06),
      new Vector3(0.68, -1.5, 0.08),
      new Vector3(0.66, -2.3, -0.02),
    ],
    0.1,
    0.018,
    28,
    7,
  );
}

/** A small stone: an icosahedron pushed about by a little noise (deterministic). */
export function stoneGeometry(): BufferGeometry {
  const geometry = new IcosahedronGeometry(1, 1);
  const position = geometry.getAttribute('position');
  const v = new Vector3();
  for (let i = 0; i < position.count; i++) {
    v.fromBufferAttribute(position, i);
    const n = Math.sin(v.x * 5.1 + v.y * 2.3) * Math.cos(v.z * 4.7 - v.x * 1.9);
    v.multiplyScalar(0.82 + 0.22 * n).multiply(new Vector3(1, 0.72, 0.9));
    position.setXYZ(i, v.x, v.y, v.z);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}
