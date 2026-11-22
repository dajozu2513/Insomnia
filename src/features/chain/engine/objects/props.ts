import {
  BoxGeometry,
  BufferGeometry,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  LatheGeometry,
  type Material,
  Matrix4,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  PlaneGeometry,
  Shape,
  ExtrudeGeometry,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
} from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

import type { FallLabels } from '../../types';
import { taperedTube } from '../fallGeometry';
import { createLabelTexture, currantPoints } from './textures';

/*
 * The objects of the fall (docs/brand/design-direction.md, "The objects of the
 * fall"), built from lathes, tubes, boxes and extruded outlines: no model files,
 * designed for this site. Geometries and materials are made once per kit and
 * shared by every copy; make*() only adds meshes. Local units: about 1 unit is
 * 10 cm of the real object, the piano a little smaller than life.
 */

const v2 = (x: number, y: number) => new Vector2(x, y);

/** A geometry with a transform baked in, for merging. */
function baked(geometry: BufferGeometry, matrix: Matrix4): BufferGeometry {
  geometry.applyMatrix4(matrix);
  return geometry;
}

const MERGED_ATTRIBUTES = new Set(['position', 'normal', 'uv']);

/** Merges parts into one geometry (non-indexed; position, normal and uv), disposing the parts. */
function merge(parts: BufferGeometry[]): BufferGeometry {
  const flat = parts.map((g) => {
    const f = g.index ? g.toNonIndexed() : g.clone();
    for (const name of Object.keys(f.attributes)) {
      if (!MERGED_ATTRIBUTES.has(name)) f.deleteAttribute(name);
    }
    return f;
  });
  const merged = mergeGeometries(flat);
  parts.forEach((g) => {
    g.dispose();
  });
  flat.forEach((g) => {
    g.dispose();
  });
  return merged;
}

/** A thin cylinder from a to b (strings, stems, props). */
function rod(a: Vector3, b: Vector3, radius: number, segments = 6): BufferGeometry {
  const length = a.distanceTo(b);
  const geometry = new CylinderGeometry(radius, radius, length, segments);
  const mid = a.clone().add(b).multiplyScalar(0.5);
  const dir = b.clone().sub(a).normalize();
  const m = new Matrix4().lookAt(new Vector3(), dir, new Vector3(0, 0, 1));
  // CylinderGeometry runs along y; lookAt points -z at dir: turn y onto -z first
  geometry.rotateX(-Math.PI / 2);
  geometry.applyMatrix4(m);
  geometry.translate(mid.x, mid.y, mid.z);
  return geometry;
}

export interface PropKit {
  makeBottle: () => Group;
  makeCake: () => Group;
  makeTeapot: () => Group;
  makeCup: (tea: boolean) => Group;
  makeKey: () => Mesh;
  /** One floating drop of tea. */
  makeDrop: () => Mesh;
  makeRose: () => Group;
  makeBook: () => Group;
  makePiano: () => Group;
  /** A small three-legged glass table (the landing). */
  makeTable: () => Group;
  /** Steel meshes made so far (keys), for the steel measurement. */
  steelMeshes: Mesh[];
  /** Redraws the bottle's tag and rebuilds the cake's currants in the site language. */
  setLabels: (labels: FallLabels) => void;
  dispose: () => void;
}

export function createPropKit(steel: Material, small: boolean): PropKit {
  const lathe = small ? 20 : 36;
  const geometries: BufferGeometry[] = [];
  const keep = <T extends BufferGeometry>(g: T): T => {
    geometries.push(g);
    return g;
  };
  const m = new Matrix4();

  // ── MATERIALS ──
  const porcelain = new MeshStandardMaterial({
    color: 0xe8e1d3,
    roughness: 0.3,
    metalness: 0,
    envMapIntensity: 0.8,
  });
  const glaze = new MeshStandardMaterial({ color: 0x2a2428, roughness: 0.35 });
  const glass = new MeshStandardMaterial({
    color: 0xdfe6e2,
    roughness: 0.04,
    metalness: 0,
    transparent: true,
    opacity: 0.14,
    depthWrite: false,
    side: DoubleSide,
    envMapIntensity: 1.8,
  });
  // Fake glass: no transmission pass; the edges, seen at a grazing angle, turn
  // opaque enough to show the studio's reflections (a fresnel term on alpha)
  glass.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <opaque_fragment>',
      /* glsl */ `
        float facing = abs(dot(normalize(normal), normalize(vViewPosition)));
        float fresnel = pow(1.0 - facing, 2.5);
        gl_FragColor = vec4(outgoingLight, clamp(diffuseColor.a + fresnel * 0.75, 0.0, 1.0));
      `,
    );
  };
  const cork = new MeshStandardMaterial({ color: 0x9a7a55, roughness: 0.9 });
  const label = createLabelTexture();
  const paper = new MeshStandardMaterial({ map: label.texture, roughness: 0.85, side: DoubleSide });
  const string = new MeshStandardMaterial({ color: 0x5b5048, roughness: 0.9 });
  const sponge = new MeshStandardMaterial({ color: 0xc9a979, roughness: 0.85 });
  const icing = new MeshStandardMaterial({ color: 0xf1ece2, roughness: 0.45 });
  const currant = new MeshStandardMaterial({ color: 0x1c1216, roughness: 0.35 });
  const tea = new MeshStandardMaterial({ color: 0x4a2a16, roughness: 0.12 });
  const petal = new MeshStandardMaterial({ color: 0x8c1d2c, roughness: 0.55, side: DoubleSide });
  const leaf = new MeshStandardMaterial({ color: 0x2b3826, roughness: 0.6, side: DoubleSide });
  const cover = new MeshStandardMaterial({ color: 0x2a2326, roughness: 0.75 });
  const pageBlock = new MeshStandardMaterial({ color: 0xe4dccb, roughness: 0.9 });
  const lacquer = new MeshPhysicalMaterial({
    color: 0x0c0b0d,
    roughness: 0.3,
    metalness: 0,
    clearcoat: 0.8,
    clearcoatRoughness: 0.1,
    envMapIntensity: 0.4,
  });
  const ivory = new MeshStandardMaterial({ color: 0xece6d8, roughness: 0.4 });
  const materials: Material[] = [
    porcelain,
    glaze,
    glass,
    cork,
    paper,
    string,
    sponge,
    icing,
    currant,
    tea,
    petal,
    leaf,
    cover,
    pageBlock,
    lacquer,
    ivory,
  ];

  // ── BOTTLE ── a small glass bottle, a cork, and a paper tag on a string
  const bottleGlass = keep(
    new LatheGeometry(
      [
        v2(0, 0),
        v2(0.17, 0),
        v2(0.19, 0.02),
        v2(0.2, 0.06),
        v2(0.2, 0.3),
        v2(0.18, 0.36),
        v2(0.12, 0.42),
        v2(0.066, 0.46),
        v2(0.06, 0.56),
        v2(0.072, 0.58),
        v2(0.066, 0.6),
      ],
      lathe,
    ),
  );
  const corkGeometry = keep(new CylinderGeometry(0.06, 0.052, 0.1, 16).translate(0, 0.62, 0));
  const tagGeometry = keep(new PlaneGeometry(0.28, 0.14));
  const stringGeometry = keep(
    merge([
      rod(new Vector3(0.06, 0.5, 0), new Vector3(0.13, 0.4, 0.07), 0.004),
      baked(
        new TorusGeometry(0.064, 0.004, 4, 20),
        m.makeRotationX(Math.PI / 2).setPosition(0, 0.5, 0),
      ),
    ]),
  );

  // ── CAKE ── a small round cake on a little plate, spelled on top in currants
  const plateGeometry = keep(
    new LatheGeometry(
      [
        v2(0, 0),
        v2(0.42, 0),
        v2(0.5, 0.02),
        v2(0.57, 0.05),
        v2(0.565, 0.058),
        v2(0.49, 0.032),
        v2(0, 0.036),
      ],
      lathe,
    ),
  );
  const spongeGeometry = keep(new CylinderGeometry(0.38, 0.38, 0.2, lathe).translate(0, 0.136, 0));
  const icingGeometry = keep(new CylinderGeometry(0.392, 0.392, 0.03, lathe).translate(0, 0.25, 0));
  const currantShape = new IcosahedronGeometry(0.012, 0);
  let currantsGeometry: BufferGeometry = new BufferGeometry();
  const buildCurrants = (text: string): void => {
    currantsGeometry.dispose();
    const parts = currantPoints(text).map(([x, y]) =>
      baked(currantShape.clone(), m.makeTranslation(x * 0.31, 0.268, -y * 0.31)),
    );
    currantsGeometry = parts.length ? merge(parts) : new BufferGeometry();
    for (const mesh of currantMeshes) mesh.geometry = currantsGeometry;
  };
  const currantMeshes: Mesh[] = [];

  // ── TEAPOT ── bone porcelain, a dark glazed line at the lid and the foot
  const teapotBody = keep(
    merge([
      new LatheGeometry(
        [
          v2(0, 0),
          v2(0.2, 0),
          v2(0.3, 0.04),
          v2(0.36, 0.14),
          v2(0.37, 0.22),
          v2(0.33, 0.33),
          v2(0.24, 0.4),
          v2(0.17, 0.42),
          v2(0.17, 0.43),
        ],
        lathe,
      ),
      new LatheGeometry([v2(0.175, 0.43), v2(0.16, 0.47), v2(0.08, 0.5), v2(0, 0.51)], lathe),
      new SphereGeometry(0.045, 12, 8).translate(0, 0.54, 0),
      taperedTube(
        [
          new Vector3(0.28, 0.12, 0),
          new Vector3(0.44, 0.2, 0),
          new Vector3(0.54, 0.34, 0),
          new Vector3(0.6, 0.42, 0),
        ],
        0.075,
        0.034,
        20,
        10,
      ),
      baked(
        new TorusGeometry(0.15, 0.028, 10, 24, Math.PI * 1.05),
        m.makeRotationZ(Math.PI / 2 - 0.08).setPosition(-0.34, 0.22, 0),
      ),
    ]),
  );
  const teapotTrim = keep(
    merge([
      baked(
        new TorusGeometry(0.172, 0.007, 6, lathe),
        m.makeRotationX(Math.PI / 2).setPosition(0, 0.432, 0),
      ),
      baked(
        new TorusGeometry(0.205, 0.007, 6, lathe),
        m.makeRotationX(Math.PI / 2).setPosition(0, 0.006, 0),
      ),
    ]),
  );

  // ── CUP AND SAUCER ──
  const cupGeometry = keep(
    merge([
      new LatheGeometry(
        [
          v2(0, 0),
          v2(0.12, 0),
          v2(0.13, 0.01),
          v2(0.17, 0.08),
          v2(0.2, 0.2),
          v2(0.205, 0.205),
          v2(0.195, 0.205),
          v2(0.19, 0.2),
          v2(0.16, 0.09),
          v2(0.11, 0.025),
          v2(0, 0.025),
        ],
        lathe,
      ).translate(0, 0.02, 0),
      baked(
        new TorusGeometry(0.055, 0.014, 8, 16, Math.PI * 1.1),
        m.makeRotationZ(Math.PI / 2 - 0.15).setPosition(-0.19, 0.14, 0),
      ),
      new LatheGeometry(
        [
          v2(0, 0),
          v2(0.16, 0),
          v2(0.3, 0.035),
          v2(0.33, 0.05),
          v2(0.325, 0.056),
          v2(0.28, 0.042),
          v2(0.15, 0.016),
          v2(0, 0.02),
        ],
        lathe,
      ),
    ]),
  );
  const cupTrim = keep(
    merge([
      baked(
        new TorusGeometry(0.2, 0.005, 6, lathe),
        m.makeRotationX(Math.PI / 2).setPosition(0, 0.226, 0),
      ),
      baked(
        new TorusGeometry(0.327, 0.005, 6, lathe),
        m.makeRotationX(Math.PI / 2).setPosition(0, 0.054, 0),
      ),
    ]),
  );
  const teaSurface = keep(
    new CircleGeometry(0.178, lathe).rotateX(-Math.PI / 2).translate(0, 0.19, 0),
  );
  const dropGeometry = keep(new SphereGeometry(0.022, 10, 8).scale(1, 1.35, 1));

  // ── KEY ── a small antique key: an open bow with a ring inside, a shaft and a bit
  const keyGeometry = keep(
    merge([
      new TorusGeometry(0.085, 0.016, 8, 28),
      new TorusGeometry(0.038, 0.008, 6, 20),
      baked(
        new CylinderGeometry(0.016, 0.016, 0.42, 10),
        m.makeRotationZ(Math.PI / 2).setPosition(0.3, 0, 0),
      ),
      baked(
        new CylinderGeometry(0.026, 0.026, 0.035, 12),
        m.makeRotationZ(Math.PI / 2).setPosition(0.115, 0, 0),
      ),
      new BoxGeometry(0.05, 0.1, 0.018).translate(0.44, -0.06, 0),
      new BoxGeometry(0.026, 0.065, 0.018).translate(0.488, -0.042, 0),
    ]),
  );
  const steelMeshes: Mesh[] = [];

  // ── ROSE ── petals in a spiral, opening outwards; a stem and two leaves
  const petalShape = new PlaneGeometry(0.11, 0.13, 4, 5).translate(0, 0.065, 0);
  {
    const position = petalShape.getAttribute('position');
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i);
      const y = position.getY(i);
      const t = y / 0.13;
      // Cupped towards the flower's heart, the tip curling back out
      position.setZ(i, 3.2 * x * x - 0.035 * t * t * t);
    }
    petalShape.computeVertexNormals();
  }
  const petalCount = small ? 13 : 18;
  const petals: BufferGeometry[] = [];
  for (let i = 0; i < petalCount; i++) {
    const k = i / (petalCount - 1);
    const pm = new Matrix4()
      .makeRotationY(i * 2.39996)
      .multiply(new Matrix4().makeTranslation(0, 0, -(0.006 + 0.03 * k)))
      .multiply(new Matrix4().makeRotationX(-(0.12 + 0.95 * k * k)))
      .multiply(new Matrix4().makeScale(0.5 + 0.65 * k, 0.55 + 0.5 * k, 1));
    petals.push(baked(petalShape.clone(), pm));
  }
  petalShape.dispose();
  const roseHead = keep(merge(petals));
  const leafShape = new PlaneGeometry(0.1, 0.05, 3, 1);
  const roseStem = keep(
    merge([
      taperedTube(
        [new Vector3(0, 0.01, 0), new Vector3(0.01, -0.25, 0.02), new Vector3(0.03, -0.55, 0.03)],
        0.012,
        0.008,
        16,
        6,
      ),
      baked(leafShape.clone(), m.makeRotationZ(-0.5).setPosition(0.06, -0.24, 0.02)),
      baked(
        leafShape.clone(),
        m
          .makeRotationZ(0.6)
          .multiply(new Matrix4().makeRotationY(0.8))
          .setPosition(-0.04, -0.36, 0.03),
      ),
    ]),
  );
  leafShape.dispose();

  // ── OPEN BOOK ── two page blocks in a shallow V on dark boards; the turning pages
  // are part of the paper instances (pages.ts)
  const bookPages = keep(
    merge([
      baked(new BoxGeometry(0.32, 0.42, 0.035), m.makeRotationY(0.18).setPosition(-0.165, 0, 0.03)),
      baked(new BoxGeometry(0.32, 0.42, 0.035), m.makeRotationY(-0.18).setPosition(0.165, 0, 0.03)),
    ]),
  );
  const bookBoards = keep(
    merge([
      baked(
        new BoxGeometry(0.35, 0.45, 0.012),
        m.makeRotationY(0.18).setPosition(-0.175, 0, 0.004),
      ),
      baked(
        new BoxGeometry(0.35, 0.45, 0.012),
        m.makeRotationY(-0.18).setPosition(0.175, 0, 0.004),
      ),
      new CylinderGeometry(0.02, 0.02, 0.45, 8, 1, false, Math.PI / 2, Math.PI).translate(
        0,
        0,
        -0.004,
      ),
    ]),
  );

  // ── PIANO ── a small black grand: lacquered case and propped lid, keys, legs, lyre
  const outline = new Shape();
  outline.moveTo(0, 0);
  outline.lineTo(1.4, 0);
  outline.lineTo(1.4, 0.45);
  outline.bezierCurveTo(1.4, 0.9, 0.7, 1.0, 0.64, 1.5);
  outline.bezierCurveTo(0.6, 1.85, 0.4, 1.98, 0.15, 1.98);
  outline.quadraticCurveTo(0, 1.98, 0, 1.85);
  outline.lineTo(0, 0);
  const caseGeometry = keep(
    new ExtrudeGeometry(outline, {
      depth: 0.3,
      bevelEnabled: true,
      bevelSize: 0.012,
      bevelThickness: 0.012,
      bevelSegments: 2,
      curveSegments: small ? 12 : 24,
    }).rotateX(-Math.PI / 2),
  );
  const lidGeometry = keep(
    new ExtrudeGeometry(outline, {
      depth: 0.022,
      bevelEnabled: false,
      curveSegments: small ? 12 : 24,
    }).rotateX(-Math.PI / 2),
  );
  const whiteKeys = 36;
  const keyWidth = 1.3 / whiteKeys;
  const blacks: BufferGeometry[] = [];
  for (let i = 0; i < whiteKeys - 1; i++) {
    const n = i % 7;
    if (n === 2 || n === 6) continue; // no black key between E-F and B-C
    blacks.push(
      new BoxGeometry(keyWidth * 0.55, 0.022, 0.1).translate(
        0.05 + (i + 1) * keyWidth,
        0.255,
        0.07,
      ),
    );
  }
  const pianoBlack = keep(
    merge([
      ...blacks,
      // Key slip, cheeks and the music desk
      new BoxGeometry(1.4, 0.05, 0.03).translate(0.7, 0.19, 0.2),
      new BoxGeometry(0.05, 0.1, 0.2).translate(0.025, 0.24, 0.1),
      new BoxGeometry(0.05, 0.1, 0.2).translate(1.375, 0.24, 0.1),
      baked(
        new BoxGeometry(0.62, 0.22, 0.015),
        m.makeRotationX(-0.25).setPosition(0.7, 0.43, -0.2),
      ),
      // Legs and the lyre
      ...[
        [0.12, -0.12],
        [1.28, -0.12],
        [0.35, -1.6],
      ].map(([x = 0, z = 0]) =>
        new CylinderGeometry(0.055, 0.035, 0.62, 10).translate(x, -0.31, z),
      ),
      new BoxGeometry(0.16, 0.5, 0.04).translate(0.7, -0.25, -0.12),
    ]),
  );
  // ── GLASS TABLE ── a round top on three slender, slightly splayed legs, a ring low down
  const tableGeometry = keep(
    merge([
      new CylinderGeometry(0.3, 0.3, 0.018, lathe).translate(0, 0.71, 0),
      ...[0, 1, 2].map((i) => {
        const a = Math.PI / 2 + (i * Math.PI * 2) / 3;
        const leg = new CylinderGeometry(0.011, 0.016, 0.71, 10).translate(0, 0.355, 0);
        leg.applyMatrix4(
          new Matrix4().makeRotationAxis(new Vector3(-Math.sin(a), 0, Math.cos(a)), 0.06),
        );
        return leg.translate(Math.cos(a) * 0.18, 0, Math.sin(a) * 0.18);
      }),
      baked(
        new TorusGeometry(0.17, 0.006, 6, lathe),
        m.makeRotationX(Math.PI / 2).setPosition(0, 0.24, 0),
      ),
    ]),
  );
  const pianoIvory = keep(new BoxGeometry(1.3, 0.04, 0.17).translate(0.7, 0.225, 0.085));
  const pianoSteel = keep(
    merge([
      ...[0.64, 0.7, 0.76].map((x) => new BoxGeometry(0.03, 0.012, 0.08).translate(x, -0.5, -0.08)),
      rod(new Vector3(1.15, 0.3, -0.85), new Vector3(1.0, 0.86, -0.85), 0.01),
    ]),
  );

  const add = (group: Group, geometry: BufferGeometry, material: Material): Mesh => {
    const mesh = new Mesh(geometry, material);
    group.add(mesh);
    return mesh;
  };

  return {
    steelMeshes,

    makeBottle() {
      const g = new Group();
      add(g, corkGeometry, cork);
      add(g, stringGeometry, string);
      const tag = add(g, tagGeometry, paper);
      tag.position.set(0.24, 0.36, 0.12);
      tag.rotation.set(0.1, -0.5, -0.12);
      add(g, bottleGlass, glass).renderOrder = 2;
      g.position.y = -0.3;
      const centred = new Group();
      centred.add(g);
      return centred;
    },

    makeCake() {
      const g = new Group();
      add(g, plateGeometry, porcelain);
      add(g, spongeGeometry, sponge);
      add(g, icingGeometry, icing);
      currantMeshes.push(add(g, currantsGeometry, currant));
      g.position.y = -0.14;
      const centred = new Group();
      centred.add(g);
      return centred;
    },

    makeTeapot() {
      const g = new Group();
      add(g, teapotBody, porcelain);
      add(g, teapotTrim, glaze);
      g.position.y = -0.26;
      const centred = new Group();
      centred.add(g);
      return centred;
    },

    makeCup(withTea) {
      const g = new Group();
      add(g, cupGeometry, porcelain);
      add(g, cupTrim, glaze);
      if (withTea) add(g, teaSurface, tea);
      g.position.y = -0.11;
      const centred = new Group();
      centred.add(g);
      return centred;
    },

    makeKey() {
      const mesh = new Mesh(keyGeometry, steel);
      mesh.geometry.computeBoundingSphere();
      steelMeshes.push(mesh);
      return mesh;
    },

    makeDrop() {
      return new Mesh(dropGeometry, tea);
    },

    makeRose() {
      const g = new Group();
      add(g, roseHead, petal);
      add(g, roseStem, leaf);
      return g;
    },

    makeBook() {
      const g = new Group();
      add(g, bookBoards, cover);
      add(g, bookPages, pageBlock);
      return g;
    },

    makePiano() {
      const g = new Group();
      add(g, caseGeometry, lacquer);
      const lid = add(g, lidGeometry, lacquer);
      // Hinged on the straight (bass) side, propped open on the treble side
      lid.position.set(0, 0.32, 0);
      lid.rotation.z = 0.55;
      add(g, pianoBlack, lacquer);
      add(g, pianoIvory, ivory);
      add(g, pianoSteel, steel);
      g.position.set(-0.7, -0.05, 0.95);
      const centred = new Group();
      centred.add(g);
      return centred;
    },

    makeTable() {
      const g = new Group();
      add(g, tableGeometry, glass).renderOrder = 2;
      return g;
    },

    setLabels(labels) {
      label.draw(labels.drinkMe);
      buildCurrants(labels.eatMe);
    },

    dispose() {
      geometries.forEach((g) => {
        g.dispose();
      });
      currantShape.dispose();
      currantsGeometry.dispose();
      dropGeometry.dispose();
      materials.forEach((material) => {
        material.dispose();
      });
      label.texture.dispose();
    },
  };
}
