import { MathUtils } from 'three';

import {
  CAMERA_FOV,
  EDGE_EYE,
  EDGE_PITCH,
  EDGE_STAND,
  FALL_DEPTH,
  FALL_PITCH,
  GROUND_Y,
  HOLE_FOV_TALL,
  HOLE_FOV_WIDE,
  HOLE_RADIUS,
  MOUTH_PITCH,
  SHAFT_RADIUS,
  SHAFT_Z,
  WIDEN_FROM,
  WIDEN_TO,
} from './constants';

/*
 * The entrance and the fall, as camera keyframes (pure functions, no scene).
 *
 *   shot 1, p = 0           standing at the edge of the hole, looking down ~46°
 *   shot 2, p 0.1 to 0.35   over the edge and into the hole, the tilt turning
 *                           to look down and forward
 *   shot 3                  the fall: the camera drops down the hole's axis
 *   shot 4, around 0.6      a brief look up at the mouth (a shrinking disc of
 *                           dusk sky), then down again
 *   shot 5, towards 1       the hole widens into the misty shaft and the view
 *                           levels out: at p = 1 the camera is exactly the page
 *                           camera (on the axis, looking along -z, CAMERA_FOV)
 *
 * After the hero, the page camera keeps descending the shaft at the page's
 * scroll rate, so every band is a window onto the same fall.
 */

export interface FallCamera {
  y: number;
  z: number;
  /** Rotation about x, in radians: negative looks down. */
  pitch: number;
  /** Vertical field of view in degrees. */
  fov: number;
}

const ss = MathUtils.smoothstep;
const lerp = MathUtils.lerp;

/** Shot keyframes for entrance progress `p` (0..1); `wide` 0 on tall screens, 1 on wide ones. */
export function entranceCamera(p: number, wide: number, out: FallCamera): FallCamera {
  const t = MathUtils.clamp(p, 0, 1);
  // Forward over the edge, to the axis
  out.z = SHAFT_Z + EDGE_STAND * (1 - ss(t, 0.1, 0.3));
  // The drop: still at the edge, then accelerating into the fall, then steady
  // (descent per scrolled pixel is constant, so the fall's speed is the scroll's)
  const u = MathUtils.clamp((t - 0.12) / 0.88, 0, 1);
  const drop = (u < 0.2 ? (u * u) / 0.4 : u - 0.1) / 0.9;
  out.y = GROUND_Y + EDGE_EYE - (EDGE_EYE + FALL_DEPTH) * drop;
  // Tilt: down at the edge, steeper falling, a short look up at the mouth, level at the end
  let pitch = lerp(EDGE_PITCH, FALL_PITCH, ss(t, 0.1, 0.32));
  const up = ss(t, 0.52, 0.6) * (1 - ss(t, 0.66, 0.74));
  pitch = lerp(pitch, MOUTH_PITCH, up);
  pitch = lerp(pitch, 0, ss(t, 0.82, 1));
  out.pitch = MathUtils.degToRad(pitch);
  out.fov = lerp(lerp(HOLE_FOV_TALL, HOLE_FOV_WIDE, wide), CAMERA_FOV, ss(t, 0.82, 1));
  return out;
}

/** Radius of the hole at height `y`: narrow below the mouth, widening into the shaft. */
export function shaftRadius(y: number): number {
  const k = 1 - ss(y, WIDEN_TO, WIDEN_FROM); // 0 above WIDEN_FROM, 1 below WIDEN_TO
  return lerp(HOLE_RADIUS, SHAFT_RADIUS, k * k);
}

/** How the page scroll maps onto the camera (measured on every rebuild). */
export interface ScrollMap {
  /** The hero's top and height in document pixels, and the viewport height. */
  heroTop: number;
  heroHeight: number;
  viewportHeight: number;
  /** World units per CSS pixel at the page camera's distance, and the parallax factor. */
  pxToWorld: number;
  parallax: number;
}

/** Scroll length of the entrance sequence (0 when the hero has normal height). */
export function sequenceLength(map: ScrollMap): number {
  return Math.max(map.heroHeight - map.viewportHeight, 0);
}

/** Page camera height after the hero: the shaft, descending at the page's scroll rate. */
export function pageCameraY(scroll: number, map: ScrollMap): number {
  const end = map.heroTop + sequenceLength(map);
  return GROUND_Y - FALL_DEPTH - (scroll - end) * map.pxToWorld * map.parallax;
}

/**
 * The camera for a page scroll position. While the hero is on screen it plays
 * the entrance at the hero's own progress (`override`, development only,
 * freezes it); a hero of normal height (no sequence) holds shot 1. After it,
 * the page camera.
 */
export function cameraForScroll(
  scroll: number,
  map: ScrollMap,
  wide: number,
  override: number | null,
  out: FallCamera,
): FallCamera {
  const length = sequenceLength(map);
  const heroEnd = map.heroTop + map.heroHeight;
  if (scroll < heroEnd && override !== null) return entranceCamera(override, wide, out);
  if (length >= 1 && scroll < map.heroTop + length) {
    return entranceCamera((scroll - map.heroTop) / length, wide, out);
  }
  if (length < 1 && scroll < heroEnd) return entranceCamera(0, wide, out);
  out.y = pageCameraY(scroll, map);
  out.z = SHAFT_Z;
  out.pitch = 0;
  out.fov = CAMERA_FOV;
  return out;
}

/** True while the camera is still in the narrow hole (shots 1 to 4), not in the open shaft. */
export function inHole(y: number): boolean {
  return y > WIDEN_FROM;
}
