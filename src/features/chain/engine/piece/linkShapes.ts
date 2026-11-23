import {
  BufferGeometry,
  DataTexture,
  ExtrudeGeometry,
  Float32BufferAttribute,
  MathUtils,
  RepeatWrapping,
  RGBAFormat,
  Shape,
  TorusGeometry,
  Vector2,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { at } from './at';

/*
 * The nine links of the collection as geometry, in centimetres, built in code
 * from the technical descriptions in src/data/links.ts (the reference photos
 * were used for shape only). A link's local axes: X along the chain, the link's
 * own plane XY, its thickness along Z. A chain is a repeated pattern of
 * components (one link, or a station and its ring), each with its span along
 * the chain and how it turns: `flat` lies on the body, `edge` stands on edge,
 * `alternate` turns 90 degrees from one link to the next, as real chains do.
 */

export type Turn = 'flat' | 'edge' | 'alternate';

export interface LinkComponent {
  geometry: BufferGeometry;
  /** Length it takes along the chain, cm (centre to centre with its neighbours). */
  span: number;
  turn: Turn;
}

export interface LinkPattern {
  components: LinkComponent[];
  /** A normal map for engraved surfaces (Static), or null. */
  normalMap: DataTexture | null;
  /** Length of one repeat of the pattern, cm. */
  span: number;
  /** Thickness of the chain, cm (keeps a ring's chain off the finger). */
  thickness: number;
}

/** Detail of the tubes: lower on small screens, where links are a few pixels long. */
export interface Detail {
  along: number;
  around: number;
  bevel: number;
}

export const DETAIL_FULL: Detail = { along: 56, around: 10, bevel: 3 };
export const DETAIL_SMALL: Detail = { along: 32, around: 7, bevel: 2 };

type Path = (t: number) => [number, number];

/**
 * A closed rounded rectangle in the XY plane, centred: half length `a` (X),
 * half width `b` (Y), corner radius `c`. With c = b it is a stadium.
 */
function roundedRect(a: number, b: number, c: number): Path {
  const sx = a - c;
  const sy = b - c;
  const arc = (Math.PI / 2) * c;
  const sides = [2 * sx, 2 * sy];
  const total = 2 * at(sides, 0) + 2 * at(sides, 1) + 4 * arc;
  return (t) => {
    let s = (((t % 1) + 1) % 1) * total;
    // Bottom edge (left to right), corner, right edge (up), corner, top, corner, left, corner
    const corners: [number, number, number][] = [
      [sx, -sy, -Math.PI / 2],
      [sx, sy, 0],
      [-sx, sy, Math.PI / 2],
      [-sx, -sy, Math.PI],
    ];
    const starts: [number, number][] = [
      [-sx, -b],
      [a, -sy],
      [sx, b],
      [-a, sy],
    ];
    const dirs: [number, number][] = [
      [1, 0],
      [0, 1],
      [-1, 0],
      [0, -1],
    ];
    for (let k = 0; k < 4; k++) {
      const side = at(sides, k % 2);
      if (s <= side) {
        const [x, y] = at(starts, k);
        const [dx, dy] = at(dirs, k);
        return [x + dx * s, y + dy * s];
      }
      s -= side;
      if (s <= arc) {
        const [cx, cy, a0] = at(corners, k);
        const angle = a0 + (c > 0 ? s / c : 0);
        return [cx + c * Math.cos(angle), cy + c * Math.sin(angle)];
      }
      s -= arc;
    }
    return [-sx, -b];
  };
}

function ellipse(a: number, b: number): Path {
  return (t) => [a * Math.cos(2 * Math.PI * t), b * Math.sin(2 * Math.PI * t)];
}

/** A profile: points (u across the path in its plane, v out of the plane), in order. */
function circleProfile(r: number, n: number): [number, number][] {
  return Array.from({ length: n }, (_, k) => {
    const a = (2 * Math.PI * k) / n;
    return [r * Math.cos(a), r * Math.sin(a)];
  });
}

/**
 * Sweeps a profile along a closed path in the XY plane. `smooth` shares the
 * vertices around the profile (round wire); otherwise every side of the
 * profile is its own strip, so the wire shows facets (square wire, diamond
 * cuts). UVs run along the path (u, `repeat` times) and around the profile (v).
 */
function sweep(
  path: Path,
  profile: [number, number][],
  samples: number,
  smooth: boolean,
  repeat = 1,
): BufferGeometry {
  const points: [number, number][] = [];
  const normals: [number, number][] = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const p = path(t);
    const a = path(t - 0.5 / samples);
    const b = path(t + 0.5 / samples);
    const tx = b[0] - a[0];
    const ty = b[1] - a[1];
    const len = Math.hypot(tx, ty) || 1;
    points.push(p);
    // In the plane, to the left of the direction of travel (outwards for these paths)
    normals.push([ty / len, -tx / len]);
  }
  const positions: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const m = profile.length;
  const ring = (i: number, k: number) => {
    const [px, py] = at(points, i);
    const [nx, ny] = at(normals, i);
    const [u, v] = at(profile, k % m);
    positions.push(px + nx * u, py + ny * u, v);
    uvs.push((i / samples) * repeat, k / m);
  };
  if (smooth) {
    for (let i = 0; i <= samples; i++) for (let k = 0; k <= m; k++) ring(i, k);
    for (let i = 0; i < samples; i++) {
      for (let k = 0; k < m; k++) {
        const a = i * (m + 1) + k;
        const b = (i + 1) * (m + 1) + k;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }
  } else {
    for (let k = 0; k < m; k++) {
      const base = positions.length / 3;
      for (let i = 0; i <= samples; i++) {
        ring(i, k);
        ring(i, k + 1);
      }
      for (let i = 0; i < samples; i++) {
        const a = base + i * 2;
        indices.push(a, a + 2, a + 1, a + 2, a + 3, a + 1);
      }
    }
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

/** A curb link's twist: the two ends turn opposite ways about the link's long axis. */
function twist(geometry: BufferGeometry, angle: number, halfLength: number): BufferGeometry {
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const y = position.getY(i);
    const z = position.getZ(i);
    const a = angle * MathUtils.clamp(x / halfLength, -1, 1);
    position.setXYZ(i, x, y * Math.cos(a) - z * Math.sin(a), y * Math.sin(a) + z * Math.cos(a));
  }
  geometry.computeVertexNormals();
  return geometry;
}

/** A round jump ring standing in the XY plane. */
function jumpRing(radius: number, wire: number, detail: Detail): BufferGeometry {
  return new TorusGeometry(radius, wire, Math.max(5, detail.around - 2), 28);
}

/** A flat shape extruded and bevelled, centred on its thickness. */
function extrude(
  shape: Shape,
  depth: number,
  bevel: number,
  bevelSize: number,
  segments: number,
): BufferGeometry {
  const geometry = new ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize,
    bevelSegments: segments,
    curveSegments: 18,
  });
  geometry.translate(0, 0, -depth / 2);
  geometry.computeVertexNormals();
  return geometry;
}

/** A five-pointed star with its two side points on the chain's axis (X). */
function starShape(outer: number, inner: number): Shape {
  const shape = new Shape();
  const lift = outer * Math.sin(MathUtils.degToRad(18));
  for (let k = 0; k < 10; k++) {
    const r = k % 2 === 0 ? outer : inner;
    const a = Math.PI / 2 + (k * Math.PI) / 5;
    const x = r * Math.cos(a);
    const y = r * Math.sin(a) - lift;
    if (k === 0) shape.moveTo(x, y);
    else shape.lineTo(x, y);
  }
  shape.closePath();
  return shape;
}

/** A heart, point down, its lobes' sides on the chain's axis; `w` is its half width. */
function heartShape(w: number): Shape {
  const s = w / 0.5;
  const shape = new Shape();
  const p = (x: number, y: number) => new Vector2(x * s, y * s);
  const start = p(0, -0.48);
  shape.moveTo(start.x, start.y);
  const curves: [number, number, number, number, number, number][] = [
    [-0.1, -0.36, -0.5, -0.12, -0.5, 0.12],
    [-0.5, 0.36, -0.2, 0.44, 0, 0.26],
    [0.2, 0.44, 0.5, 0.36, 0.5, 0.12],
    [0.5, -0.12, 0.1, -0.36, 0, -0.48],
  ];
  for (const [ax, ay, bx, by, cx, cy] of curves) {
    const a = p(ax, ay);
    const b = p(bx, by);
    const c = p(cx, cy);
    shape.bezierCurveTo(a.x, a.y, b.x, b.y, c.x, c.y);
  }
  // Lowered so the line through its widest point is the chain's axis
  return new Shape(shape.getPoints(48).map((v) => new Vector2(v.x, v.y - 0.12 * s)));
}

/** A flat disc pierced near its edge on both sides. */
function discShape(r: number, hole: number, at: number): Shape {
  const shape = new Shape();
  shape.absarc(0, 0, r, 0, Math.PI * 2, false);
  for (const x of [-at, at]) {
    const h = new Shape();
    h.absarc(x, 0, hole, 0, Math.PI * 2, true);
    shape.holes.push(h);
  }
  return shape;
}

/** Fine engraving for Static: a normal map of small random strokes (seeded, so it never changes). */
function engravedNormalMap(): DataTexture {
  const size = 128;
  const height = new Float32Array(size * size);
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  for (let n = 0; n < 900; n++) {
    const x0 = random() * size;
    const y0 = random() * size;
    const a = random() * Math.PI;
    const len = 3 + random() * 9;
    for (let s = 0; s < len; s += 0.5) {
      const x = Math.floor(x0 + Math.cos(a) * s + size) % size;
      const y = Math.floor(y0 + Math.sin(a) * s + size) % size;
      height[y * size + x] = 1;
    }
  }
  const data = new Uint8Array(size * size * 4);
  const h = (x: number, y: number) => at(height, ((y + size) % size) * size + ((x + size) % size));
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (h(x - 1, y) - h(x + 1, y)) * 1.4;
      const dy = (h(x, y - 1) - h(x, y + 1)) * 1.4;
      const len = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      data[i] = Math.round(((dx / len) * 0.5 + 0.5) * 255);
      data[i + 1] = Math.round(((dy / len) * 0.5 + 0.5) * 255);
      data[i + 2] = Math.round(((1 / len) * 0.5 + 0.5) * 255);
      data[i + 3] = 255;
    }
  }
  const texture = new DataTexture(data, size, size, RGBAFormat);
  texture.wrapS = RepeatWrapping;
  texture.wrapT = RepeatWrapping;
  texture.needsUpdate = true;
  return texture;
}

/** A stadium link of round wire: `length` and `width` outside, `wire` its diameter. */
function stadiumLink(length: number, width: number, wire: number, detail: Detail) {
  const w = wire / 2;
  const a = length / 2 - w;
  const b = width / 2 - w;
  return {
    geometry: sweep(roundedRect(a, b, b), circleProfile(w, detail.around), detail.along, true),
    span: 2 * a - 2.2 * w,
  };
}

/** An oval link of round wire. */
function ovalLink(length: number, width: number, wire: number, detail: Detail, repeat = 1) {
  const w = wire / 2;
  const a = length / 2 - w;
  const b = width / 2 - w;
  return {
    geometry: sweep(ellipse(a, b), circleProfile(w, detail.around), detail.along, true, repeat),
    span: 2 * a - 2.2 * w,
  };
}

/** Builds the pattern for a link id (unknown ids get Void's). */
export function createLinkPattern(id: string, detail: Detail): LinkPattern {
  const ring = (radius: number, wire: number, span: number): LinkComponent => ({
    geometry: jumpRing(radius, wire, detail),
    span,
    turn: 'edge',
  });
  const single = (
    link: { geometry: BufferGeometry; span: number },
    turn: Turn,
    thickness: number,
    normalMap: DataTexture | null = null,
  ): LinkPattern => ({
    components: [{ ...link, turn }],
    normalMap,
    span: link.span,
    thickness,
  });
  const station = (
    element: BufferGeometry,
    span: number,
    ringPart: LinkComponent,
    thickness: number,
  ): LinkPattern => ({
    components: [{ geometry: element, span, turn: 'flat' }, ringPart],
    normalMap: null,
    span: span + ringPart.span,
    thickness,
  });

  switch (id) {
    case 'star':
      // A flat, polished star, its side points joined by small rings
      return station(
        extrude(starShape(0.48, 0.2), 0.05, 0.025, 0.025, detail.bevel),
        0.9,
        ring(0.12, 0.026, 0.2),
        0.12,
      );
    case 'monolith': {
      // Curb: a flattened oval with flat, diamond-cut faces, twisted so it lies flat
      const a = 0.42;
      const b = 0.26;
      const profile: [number, number][] = [
        [0.11, 0.025],
        [0.07, 0.05],
        [-0.07, 0.05],
        [-0.11, 0.025],
        [-0.11, -0.025],
        [-0.07, -0.05],
        [0.07, -0.05],
        [0.11, -0.025],
      ];
      const geometry = twist(sweep(ellipse(a, b), profile, detail.along, false), 0.55, a);
      return single({ geometry, span: 2 * a - 0.22 }, 'flat', 0.14);
    }
    case 'static':
      // A small oval whose engraved surface catches the light in flashes
      return single(ovalLink(0.62, 0.46, 0.11, detail, 3), 'alternate', 0.11, engravedNormalMap());
    case 'together': {
      // An elongated rectangle with square corners in square-section wire
      const half = 0.04;
      const a = 0.52;
      const b = 0.2;
      const profile: [number, number][] = [
        [half, half],
        [-half, half],
        [-half, -half],
        [half, -half],
      ];
      return single(
        {
          geometry: sweep(roundedRect(a, b, 0.05), profile, detail.along, false),
          span: 2 * a - 0.09,
        },
        'alternate',
        0.08,
      );
    }
    case 'meridian':
      // Small, fine, smooth ovals: the most delicate chain
      return single(ovalLink(0.4, 0.3, 0.05, detail), 'alternate', 0.05);
    case 'heart':
      // A puffed, polished heart joined by small rings
      return station(
        extrude(heartShape(0.42), 0.02, 0.12, 0.07, detail.bevel + 2),
        0.84,
        ring(0.12, 0.026, 0.2),
        0.26,
      );
    case 'echo':
      // A flat disc pierced near its edge, joined by rings: it shines like a coin
      return station(
        extrude(discShape(0.42, 0.06, 0.33), 0.04, 0.015, 0.015, detail.bevel),
        0.66,
        ring(0.13, 0.026, 0.2),
        0.07,
      );
    case 'snake': {
      // Rounded box chain: compact cubic links, each turned from the last
      const geometry = new RoundedBoxGeometry(0.3, 0.3, 0.3, Math.max(2, detail.bevel), 0.07);
      return single({ geometry, span: 0.29 }, 'alternate', 0.3);
    }
    case 'void':
    default:
      // A long stadium of round wire: the largest, most open link
      return single(stadiumLink(2.4, 0.9, 0.15, detail), 'alternate', 0.15);
  }
}
