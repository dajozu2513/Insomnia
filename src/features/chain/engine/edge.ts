import {
  AdditiveBlending,
  CanvasTexture,
  CircleGeometry,
  type BufferGeometry,
  Group,
  type Material,
  Mesh,
  RingGeometry,
  ShaderMaterial,
  Sprite,
  SpriteMaterial,
  SRGBColorSpace,
  Vector3,
} from 'three';

import { FALL_DEPTH, GROUND_Y, HOLE_RADIUS, SHAFT_Z } from './constants';
import { createBarkMaterial, createGroundMaterial } from './fallMaterials';
import { taperedTube } from './fallGeometry';
import { createPocketWatch, type PocketWatch3D } from './pocketWatch';
import { rawColor } from './rawColor';

export interface Edge {
  group: Group;
  watch: PocketWatch3D;
  /** Hides what is above once the camera is deep in the shaft, and fades the deep glow. */
  update: (cameraY: number) => void;
  tick: (dt: number) => void;
  dispose: () => void;
}

/** A point around the hole: x and z relative to the axis, y relative to the ground. */
const at = (x: number, y: number, z: number) => new Vector3(x, GROUND_Y + y, SHAFT_Z + z);

/**
 * The big old roots that frame the opening (the camera stands at +z, looking
 * down towards the axis): one crossing just below the camera, two arching over
 * the near rim on the left and the right, one over the far rim, and a thinner one
 * hanging into the hole. Each starts in the ground and dives into the hole.
 */
const ROOTS: readonly { points: Vector3[]; r0: number; r1: number }[] = [
  // Near left, arching over the rim
  {
    points: [
      at(-5.2, -0.3, 6.2),
      at(-3.6, 0.42, 3.6),
      at(-2.55, 0.34, 2.05),
      at(-2.2, -0.7, 1.35),
      at(-2.1, -4.6, 0.95),
    ],
    r0: 0.55,
    r1: 0.14,
  },
  // Near right, arching over the rim
  {
    points: [
      at(6.0, -0.3, 3.4),
      at(3.9, 0.5, 2.1),
      at(2.75, 0.34, 1.05),
      at(2.4, -0.9, 0.45),
      at(2.25, -5.2, -0.1),
    ],
    r0: 0.52,
    r1: 0.12,
  },
  // Across the foreground, just below the camera; the watch lies on it
  {
    points: [
      at(-4.0, -0.2, 4.9),
      at(-1.4, 0.32, 3.55),
      at(0.7, 0.28, 3.15),
      at(1.75, 0.12, 2.5),
      at(2.1, -1.3, 1.6),
      at(2.05, -3.6, 1.2),
    ],
    r0: 0.34,
    r1: 0.08,
  },
  // Over the far rim
  {
    points: [
      at(-2.2, -0.35, -7.0),
      at(-1.2, 0.2, -4.0),
      at(-0.6, 0.16, -2.85),
      at(-0.35, -0.9, -2.45),
      at(-0.2, -4.0, -2.3),
    ],
    r0: 0.5,
    r1: 0.14,
  },
  // A thinner one hanging into the hole from the left rim
  {
    points: [
      at(-3.6, -0.2, -1.6),
      at(-2.85, 0.2, -0.85),
      at(-2.45, -0.6, -0.5),
      at(-2.3, -3.4, -0.3),
    ],
    r0: 0.24,
    r1: 0.05,
  },
];

/** Where the watch lies: on the foreground root, near the rim, in frame on every screen. */
const WATCH_POSITION = at(1.05, 0.5, 2.93);

/** A soft round glow drawn on a canvas, for the rose light far down the hole. */
function glowTexture(): CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.7)');
    g.addColorStop(0.3, 'rgba(255,255,255,0.3)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/**
 * The edge of the hole (shot 1) and what belongs to its mouth: the earth with
 * a little moss, the big roots, the pocket watch, the small disc of dusk sky
 * seen from inside the hole, and a faint rose glow far below.
 */
export function createEdge(steel: Material, linkGeometry: BufferGeometry): Edge {
  const group = new Group();
  const geometries: BufferGeometry[] = [];

  // Ground: a wide ring around the mouth, facing up (invisible from inside the hole)
  const groundGeometry = new RingGeometry(HOLE_RADIUS, 46, 128, 10);
  groundGeometry.rotateX(-Math.PI / 2);
  groundGeometry.translate(0, GROUND_Y, SHAFT_Z);
  geometries.push(groundGeometry);
  const groundMaterial = createGroundMaterial();
  group.add(new Mesh(groundGeometry, groundMaterial));

  // The big roots
  const bark = createBarkMaterial();
  for (const root of ROOTS) {
    const geometry = taperedTube(root.points, root.r0, root.r1, 64, 14);
    geometries.push(geometry);
    group.add(new Mesh(geometry, bark));
  }

  // The watch on its root, tilted to the root's curve
  const watch = createPocketWatch(steel, linkGeometry);
  watch.group.position.copy(WATCH_POSITION);
  watch.group.rotation.set(-0.12, 0.65, 0.18);
  watch.group.scale.setScalar(0.62);
  group.add(watch.group);

  // The mouth seen from below: a small disc of dusk sky, facing down (so from
  // above, where it would cover the hole, it is never drawn)
  const skyGeometry = new CircleGeometry(HOLE_RADIUS * 1.04, 64);
  skyGeometry.rotateX(Math.PI / 2);
  skyGeometry.translate(0, GROUND_Y + 0.02, SHAFT_Z);
  geometries.push(skyGeometry);
  const skyMaterial = new ShaderMaterial({
    uniforms: {
      uCentre: { value: rawColor('#34324a') },
      uRim: { value: rawColor('#5e3e4c') },
      uAxisZ: { value: SHAFT_Z },
      uRadius: { value: HOLE_RADIUS },
    },
    vertexShader: /* glsl */ `
      varying vec3 vP;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.0);
        vP = wp.xyz;
        gl_Position = projectionMatrix * viewMatrix * wp;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uCentre;
      uniform vec3 uRim;
      uniform float uAxisZ;
      uniform float uRadius;
      varying vec3 vP;
      void main() {
        float d = length(vec2(vP.x, vP.z - uAxisZ)) / uRadius;
        gl_FragColor = vec4(mix(uCentre, uRim, smoothstep(0.2, 1.0, d)), 1.0);
      }
    `,
  });
  group.add(new Mesh(skyGeometry, skyMaterial));

  // The rose glow far below, seen down the hole (not fogged: it is the light itself)
  const glowMap = glowTexture();
  const glowMaterial = new SpriteMaterial({
    map: glowMap,
    color: rawColor('#d65470'),
    blending: AdditiveBlending,
    depthWrite: false,
    fog: false,
    transparent: true,
    opacity: 0.32,
    toneMapped: false,
  });
  const deepGlow = new Sprite(glowMaterial);
  deepGlow.position.set(0, GROUND_Y - FALL_DEPTH - 30, SHAFT_Z);
  deepGlow.scale.setScalar(40);
  const deepGlowGroup = new Group();
  deepGlowGroup.add(deepGlow);

  // The deep glow lives outside `group`, which is hidden once the camera is deep
  const root = new Group();
  root.add(group);
  root.add(deepGlowGroup);

  return {
    group: root,
    watch,
    update(cameraY) {
      group.visible = cameraY > GROUND_Y - 45;
      const distance = Math.abs(cameraY - deepGlow.position.y);
      glowMaterial.opacity = 0.32 * Math.min(Math.max((distance - 8) / 32, 0), 1);
      deepGlow.visible = glowMaterial.opacity > 0.01 && cameraY > deepGlow.position.y;
    },
    tick(dt) {
      watch.tick(dt);
    },
    dispose() {
      geometries.forEach((g) => {
        g.dispose();
      });
      groundMaterial.dispose();
      bark.dispose();
      skyMaterial.dispose();
      glowMap.dispose();
      glowMaterial.dispose();
      watch.dispose();
    },
  };
}
