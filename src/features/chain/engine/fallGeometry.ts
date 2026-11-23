import {
  BufferGeometry,
  CatmullRomCurve3,
  Float32BufferAttribute,
  IcosahedronGeometry,
  TubeGeometry,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

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
 * a TubeGeometry of radius 1 whose rings are scaled around the path. `rough`
 * (0 smooth) adds fibrous ridges along it and lumps in its girth, so a root
 * never reads as an even, smooth tube.
 */
export function taperedTube(
  points: readonly Vector3[],
  r0: number,
  r1: number,
  tubular = 48,
  radial = 10,
  rough = 0,
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
    // Knots and narrowings along the root
    const lump = Math.max(Math.sin(t * 31 + r0 * 40), 0) ** 3 * 0.16 - Math.sin(t * 13 + 1) * 0.05;
    for (let j = 0; j <= radial; j++) {
      const index = i * (radial + 1) + j;
      const angle = (j / radial) * Math.PI * 2;
      // Ridges that run straight along the root (never twisted round it like a rope)
      const fibres =
        Math.abs(Math.sin(angle * 4.5 + Math.sin(t * 7) * 0.3)) * 0.07 +
        Math.sin(angle * 11 + 1.3) * 0.025;
      const k = r * (1 + rough * (fibres + lump));
      v.fromBufferAttribute(position, index).sub(centre).multiplyScalar(k).add(centre);
      position.setXYZ(index, v.x, v.y, v.z);
    }
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  return geometry;
}

const v3 = (x: number, y: number, z: number) => new Vector3(x, y, z);

/** A root hair: a very thin tube from a point on a root, through the given points. */
function rootHair(from: Vector3 | undefined, ...rest: Vector3[]): TubeGeometry {
  return taperedTube([from?.clone() ?? v3(0, 0, 0), ...rest], 0.012, 0.002, 10, 3, 0.6);
}

/**
 * A root hanging from a wall, in local space: it leaves the wall along +x
 * (towards the axis), then droops down -y in a crooked line, with root hairs
 * splitting off it and a split tip. Thin, dry and fibrous; one merged geometry,
 * so its instances (turned to face the axis) stay a single draw.
 */
export function hangingRootGeometry(): BufferGeometry {
  const main = [
    v3(-0.15, 0.04, 0),
    v3(0.18, -0.1, 0.05),
    v3(0.36, -0.45, -0.07),
    v3(0.5, -0.85, 0.06),
    v3(0.46, -1.3, -0.05),
    v3(0.57, -1.75, 0.04),
    v3(0.5, -2.25, -0.03),
  ];
  const parts = [
    taperedTube(main, 0.048, 0.007, 36, 5, 1),
    rootHair(main[2], v3(0.52, -0.66, 0.18), v3(0.6, -1.0, 0.3), v3(0.58, -1.32, 0.34)),
    rootHair(main[3], v3(0.68, -1.0, -0.14), v3(0.74, -1.42, -0.22)),
    rootHair(main[4], v3(0.36, -1.58, 0.12), v3(0.3, -1.98, 0.16)),
    rootHair(main[5], v3(0.68, -2.0, 0.1), v3(0.7, -2.38, 0.14)),
    rootHair(main[5], v3(0.46, -2.05, -0.12), v3(0.4, -2.5, -0.15)),
  ];
  return mergeParts(parts);
}

/** Root hairs hanging from a big root at the edge, where it dives into the hole. */
export function edgeRootHairs(curvePoints: readonly Vector3[], seed: number): BufferGeometry {
  const curve = new CatmullRomCurve3([...curvePoints], false, 'centripetal');
  const random = seeded(seed);
  const parts: TubeGeometry[] = [];
  for (let i = 0; i < 4; i++) {
    const start = curve.getPointAt(0.55 + random() * 0.4);
    const drop = 0.5 + random() * 0.9;
    const sway = () => (random() - 0.5) * 0.3;
    parts.push(
      rootHair(
        start,
        start.clone().add(v3(sway(), -drop * 0.4, sway())),
        start.clone().add(v3(sway(), -drop * 0.75, sway())),
        start.clone().add(v3(sway(), -drop, sway())),
      ),
    );
  }
  return mergeParts(parts);
}

function mergeParts(parts: BufferGeometry[]): BufferGeometry {
  const merged = mergeGeometries(parts);
  parts.forEach((part) => {
    part.dispose();
  });
  return merged;
}

/**
 * A tuft of dry grass in local space: thin tapering blades from the origin,
 * leaning out and curving over (uv.y 0 at the root, 1 at the tip).
 */
export function grassTuftGeometry(blades = 6): BufferGeometry {
  const random = seeded(4271);
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const ROWS = 3;
  for (let b = 0; b < blades; b++) {
    const turn = (b / blades) * Math.PI * 2 + random() * 0.8;
    const lean = 0.25 + random() * 0.5;
    const height = 0.12 + random() * 0.16;
    const width = 0.012 + random() * 0.008;
    const dx = Math.cos(turn);
    const dz = Math.sin(turn);
    const base = positions.length / 3;
    for (let r = 0; r <= ROWS; r++) {
      const t = r / ROWS;
      const out = lean * height * t * t + 0.01;
      const y = height * t * (1 - 0.25 * lean * t);
      const w = width * (1 - t) + 0.0015;
      // Two vertices across the blade, perpendicular to the way it leans
      positions.push(dx * out - dz * w, y, dz * out + dx * w);
      positions.push(dx * out + dz * w, y, dz * out - dx * w);
      uvs.push(0, t, 1, t);
    }
    for (let r = 0; r < ROWS; r++) {
      const i = base + r * 2;
      indices.push(i, i + 1, i + 2, i + 1, i + 3, i + 2);
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
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
