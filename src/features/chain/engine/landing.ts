import { MathUtils, Vector3 } from 'three';

import { CAMERA_FOV, SHAFT_Z } from './constants';
import type { FallCamera } from './entrance';

/*
 * The landing (step 13; docs/brand/design-direction.md, "The landing"): pure
 * camera keyframes and the room's placement, no scene.
 *
 * The hall is built upright in its own coordinates (floor at y 0, ceiling at
 * ROOM.height, open at its near end, the small door in the back wall) and then
 * turned half a turn about the depth axis, so in the world it hangs upside down
 * below the falling visitor: its chessboard floor on top, its lamps pointing up.
 * The camera keeps falling towards it, slowing down, and rolls half a turn the
 * same way while it does (the only roll in the site), so the room rights itself.
 * It ends standing on the floor, facing the small door.
 */

/** The hall, in its own units: width (x), height (y), and its near (open) and back ends (z). */
export const ROOM = { width: 6, height: 3.2, near: 2, back: -12 } as const;

/** Where the visitor ends: standing height, distance into the hall, and the look down at the small door. */
export const STAND = { y: 1.55, z: -7.9, pitch: 12 } as const;

/** The small door in the back wall (centre and size, room units). */
export const SMALL_DOOR = { x: 0, y: 0.32, z: ROOM.back + 0.04, width: 0.5, height: 0.64 } as const;

/** World z of the camera at the end (it travels forward from the shaft's axis). */
const END_Z = SHAFT_Z - 30;

/** Vertical field of view on the floor: tall screens, wide screens. */
const ROOM_FOV_TALL = 74;
const ROOM_FOV_WIDE = 52;

export interface LandingMap {
  /** Document scroll where the landing starts (its top reaches the top of the viewport). */
  start: number;
  /** Scroll length of the landing: to the bottom of the page (0: no sequence). */
  length: number;
  /** Camera height when it starts, and how far it falls until it stands on the floor. */
  y0: number;
  drop: number;
}

/** Landing progress 0..1 for a page scroll. */
export function landingProgress(scroll: number, map: LandingMap): number {
  if (map.length < 1) return 1;
  return MathUtils.clamp((scroll - map.start) / map.length, 0, 1);
}

/**
 * How far the camera falls during the landing, so it starts at the page's
 * falling speed and slows to a stop: the descent eases out as 1 - (1 - p)^3,
 * whose starting slope is 3, so the drop is a third of what the page's rate
 * would cover over the landing's scroll.
 */
export function landingDrop(length: number, worldPerPixel: number): number {
  return MathUtils.clamp((length * worldPerPixel) / 3, 5, 12);
}

/** World position of the room's own origin (the room is turned half a turn about z). */
export function roomOrigin(map: LandingMap, out = new Vector3()): Vector3 {
  // The camera ends at room point (0, STAND.y, STAND.z): turned, that is (0, -STAND.y, STAND.z)
  return out.set(0, map.y0 - map.drop + STAND.y, END_Z - STAND.z);
}

/** Room coordinates to world coordinates. */
export function roomToWorld(
  map: LandingMap,
  x: number,
  y: number,
  z: number,
  out = new Vector3(),
): Vector3 {
  roomOrigin(map, out);
  return out.set(out.x - x, out.y - y, out.z + z);
}

const ss = MathUtils.smoothstep;
const lerp = MathUtils.lerp;

/** Camera keyframes for landing progress `p`. `roll` is in radians. */
export function landingCamera(
  p: number,
  map: LandingMap,
  wide: number,
  out: FallCamera,
): FallCamera {
  const t = MathUtils.clamp(p, 0, 1);
  // Falling, slowing to a stop on the floor (it starts at the page's speed)
  out.y = map.y0 - map.drop * (1 - (1 - t) ** 3);
  // Gliding forward into the hall (starting from rest, as the page camera has no forward speed)
  out.z = lerp(SHAFT_Z, END_Z, t * t * (3 - 2 * t));
  // One slow half turn, driven only by scroll: the room rights itself
  const turn = ss(t, 0.3, 0.7);
  out.roll = Math.PI * turn;
  // Looking a little down at the room below; once turned, down at the small door
  // (in the world that is up: the room hangs upside down)
  const before = lerp(0, -12, ss(t, 0, 0.25));
  out.pitch = MathUtils.degToRad(lerp(before, STAND.pitch, turn));
  out.fov = lerp(CAMERA_FOV, lerp(ROOM_FOV_TALL, ROOM_FOV_WIDE, wide), ss(t, 0.45, 1));
  return out;
}
