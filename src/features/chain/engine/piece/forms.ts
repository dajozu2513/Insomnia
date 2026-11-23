import { MathUtils, SplineCurve, Vector2, Vector3 } from 'three';

import { at } from './at';

/*
 * The forms a chain is made into, as curves in centimetres. The body
 * axis is vertical through x = z = 0 and the visitor looks from +z, so every
 * piece turns about the same axis as the part of the body it is worn on.
 * Alongside each curve, a faint scale guide: generic line-art outlines in the
 * frontal plane (neck and shoulders, wrist and hand, ankle, finger, head,
 * waist), never a figure: no faces, no features.
 */

export interface FormCurve {
  /** Dense points along the chain, in order. */
  points: Vector3[];
  closed: boolean;
  /** The body's outward direction at a point (links lie flat against it). */
  normal: (p: Vector3, out: Vector3) => Vector3;
  /** Where the clasp sits, or null. */
  clasp: Vector3 | null;
  /** Polylines of the scale guide in the frontal plane (x, y), cm. */
  guide: [number, number][][];
  /**
   * The body part, invisible: it only hides the chain behind it, so the piece
   * reads as worn (a vertical cylinder, or an ellipsoid for the head).
   */
  body: Body | null;
}

export type Body =
  | { kind: 'cylinder'; radius: number; bottom: number; top: number }
  | { kind: 'ellipsoid'; rx: number; ry: number; rz: number };

const SAMPLES = 480;

const radial = (p: Vector3, out: Vector3): Vector3 => {
  out.set(p.x, 0, p.z);
  if (out.lengthSq() < 1e-6) out.set(0, 0, 1);
  return out.normalize();
};

const facing = (_p: Vector3, out: Vector3): Vector3 => out.set(0, 0, 1);

/** A smooth line through hand-placed points (Catmull-Rom). */
function line(points: [number, number][], n = 48): [number, number][] {
  return new SplineCurve(points.map(([x, y]) => new Vector2(x, y)))
    .getPoints(n)
    .map((v) => [v.x, v.y]);
}

/** One side's points and their mirror image, joined into one outline. */
function mirrored(side: [number, number][], join: boolean): [number, number][][] {
  const left = line(side);
  const right = left.map(([x, y]) => [-x, y] as [number, number]);
  return join ? [[...left, ...right.reverse()]] : [left, right];
}

function curveLength(points: Vector3[], closed: boolean): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) length += at(points, i).distanceTo(at(points, i - 1));
  if (closed && points.length > 1)
    length += at(points, 0).distanceTo(at(points, points.length - 1));
  return length;
}

/** A circle of circumference `length`, tilted about x (front down), centred at `centre`. */
function tiltedLoop(length: number, tilt: number, centre: Vector3): Vector3[] {
  const r = length / (2 * Math.PI);
  return Array.from({ length: SAMPLES }, (_, i) => {
    const a = (2 * Math.PI * i) / SAMPLES;
    const x = r * Math.sin(a);
    const z0 = r * Math.cos(a);
    return new Vector3(x, -z0 * Math.sin(tilt), z0 * Math.cos(tilt)).add(centre);
  });
}

/** The neck's back surface from the body axis, cm (where a necklace rests). */
const NECK_BACK = 5.8;
/** The finger's radius, cm. */
const FINGER = 0.85;

/**
 * The chain's curve for a form and a length (cm). `thickness` is the chain's,
 * so a ring's chain sits around the finger, not in it.
 */
export function buildForm(form: string, length: number, thickness: number): FormCurve {
  switch (form) {
    case 'necklace': {
      // Resting around the neck: high at the back (the clasp), the front falling
      // onto the chest, further the longer it is
      const r = length / (2 * Math.PI);
      const drop = MathUtils.clamp(0.5 * length - 12, 4, 1.8 * r);
      const tilt = Math.asin(drop / (2 * r));
      const gap = 0.35 / r;
      const points = Array.from({ length: SAMPLES }, (_, i) => {
        const a = gap + ((2 * Math.PI - 2 * gap) * i) / (SAMPLES - 1);
        const b = -r * Math.cos(a) + r;
        return new Vector3(r * Math.sin(a), -b * Math.sin(tilt), -NECK_BACK + b * Math.cos(tilt));
      });
      return {
        points,
        closed: false,
        normal: radial,
        clasp: new Vector3(0, 0, -NECK_BACK),
        body: { kind: 'cylinder', radius: 5.2, bottom: -2, top: 14 },
        guide: mirrored(
          [
            [-5.2, 13],
            [-5.3, 6],
            [-5.7, 1.6],
            [-7.6, -1.1],
            [-12, -2.9],
            [-17.5, -4.7],
            [-21, -7.6],
            [-22.6, -12.5],
            [-23.2, -21],
          ],
          false,
        ),
      };
    }

    case 'bracelet':
      // A closed loop around the wrist of a relaxed, hanging hand
      return {
        points: tiltedLoop(length, 0.28, new Vector3(0, -0.6, 0.3)),
        closed: true,
        normal: radial,
        clasp: null,
        body: { kind: 'cylinder', radius: 2.4, bottom: -16, top: 17 },
        guide: [
          [
            ...line([
              [-3.4, 17],
              [-3.2, 9],
              [-2.8, 3],
              [-2.6, 0],
              [-3.4, -3],
              [-4.2, -6.5],
              [-4.3, -10],
              [-3.8, -13.5],
              [-2.4, -15.8],
              [0, -16.6],
            ]),
            ...line([
              [0, -16.6],
              [2.4, -15.8],
              [3.8, -13.5],
              [4.3, -10.5],
              [4.5, -9.3],
              [5.6, -8.8],
              [5.9, -6.9],
              [5.1, -4.6],
              [3.6, -2.6],
              [2.6, 0],
              [2.8, 3],
              [3.2, 9],
              [3.4, 17],
            ]),
          ],
        ],
      };

    case 'anklet':
      // A slightly larger loop, resting low on the ankle and the top of the foot
      return {
        points: tiltedLoop(length, 0.34, new Vector3(0, 1.4, 0.7)),
        closed: true,
        normal: radial,
        clasp: null,
        body: { kind: 'cylinder', radius: 3.1, bottom: -5.5, top: 19 },
        guide: [
          ...mirrored(
            [
              [-5.2, 19],
              [-4.7, 11],
              [-3.5, 4.5],
              [-3.2, 1.6],
              [-3.9, -1.6],
              [-5.2, -3.9],
              [-5.6, -5.5],
            ],
            false,
          ),
          line([
            [-5.6, -5.5],
            [-2, -6.1],
            [2, -6.1],
            [5.6, -5.5],
          ]),
        ],
      };

    case 'ring': {
      // A small ring of the chain around a finger
      const r = Math.max(length / (2 * Math.PI), FINGER + thickness / 2);
      const points = Array.from({ length: SAMPLES }, (_, i) => {
        const a = (2 * Math.PI * i) / SAMPLES;
        return new Vector3(r * Math.sin(a), -2.4, r * Math.cos(a));
      });
      const tip: [number, number][] = Array.from({ length: 13 }, (_, k) => {
        const a = Math.PI - (Math.PI * k) / 12;
        return [FINGER * Math.cos(a), 2 + FINGER * Math.sin(a)];
      });
      return {
        points,
        closed: true,
        normal: radial,
        clasp: null,
        body: { kind: 'cylinder', radius: FINGER - 0.05, bottom: -7, top: 2.8 },
        guide: [
          [[-1.45, -7.4], [-FINGER, -5.9], [-FINGER, 2], ...tip, [FINGER, -5.9], [1.45, -7.4]],
        ],
      };
    }

    case 'head': {
      // An arc across the forehead, its ends going back around the head; what is
      // left of the length hangs down at the back
      const y0 = 3.4;
      // On the head's surface (just off it) at a turn psi from the front and a height y
      const onHead = (psi: number, y: number, out: Vector3) => {
        const k = Math.sqrt(Math.max(1 - (y / 10.5) ** 2, 0.2));
        return out.set((7.6 * k + 0.3) * Math.sin(psi), y, (9.6 * k + 0.3) * Math.cos(psi));
      };
      const arcPoint = (psi: number, out: Vector3) =>
        onHead(psi, y0 - 1.6 * (psi / Math.PI) ** 2, out);
      // Walk the arc to find how far each side reaches
      const half = length / 2;
      const step = Math.PI / 600;
      const arc: Vector3[] = [arcPoint(0, new Vector3())];
      let travelled = 0;
      let psi = 0;
      const limit = 0.83 * Math.PI;
      while (psi < limit && travelled < half) {
        psi += step;
        const p = arcPoint(psi, new Vector3());
        travelled += p.distanceTo(at(arc, arc.length - 1));
        arc.push(p);
      }
      const end = at(arc, arc.length - 1);
      const hang = Math.max(half - travelled, 0);
      const tail = Array.from({ length: Math.ceil(hang / 0.2) }, (_, i) =>
        onHead(psi, end.y - (i + 1) * 0.2, new Vector3()),
      );
      const side = [...arc, ...tail];
      const points = [
        ...side
          .slice(1)
          .reverse()
          .map((p) => new Vector3(-p.x, p.y, p.z)),
        ...side,
      ];
      const head: [number, number][] = Array.from({ length: 65 }, (_, k) => {
        const a = (2 * Math.PI * k) / 64;
        return [7.6 * Math.cos(a), 10.5 * Math.sin(a)];
      });
      return {
        points,
        closed: false,
        normal: radial,
        clasp: null,
        body: { kind: 'ellipsoid', rx: 7.5, ry: 10.4, rz: 9.5 },
        guide: [
          head,
          ...mirrored(
            [
              [-4.9, -9.3],
              [-5, -14],
              [-6.2, -16.6],
              [-10, -18.6],
            ],
            false,
          ),
        ],
      };
    }

    case 'waist': {
      // A large loop on the hips, with a gentle drape at the front
      const drape = MathUtils.clamp((length - 76) * 0.3, 1.2, 14);
      const shape = (scale: number) =>
        Array.from({ length: SAMPLES }, (_, i) => {
          const a = (2 * Math.PI * i) / SAMPLES;
          const front = Math.max(Math.cos(a), 0) ** 3;
          return new Vector3(
            14 * scale * Math.sin(a),
            -3 - drape * front,
            10 * scale * Math.cos(a),
          );
        });
      let scale = 1;
      let points = shape(scale);
      for (let k = 0; k < 4; k++) {
        scale *= length / curveLength(points, true);
        points = shape(scale);
      }
      return {
        points,
        closed: true,
        normal: radial,
        clasp: null,
        body: { kind: 'cylinder', radius: 9.4, bottom: -30, top: 21 },
        guide: mirrored(
          [
            [-12.6, 21],
            [-12, 10],
            [-11.2, 3],
            [-11.5, -2],
            [-13.6, -8],
            [-16, -14],
            [-16.6, -20],
            [-16, -28],
          ],
          false,
        ),
      };
    }

    case 'other':
    default: {
      // A single hanging length, with the slightest sway
      const points = Array.from({ length: SAMPLES }, (_, i) => {
        const s = i / (SAMPLES - 1);
        return new Vector3(0.012 * length * Math.sin(Math.PI * s), length / 2 - s * length, 0);
      });
      return { points, closed: false, normal: facing, clasp: null, guide: [], body: null };
    }
  }
}
