import {
  AdditiveBlending,
  BoxGeometry,
  type BufferGeometry,
  CanvasTexture,
  CylinderGeometry,
  DoubleSide,
  Group,
  InstancedMesh,
  LatheGeometry,
  type Material,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  type PerspectiveCamera,
  PlaneGeometry,
  Quaternion,
  SphereGeometry,
  SRGBColorSpace,
  Sprite,
  SpriteMaterial,
  Vector2,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

import { chessboardTexture } from '../floor';
import { ROOM, SMALL_DOOR, roomOrigin, type LandingMap } from '../landing';
import type { PropKit } from './props';

/*
 * The landing (step 13; docs/brand/design-direction.md, "The landing"): a long,
 * low hall built from Lewis Carroll's description, in our own design. Closed
 * doors all around (dark wood, simple Victorian panels, thin steel handles), a
 * few lamps hanging from the ceiling, a three-legged glass table with a tiny
 * steel key and the bottle beside it, and, low in the back wall, a small door
 * half hidden by a short curtain, a thin line of pale light under it. The floor
 * is the chessboard.
 *
 * Built upright in room units (floor at y 0, open at its near end) and placed
 * turned half a turn about z (landing.ts), so it hangs upside down below the
 * falling visitor. The lamps' warm light is added in the materials' shaders
 * (onBeforeCompile), not as scene lights, so nothing else in the scene changes.
 */

const LAMPS: readonly [number, number, number][] = [
  [0, 2.42, -2.4],
  [0, 2.42, -6.2],
  [0, 2.42, -9.7],
];
/** Warm lamp light, and the pale light from the garden under the small door. */
const LAMP_LIGHT = new Vector3(1.0, 0.76, 0.5).multiplyScalar(1.5);
const GARDEN_LIGHT = new Vector3(0.82, 0.92, 0.76).multiplyScalar(0.55);

export interface Hall {
  group: Group;
  update: (camera: PerspectiveCamera, landing: LandingMap) => void;
  /** Steel: the door handles, the curtain rod and the key on the table. */
  steel: Mesh[];
  dispose: () => void;
}

/** Dark wood with long, slightly wavering grain, drawn on a canvas. */
function woodTexture(): CanvasTexture {
  const w = 128;
  const h = 512;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#5a4130';
    ctx.fillRect(0, 0, w, h);
    let seed = 3;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    for (let i = 0; i < 70; i++) {
      const x = random() * w;
      const shade = random() < 0.5 ? 'rgba(30, 18, 10, ' : 'rgba(120, 90, 62, ';
      ctx.strokeStyle = `${shade}${(0.08 + random() * 0.18).toFixed(2)})`;
      ctx.lineWidth = 0.6 + random() * 2.2;
      ctx.beginPath();
      for (let y = 0; y <= h; y += 16) {
        const wx = x + Math.sin(y * 0.02 + i) * 2.5;
        if (y === 0) ctx.moveTo(wx, y);
        else ctx.lineTo(wx, y);
      }
      ctx.stroke();
    }
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

/** A soft round glow (lamp halos, the light on the floor before the small door). */
function glowTexture(): CanvasTexture {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.35, 'rgba(255,255,255,0.25)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, size, size);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

/** A geometry with a transform baked in, for merging. */
function baked(geometry: BufferGeometry, matrix: Matrix4): BufferGeometry {
  geometry.applyMatrix4(matrix);
  return geometry;
}

function merge(parts: BufferGeometry[]): BufferGeometry {
  const flat = parts.map((g) => {
    const f = g.index ? g.toNonIndexed() : g.clone();
    for (const name of Object.keys(f.attributes)) {
      if (name !== 'position' && name !== 'normal' && name !== 'uv') f.deleteAttribute(name);
    }
    return f;
  });
  const merged = mergeGeometries(flat);
  [...parts, ...flat].forEach((g) => {
    g.dispose();
  });
  return merged;
}

export function createHall(kit: PropKit, steel: Material, small: boolean): Hall {
  const group = new Group();
  const geometries: BufferGeometry[] = [];
  const keep = <T extends BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const m = new Matrix4();

  // ── LAMP LIGHT ── added to the hall's own materials, in view space
  const lampView = Array.from({ length: LAMPS.length + 1 }, () => new Vector3());
  const lampColour = [...LAMPS.map(() => LAMP_LIGHT), GARDEN_LIGHT];
  const lit = <T extends MeshStandardMaterial>(material: T): T => {
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uLampView = { value: lampView };
      shader.uniforms.uLampColour = { value: lampColour };
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <common>',
          `#include <common>
          uniform vec3 uLampView[${String(lampView.length)}];
          uniform vec3 uLampColour[${String(lampView.length)}];`,
        )
        .replace(
          '#include <opaque_fragment>',
          /* glsl */ `
          vec3 lampP = -vViewPosition;
          vec3 lampN = normalize(normal);
          vec3 lampSum = vec3(0.05, 0.047, 0.044);
          for (int i = 0; i < ${String(lampView.length)}; i++) {
            vec3 toLamp = uLampView[i] - lampP;
            float d2 = dot(toLamp, toLamp);
            float facing = max(dot(lampN, normalize(toLamp)), 0.0) * 0.75 + 0.25;
            lampSum += uLampColour[i] * facing / (1.0 + d2 * 0.42);
          }
          outgoingLight += lampSum * diffuseColor.rgb;
          #include <opaque_fragment>`,
        );
    };
    return material;
  };

  const woodMap = woodTexture();
  const wood = lit(
    new MeshStandardMaterial({
      map: woodMap,
      color: 0x8a6a55,
      roughness: 0.5,
      envMapIntensity: 0.35,
    }),
  );
  const wall = lit(
    new MeshStandardMaterial({
      color: 0x3a3236,
      roughness: 0.92,
      side: DoubleSide,
      envMapIntensity: 0.2,
    }),
  );
  const ceiling = lit(
    new MeshStandardMaterial({
      color: 0x241f23,
      roughness: 0.95,
      side: DoubleSide,
      envMapIntensity: 0.15,
    }),
  );
  const floorMap = chessboardTexture(4, ROOM.width / 1.0, (ROOM.near - ROOM.back) / 1.0);
  const floor = lit(
    new MeshStandardMaterial({
      map: floorMap,
      roughness: 0.3,
      side: DoubleSide,
      envMapIntensity: 0.45,
    }),
  );
  const cloth = lit(
    new MeshStandardMaterial({
      color: 0x3a4036,
      roughness: 0.95,
      side: DoubleSide,
      envMapIntensity: 0.1,
    }),
  );
  const cord = new MeshStandardMaterial({ color: 0x1a1719, roughness: 0.6 });
  const bulb = new MeshBasicMaterial({ color: 0xffd9a8 });
  const shade = new MeshStandardMaterial({
    color: 0xe8e1d3,
    roughness: 0.35,
    side: DoubleSide,
    emissive: 0x6b5236,
  });
  const glowMap = glowTexture();
  const lampGlow = new SpriteMaterial({
    map: glowMap,
    color: 0xffcf96,
    blending: AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.55,
  });
  const gardenGlow = new MeshBasicMaterial({
    map: glowMap,
    color: 0xe9f2d8,
    blending: AdditiveBlending,
    depthWrite: false,
    transparent: true,
    opacity: 0.6,
  });
  const gardenLine = new MeshBasicMaterial({ color: 0xf2f5e3 });
  const materials: Material[] = [
    wood,
    wall,
    ceiling,
    floor,
    cloth,
    cord,
    bulb,
    shade,
    lampGlow,
    gardenGlow,
    gardenLine,
  ];

  // ── SHELL ── floor, walls and ceiling (both sides: from outside it reads as a closed box)
  const length = ROOM.near - ROOM.back;
  const midZ = (ROOM.near + ROOM.back) / 2;
  const floorGeometry = keep(
    new PlaneGeometry(ROOM.width, length).rotateX(-Math.PI / 2).translate(0, 0, midZ),
  );
  group.add(new Mesh(floorGeometry, floor));
  const ceilingGeometry = keep(
    new PlaneGeometry(ROOM.width, length).rotateX(Math.PI / 2).translate(0, ROOM.height, midZ),
  );
  group.add(new Mesh(ceilingGeometry, ceiling));
  const wallsGeometry = keep(
    merge([
      new PlaneGeometry(length, ROOM.height)
        .rotateY(Math.PI / 2)
        .translate(-ROOM.width / 2, ROOM.height / 2, midZ),
      new PlaneGeometry(length, ROOM.height)
        .rotateY(-Math.PI / 2)
        .translate(ROOM.width / 2, ROOM.height / 2, midZ),
      new PlaneGeometry(ROOM.width, ROOM.height).translate(0, ROOM.height / 2, ROOM.back),
    ]),
  );
  group.add(new Mesh(wallsGeometry, wall));
  // Skirting and a picture rail in dark wood
  const trimGeometry = keep(
    merge(
      [0.07, 2.6].flatMap((y) => {
        const h = y < 1 ? 0.14 : 0.05;
        return [
          new BoxGeometry(0.03, h, length).translate(-ROOM.width / 2 + 0.015, y, midZ),
          new BoxGeometry(0.03, h, length).translate(ROOM.width / 2 - 0.015, y, midZ),
          new BoxGeometry(ROOM.width, h, 0.03).translate(0, y, ROOM.back + 0.015),
        ];
      }),
    ),
  );
  group.add(new Mesh(trimGeometry, wood));

  // ── DOORS ── one wooden door (four raised panels, frame) and its steel handle,
  // instanced around the walls; the small door is the same door, small
  const doorWood = keep(
    merge([
      new BoxGeometry(0.95, 2.2, 0.05).translate(0, 1.1, 0),
      ...[-0.2, 0.2].flatMap((x) => [
        new BoxGeometry(0.33, 0.78, 0.022).translate(x, 1.62, 0.032),
        new BoxGeometry(0.33, 0.62, 0.022).translate(x, 0.56, 0.032),
      ]),
      new BoxGeometry(0.08, 2.3, 0.07).translate(-0.515, 1.15, 0.01),
      new BoxGeometry(0.08, 2.3, 0.07).translate(0.515, 1.15, 0.01),
      new BoxGeometry(1.11, 0.09, 0.07).translate(0, 2.345, 0.01),
    ]),
  );
  const doorSteel = keep(
    merge([
      new SphereGeometry(0.032, 14, 10).translate(0.36, 1.0, 0.085),
      baked(
        new CylinderGeometry(0.011, 0.011, 0.05, 10),
        m.makeRotationX(Math.PI / 2).setPosition(0.36, 1.0, 0.05),
      ),
      baked(
        new CylinderGeometry(0.03, 0.03, 0.006, 20),
        m.makeRotationX(Math.PI / 2).setPosition(0.36, 1.0, 0.03),
      ),
    ]),
  );
  const doorPlaces: Matrix4[] = [];
  const q = new Quaternion();
  const up = new Vector3(0, 1, 0);
  const one = new Vector3(1, 1, 1);
  for (const z of [-1.3, -3.7, -6.1, -8.5, -10.9]) {
    doorPlaces.push(
      new Matrix4().compose(
        new Vector3(-ROOM.width / 2 + 0.03, 0, z),
        q.setFromAxisAngle(up, Math.PI / 2),
        one,
      ),
    );
    doorPlaces.push(
      new Matrix4().compose(
        new Vector3(ROOM.width / 2 - 0.03, 0, z),
        q.setFromAxisAngle(up, -Math.PI / 2),
        one,
      ),
    );
  }
  for (const x of [-1.9, 1.9]) {
    doorPlaces.push(new Matrix4().compose(new Vector3(x, 0, ROOM.back + 0.03), q.identity(), one));
  }
  // The small door: low in the back wall, facing the visitor
  doorPlaces.push(
    new Matrix4().compose(
      new Vector3(SMALL_DOOR.x, 0.016, ROOM.back + 0.03),
      q.identity(),
      new Vector3(SMALL_DOOR.width / 0.95, SMALL_DOOR.height / 2.2, 0.7),
    ),
  );
  const doors = new InstancedMesh(doorWood, wood, doorPlaces.length);
  const handles = new InstancedMesh(doorSteel, steel, doorPlaces.length);
  doorPlaces.forEach((place, i) => {
    doors.setMatrixAt(i, place);
    handles.setMatrixAt(i, place);
  });
  group.add(doors, handles);

  // ── THE SMALL DOOR ── a short curtain on a steel rod, half hiding it, and the
  // thin line of pale light under it (the garden beyond)
  const rodGeometry = keep(
    baked(
      new CylinderGeometry(0.008, 0.008, 0.7, 8),
      m.makeRotationZ(Math.PI / 2).setPosition(0, 0.74, ROOM.back + 0.09),
    ),
  );
  const rod = new Mesh(rodGeometry, steel);
  group.add(rod);
  const curtainGeometry = keep(new PlaneGeometry(0.34, 0.5, small ? 10 : 18, 3));
  {
    const position = curtainGeometry.getAttribute('position');
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      // Soft folds, gathered more at the rod
      position.setZ(i, Math.sin(x * 46) * (0.012 + 0.006 * (y + 0.25)));
    }
    curtainGeometry.computeVertexNormals();
    curtainGeometry.translate(-0.12, 0.48, ROOM.back + 0.1);
  }
  group.add(new Mesh(curtainGeometry, cloth));
  const lineGeometry = keep(
    new PlaneGeometry(SMALL_DOOR.width * 0.86, 0.012).translate(0, 0.008, ROOM.back + 0.06),
  );
  group.add(new Mesh(lineGeometry, gardenLine));
  const pool = new Mesh(
    keep(new PlaneGeometry(1.1, 0.7).rotateX(-Math.PI / 2).translate(0, 0.004, ROOM.back + 0.36)),
    gardenGlow,
  );
  group.add(pool);

  // ── LAMPS ── a cord, a bone porcelain shade, a warm bulb and its halo
  const shadeGeometry = keep(
    new LatheGeometry(
      [
        new Vector2(0.03, 0.2),
        new Vector2(0.06, 0.18),
        new Vector2(0.16, 0.06),
        new Vector2(0.21, 0),
      ],
      small ? 16 : 28,
    ).translate(0, -0.06, 0),
  );
  const cordGeometry = keep(new CylinderGeometry(0.006, 0.006, 1, 6).translate(0, 0.5, 0));
  const bulbGeometry = keep(new SphereGeometry(0.055, 14, 10));
  LAMPS.forEach(([x, y, z]) => {
    const lamp = new Group();
    lamp.position.set(x, y, z);
    const lampCord = new Mesh(cordGeometry, cord);
    lampCord.position.y = 0.12;
    lampCord.scale.y = ROOM.height - y - 0.12;
    const halo = new Sprite(lampGlow);
    halo.scale.setScalar(0.9);
    lamp.add(lampCord, new Mesh(shadeGeometry, shade), new Mesh(bulbGeometry, bulb), halo);
    group.add(lamp);
  });

  // ── THE TABLE, THE KEY AND THE BOTTLE ──
  const table = kit.makeTable();
  table.position.set(-0.95, 0, -10.6);
  group.add(table);
  const key = kit.makeKey();
  key.scale.setScalar(0.55);
  key.rotation.set(-Math.PI / 2, 0, 0.5);
  key.position.set(-1.0, 0.738, -10.55);
  group.add(key);
  const bottle = kit.makeBottle();
  bottle.scale.setScalar(0.85);
  bottle.rotation.y = 0.35;
  bottle.position.set(-0.56, 0.3 * 0.85, -11.15);
  group.add(bottle);

  const world = new Vector3();
  const origin = new Vector3();
  const lampsWorld = [
    ...LAMPS.map(([x, y, z]) => new Vector3(x, y, z)),
    new Vector3(0, 0.05, ROOM.back + 0.25),
  ];

  return {
    group,
    steel: [handles, rod, key],
    update(camera, landing) {
      roomOrigin(landing, origin);
      group.position.copy(origin);
      group.rotation.set(0, 0, Math.PI);
      group.updateMatrixWorld();
      camera.updateMatrixWorld();
      lampsWorld.forEach((p, i) => {
        world.copy(p).applyMatrix4(group.matrixWorld).applyMatrix4(camera.matrixWorldInverse);
        lampView[i]?.copy(world);
      });
    },
    dispose() {
      geometries.forEach((g) => {
        g.dispose();
      });
      materials.forEach((material) => {
        material.dispose();
      });
      doors.dispose();
      handles.dispose();
      woodMap.dispose();
      floorMap.dispose();
      glowMap.dispose();
    },
  };
}
