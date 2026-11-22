import {
  AdditiveBlending,
  type BufferGeometry,
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  Group,
  type Material,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  type PerspectiveCamera,
  PlaneGeometry,
  Raycaster,
  SRGBColorSpace,
  Sprite,
  SpriteMaterial,
  TorusGeometry,
  Vector2,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

import type { RackController, TeeAtlas } from '../../types';
import { rawColor } from '../rawColor';

/*
 * The floating clothing rack (step 14; docs/brand/design-direction.md, "The
 * clothing rack"): a thin steel ring in the mist with no visible support, ten
 * steel hangers, a printed tee on each (the step 6 mockups, from the app's
 * atlas), a faint rose halo beneath. It turns very slowly on its own; the
 * visitor turns it by dragging (with inertia, easing to rest with a tee facing
 * them), with the arrow buttons or the keyboard. The tees sway in the air of
 * the fall (vertex shader).
 */

const COUNT = 10;
const SPACING = (Math.PI * 2) / COUNT;
/** Ring radius and the tee's size (the mockup's 300 x 330 frame). */
const RADIUS = 1.4;
const TEE_W = 0.95;
const TEE_H = TEE_W * (330 / 300);
/** Where a tee hangs below the ring, and how far in front of its hanger's bar. */
const TEE_DROP = 0.165;
/** The rack leans towards the visitor, so the ring reads as a ring, not a line. */
const TILT = 0.13;
/** Its own slow turning (rad/s), and the pause after the visitor turns it. */
const DRIFT = -0.045;
const DRIFT_PAUSE = 8;
/** The spring that brings a tee to face the visitor (critically damped). */
const SPRING = 14;
const DAMPING = 2 * Math.sqrt(SPRING);

export interface RackFrame {
  dt: number;
  camera: PerspectiveCamera;
  /**
   * How far the rack's stage is below the middle of the viewport, in px (the
   * real scroll, so the rack follows the stage exactly, with no parallax).
   */
  offset: number;
  viewportHeight: number;
  /** 0 on tall screens, 1 on wide ones (the rack stands further back on phones). */
  wide: number;
}

export interface Rack {
  group: Group;
  update: (frame: RackFrame) => void;
  setAtlas: (atlas: TeeAtlas) => void;
  /** The steel: the ring and the hangers. */
  steel: Mesh[];
  controller: (deps: {
    reduced: () => boolean;
    redraw: () => void;
    viewport: () => { width: number; height: number };
  }) => RackController;
  dispose: () => void;
}

function glowTexture(): CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,0.8)');
    g.addColorStop(0.4, 'rgba(255,255,255,0.22)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

export function createRack(
  steel: Material,
  firstAtlas: TeeAtlas,
  small: boolean,
  onFacing: (index: number) => void,
  hold: number | null,
): Rack {
  const group = new Group();
  const spinner = new Group();
  group.add(spinner);
  group.rotation.x = TILT;

  // ── RING AND HANGERS ── steel, merged: one mesh each
  const ringGeometry = new TorusGeometry(RADIUS, 0.013, 10, small ? 96 : 160).rotateX(Math.PI / 2);
  const ring = new Mesh(ringGeometry, steel);
  spinner.add(ring);
  const m = new Matrix4();
  const hangerParts: BufferGeometry[] = [];
  const rod = (a: Vector3, b: Vector3, r: number): BufferGeometry => {
    const g = new CylinderGeometry(r, r, a.distanceTo(b), 6);
    const dir = b.clone().sub(a).normalize();
    g.applyMatrix4(
      new Matrix4()
        .lookAt(new Vector3(), dir, new Vector3(0, 0, 1))
        .multiply(new Matrix4().makeRotationX(-Math.PI / 2)),
    );
    const mid = a.clone().add(b).multiplyScalar(0.5);
    return g.translate(mid.x, mid.y, mid.z);
  };
  for (let i = 0; i < COUNT; i++) {
    const place = new Matrix4()
      .makeRotationY(i * SPACING)
      .multiply(m.makeTranslation(0, 0, RADIUS));
    const parts = [
      // The hook over the ring, the neck, and the shoulder bar inside the tee
      new TorusGeometry(0.032, 0.0045, 6, 18, Math.PI * 1.35).rotateZ(-0.2).rotateY(Math.PI / 2),
      rod(new Vector3(0, -0.03, 0), new Vector3(0, -0.11, 0), 0.004),
      rod(new Vector3(0, -0.11, 0), new Vector3(-0.4, -0.2, 0), 0.0045),
      rod(new Vector3(0, -0.11, 0), new Vector3(0.4, -0.2, 0), 0.0045),
      rod(new Vector3(-0.4, -0.2, 0), new Vector3(0.4, -0.2, 0), 0.004),
    ];
    parts.forEach((p) => hangerParts.push(p.applyMatrix4(place)));
  }
  const flat = hangerParts.map((g) => g.toNonIndexed());
  const hangerGeometry = mergeGeometries(flat);
  [...hangerParts, ...flat].forEach((g) => {
    g.dispose();
  });
  const hangers = new Mesh(hangerGeometry, steel);
  spinner.add(hangers);

  // ── TEES ── cloth: a plane cut to the mockup's silhouette by the atlas' alpha,
  // swaying from the shoulders in the vertex shader
  const teeGeometry = new PlaneGeometry(TEE_W, TEE_H, small ? 14 : 24, small ? 16 : 28).translate(
    0,
    -TEE_H / 2,
    0,
  );
  const time = { value: 0 };
  let atlas = firstAtlas;
  let baseTexture = new CanvasTexture(atlas.canvas);
  baseTexture.colorSpace = SRGBColorSpace;
  baseTexture.anisotropy = 4;
  interface Tee {
    mesh: Mesh;
    material: MeshStandardMaterial;
    texture: CanvasTexture;
    glow: { value: number };
    back: { value: Vector3 };
  }
  const tees: Tee[] = [];
  const makeTexture = (i: number): CanvasTexture => {
    const cell = atlas.tees[i];
    const texture = baseTexture.clone();
    if (cell) {
      texture.offset.set(cell.u, cell.v);
      texture.repeat.set(cell.w, cell.h);
    }
    texture.needsUpdate = true;
    return texture;
  };
  for (let i = 0; i < COUNT; i++) {
    const cell = atlas.tees[i];
    const texture = makeTexture(i);
    const glow = { value: 0 };
    const backColour = rawColor(cell?.colour === 'white' ? '#f7f5f0' : '#0d0c0e');
    const back = { value: new Vector3(backColour.r, backColour.g, backColour.b) };
    const material = new MeshStandardMaterial({
      map: texture,
      alphaTest: 0.5,
      side: DoubleSide,
      roughness: 0.92,
      metalness: 0,
      envMapIntensity: 0.55,
    });
    const phase = i * 1.7;
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = time;
      shader.uniforms.uGlow = glow;
      shader.uniforms.uBack = back;
      shader.vertexShader = shader.vertexShader
        .replace(
          '#include <common>',
          /* glsl */ `#include <common>
          uniform float uTime;`,
        )
        .replace(
          '#include <beginnormal_vertex>',
          /* glsl */ `
          // 0 at the shoulders, 1 at the hem; the chest bows a little towards the visitor
          float down = clamp(-position.y / ${TEE_H.toFixed(3)}, 0.0, 1.0);
          float across = position.x / ${(TEE_W / 2).toFixed(3)};
          float sway = sin(uTime * 0.8 + ${phase.toFixed(2)}) * down * down;
          float ripple = sin(uTime * 1.6 + ${(phase * 2).toFixed(2)} + position.x * 6.0) * down;
          float bow = 0.05 * (1.0 - across * across);
          vec3 objectNormal = normalize(vec3(
            0.2 * across + ripple * 0.05,
            -sway * 0.25 * down,
            1.0
          ));
          #ifdef USE_TANGENT
            vec3 objectTangent = vec3(tangent.xyz);
          #endif`,
        )
        .replace(
          '#include <begin_vertex>',
          /* glsl */ `#include <begin_vertex>
          transformed.z += bow + sway * 0.11 + ripple * 0.018;
          transformed.x += sway * 0.02 * across;`,
        );
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          /* glsl */ `#include <common>
          uniform float uGlow;
          uniform vec3 uBack;`,
        )
        .replace(
          '#include <map_fragment>',
          /* glsl */ `#include <map_fragment>
          // The back of the tee: plain fabric (the print is on the front)
          if (!gl_FrontFacing) diffuseColor.rgb = uBack;`,
        )
        .replace(
          '#include <opaque_fragment>',
          /* glsl */ `outgoingLight *= 1.0 + 0.35 * uGlow;
          #include <opaque_fragment>`,
        );
    };
    const mesh = new Mesh(teeGeometry, material);
    // Facing outwards from the ring, hanging from its hanger
    mesh.position.set(RADIUS * Math.sin(i * SPACING), -TEE_DROP, RADIUS * Math.cos(i * SPACING));
    mesh.position.addScaledVector(
      new Vector3(Math.sin(i * SPACING), 0, Math.cos(i * SPACING)),
      0.016,
    );
    mesh.rotation.y = i * SPACING;
    spinner.add(mesh);
    tees.push({ mesh, material, texture, glow, back });
  }

  // ── HALO ── a faint rose glow beneath the ring (light, never a fill)
  const haloMap = glowTexture();
  const haloMaterial = new SpriteMaterial({
    map: haloMap,
    color: rawColor('#d65470'),
    blending: AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.2,
  });
  const halo = new Sprite(haloMaterial);
  halo.scale.set(4.4, 1.6, 1);
  halo.position.set(0, -1.45, 0);
  group.add(halo);

  // ── TURNING ──
  let theta = hold !== null ? -hold * SPACING : 0;
  let omega = 0;
  let target: number | null = hold !== null ? theta : null;
  let dragging = false;
  let holding = false;
  let clock = 0;
  let resumeAt = 0;
  let facing = -1;
  let depth = 5.2;
  /** The camera of the last frame (the controller projects and picks with it). */
  let camera: PerspectiveCamera | null = null;

  const nearest = (angle: number) => Math.round(angle / SPACING) * SPACING;
  const facingIndex = () => ((Math.round(-theta / SPACING) % COUNT) + COUNT) % COUNT;
  const reportFacing = () => {
    const index = facingIndex();
    if (index !== facing) {
      facing = index;
      onFacing(index);
    }
  };

  const update = (frame: RackFrame): void => {
    const { dt } = frame;
    camera = frame.camera;
    clock += dt;
    time.value += dt;
    if (hold === null && !dragging) {
      if (target !== null) {
        const a = SPRING * (target - theta) - DAMPING * omega;
        omega += a * dt;
        theta += omega * dt;
        if (Math.abs(target - theta) < 1e-4 && Math.abs(omega) < 1e-3) {
          theta = target;
          omega = 0;
          target = null;
          resumeAt = clock + DRIFT_PAUSE;
        }
      } else if (dt > 0 && !holding && clock > resumeAt) {
        theta += DRIFT * dt;
      }
    }
    spinner.rotation.y = theta;
    // Pinned to its stage on screen: standing this close, the shaft's parallax would
    // carry it faster than the page and open a gap under the heading. Further back on phones
    depth = 7.2 - 2.4 * frame.wide;
    const perPx =
      (2 * depth * Math.tan((Math.PI / 360) * frame.camera.fov)) /
      Math.max(frame.viewportHeight, 1);
    group.position.set(
      0,
      frame.camera.position.y + 0.7 - frame.offset * perPx,
      frame.camera.position.z - depth,
    );
    // Seen from above when low on the screen (and from below when high), the ring's far
    // side would climb into the heading: lean it back by that angle, so it keeps the
    // shape it has when centred wherever the stage is
    const below = frame.camera.position.y - group.position.y;
    group.rotation.x = TILT - (Math.atan2(below, depth) - Math.atan2(-0.7, depth));
    // The facing tee a little brighter
    tees.forEach((tee, i) => {
      const offset = Math.abs(
        Math.atan2(Math.sin(theta + i * SPACING), Math.cos(theta + i * SPACING)),
      );
      tee.glow.value = 1 - Math.min(offset / (SPACING * 0.5), 1);
    });
    reportFacing();
  };

  const raycaster = new Raycaster();
  const ndc = new Vector2();
  const corner = new Vector3();

  return {
    group,
    steel: [ring, hangers],
    update,

    setAtlas(next) {
      const old = baseTexture;
      baseTexture = new CanvasTexture(next.canvas);
      baseTexture.colorSpace = SRGBColorSpace;
      baseTexture.anisotropy = 4;
      atlas = next;
      tees.forEach((tee, i) => {
        tee.texture.dispose();
        tee.texture = makeTexture(i);
        tee.material.map = tee.texture;
        tee.material.needsUpdate = true;
      });
      old.dispose();
    },

    controller({ reduced, redraw, viewport }) {
      /** Ring radius on screen, in px: a drag that far turns the front tee by about a radian. */
      const radiusPx = () => {
        const { height } = viewport();
        return (RADIUS * height) / (2 * Math.tan((Math.PI / 180) * 16) * depth);
      };
      let dragged = 0;
      const pause = () => {
        resumeAt = clock + DRIFT_PAUSE;
      };
      const settle = (to: number) => {
        target = to;
        if (reduced()) {
          theta = to;
          omega = 0;
          target = null;
        }
        pause();
        redraw();
      };
      return {
        drag(dx) {
          if (hold !== null) return;
          if (!dragging) {
            dragging = true;
            dragged = 0;
            target = null;
          }
          dragged += dx;
          // With reduced motion the rack does not follow the finger: it steps on release
          if (!reduced()) theta += dx / radiusPx();
          omega = 0;
          pause();
          redraw();
        },
        release(velocity) {
          if (hold !== null) return;
          dragging = false;
          if (reduced()) {
            if (Math.abs(dragged) > 24) settle(nearest(theta) + (dragged > 0 ? SPACING : -SPACING));
            return;
          }
          omega = velocity / radiusPx();
          // Coast, then ease to the tee nearest where it would come to rest
          settle(nearest(theta + omega * 0.35));
        },
        step(direction) {
          if (hold !== null) return;
          settle((target ?? nearest(theta)) - direction * SPACING);
        },
        goTo(index) {
          if (hold !== null) return;
          const desired = -index * SPACING;
          settle(desired + Math.PI * 2 * Math.round((theta - desired) / (Math.PI * 2)));
        },
        pick(clientX, clientY) {
          if (!group.visible || !camera) return null;
          const { width, height } = viewport();
          ndc.set((clientX / width) * 2 - 1, -(clientY / height) * 2 + 1);
          group.updateMatrixWorld();
          raycaster.setFromCamera(ndc, camera);
          const hits = raycaster.intersectObjects(
            tees.map((t) => t.mesh),
            false,
          );
          const hit = hits[0];
          return hit ? tees.findIndex((t) => t.mesh === hit.object) : null;
        },
        rect(index) {
          const tee = tees[index];
          if (!tee || !camera || !group.visible) return null;
          const { width, height } = viewport();
          group.updateMatrixWorld();
          let left = Infinity;
          let right = -Infinity;
          let top = Infinity;
          let bottom = -Infinity;
          for (const [x, y] of [
            [-TEE_W / 2, 0],
            [TEE_W / 2, 0],
            [-TEE_W / 2, -TEE_H],
            [TEE_W / 2, -TEE_H],
          ] as const) {
            corner.set(x, y, 0).applyMatrix4(tee.mesh.matrixWorld).project(camera);
            const px = ((corner.x + 1) / 2) * width;
            const py = ((1 - corner.y) / 2) * height;
            left = Math.min(left, px);
            right = Math.max(right, px);
            top = Math.min(top, py);
            bottom = Math.max(bottom, py);
          }
          return { left, top, width: right - left, height: bottom - top };
        },
        atRest() {
          return !dragging && target === null && Math.abs(theta - nearest(theta)) < 0.05;
        },
        hold(on) {
          holding = on;
          if (!on) pause();
        },
      };
    },

    dispose() {
      ringGeometry.dispose();
      hangerGeometry.dispose();
      teeGeometry.dispose();
      tees.forEach((tee) => {
        tee.material.dispose();
        tee.texture.dispose();
      });
      baseTexture.dispose();
      haloMap.dispose();
      haloMaterial.dispose();
    },
  };
}
