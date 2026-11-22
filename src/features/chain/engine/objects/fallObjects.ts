import {
  type BufferGeometry,
  Euler,
  Frustum,
  Group,
  type Material,
  Matrix4,
  type Mesh,
  type Object3D,
  type PerspectiveCamera,
  Quaternion,
  Vector3,
} from 'three';

import type { FallLabels, FallObjectsData, TeeAtlas } from '../../types';
import type { LandingMap } from '../landing';
import { SHAFT_Z } from '../constants';
import { seeded } from '../fallGeometry';
import { createPocketWatch, type PocketWatch3D } from '../pocketWatch';
import { createLetters } from './letters';
import { createHall } from './hall';
import { createCards, createPaper } from './paper';
import { createRack, type Rack } from './rack';
import { createPropKit } from './props';
import { createCardAtlas, createPageTexture, loadFaces } from './textures';

/*
 * The objects of the fall (step 12; docs/brand/design-direction.md, "The objects
 * of the fall"). They live in the misty shaft below the walls, fixed in the
 * world, so as the camera descends they pass it upward, tumbling slowly:
 *
 * - the piano, falling slowly and turning, in shot 5 of the entrance, then the
 *   first scattered objects at the hero's end (bottle, cake, a tilted cup with
 *   drops of tea, a watch);
 * - down the shaft, each kind on its own recycled lattice of depths (like the
 *   wall segments), placed from seeded numbers, so a depth always holds the
 *   same objects: bottles, cakes, teapots, cups, pocket watches, clock faces,
 *   keys, roses, open books, cards;
 * - band 1: the chain, with at most a key or a card far behind it;
 * - band 2: the letters (letters.ts);
 * - band 3: loose pages fluttering down and two open books turning pages.
 *
 * Everything moves with `time`, which only advances while the loop runs: with
 * reduced motion the objects are placed and still.
 */

export interface FallFrame {
  /** Seconds since the last frame; 0 with reduced motion (nothing moves). */
  dt: number;
  camera: PerspectiveCamera;
  /** tan of the page camera's half field of view, and the view's aspect. */
  tanHalfFov: number;
  aspect: number;
  /** Night progress 0..1 (the watches' hands). */
  night: number;
  /** World y of the page camera when each band is centred on screen, in order. */
  bandYs: readonly number[];
  /** A band window's height over the viewport's. */
  bandWindow: number;
  /** Band 2's word: 0 scattered, 1 spelled. */
  assembly: number;
  /** The landing at the bottom of the page (step 13), and its progress (-1 before it). */
  landing: LandingMap | null;
  landed: number;
  /** The clothing rack (step 14): the camera height when its stage is centred, or null. */
  rackY: number | null;
  /** How far the rack's stage is below the middle of the viewport, px. */
  rackOffset: number;
  viewportHeight: number;
  /** 0 on tall screens, 1 on wide ones. */
  wide: number;
}

export interface FallObjects {
  group: Group;
  update: (frame: FallFrame) => void;
  setLabels: (labels: FallLabels) => void;
  /** Steel meshes of the floating watches, clock faces and keys (steel measurement). */
  steelMeshes: () => Mesh[];
  /** Steel of the landing: the door handles, the curtain rod and the key on the table. */
  landingSteel: () => Mesh[];
  /** The clothing rack (null when the app gave no tees). */
  rack: Rack | null;
  /** New prints for the rack's tees (a language change). */
  setTeeAtlas: (atlas: TeeAtlas) => void;
  /** Roses inside the camera's view (never more than three). */
  rosesOnScreen: (camera: PerspectiveCamera) => number;
  /**
   * Development only: the near cells (closer than 18) of one kind between two
   * heights, to frame each kind for screenshots.
   */
  debugCells: (kind: string, top: number, bottom: number) => { y: number; d: number; u: number }[];
  dispose: () => void;
}

/** No scattered objects above this height: the piano and the hero's end have the stage. */
const LATTICE_TOP = -80;
/** Lattices cover from above the camera to the far fog below it. */
const ABOVE = 14;
const BELOW = 40;
/**
 * Half-height of the stretch kept clear around bands 2 and 3, and kept sparse around
 * band 1: about what a band window shows at the objects' depth when it is centred.
 */
const BAND_CLEAR = 4.5;

type KindName =
  'bottle' | 'cake' | 'teapot' | 'cup' | 'watch' | 'clock' | 'key' | 'rose' | 'book' | 'card';

interface KindSpec {
  spacing: number;
  phase: number;
  scale: number;
  /** Small enough to drift far behind the chain in band 1. */
  smallKind?: boolean;
}

const KINDS: Record<KindName, KindSpec> = {
  bottle: { spacing: 14, phase: 5, scale: 1.4 },
  cake: { spacing: 16, phase: 11, scale: 1.3 },
  teapot: { spacing: 18, phase: 9, scale: 1.25 },
  cup: { spacing: 9, phase: 2, scale: 1.45 },
  watch: { spacing: 12, phase: 8, scale: 1.4 },
  clock: { spacing: 17, phase: 13, scale: 1.9 },
  key: { spacing: 7, phase: 4, scale: 1.6, smallKind: true },
  // Roses are the only red objects: never more than two or three on screen
  rose: { spacing: 16, phase: 14, scale: 1.5 },
  book: { spacing: 20, phase: 17, scale: 1.6 },
  card: { spacing: 2.6, phase: 1, scale: 2.8, smallKind: true },
};

interface CellParams {
  y: number;
  u: number;
  d: number;
  phase: number;
  spin: Vector3;
  base: Euler;
  face: number;
}

export async function createFallObjects(
  steel: Material,
  linkGeometry: BufferGeometry,
  small: boolean,
  data: FallObjectsData,
  rackOptions: { onFacing: (index: number) => void; hold: number | null } = {
    onFacing: () => undefined,
    hold: null,
  },
): Promise<FallObjects> {
  await loadFaces(
    `${data.labels.drinkMe}${data.labels.eatMe}${data.word.toUpperCase()}ABCDEFGHIJKLMNOPQRSTUVWXYZ`,
  );
  const cardAtlas = await createCardAtlas(data.cards);
  const pageTexture = createPageTexture();
  const kit = createPropKit(steel, small);
  kit.setLabels(data.labels);

  const group = new Group();
  const sparse = small ? 1.35 : 1;
  const watches: PocketWatch3D[] = [];
  const roses: Object3D[] = [];
  const disposers: (() => void)[] = [];

  const makeWatch = (clock: boolean): PocketWatch3D => {
    const watch = createPocketWatch(
      steel,
      linkGeometry,
      clock
        ? { lid: null, chain: false, crown: false, glintOffset: watches.length * 1.7 }
        : { lid: 1.25, chain: true, crown: true, glintOffset: watches.length * 1.7 },
    );
    watches.push(watch);
    disposers.push(watch.dispose);
    return watch;
  };

  // ── LATTICES ──
  interface Lattice {
    name: KindName;
    spec: KindSpec;
    spacing: number;
    pool: number;
    objects: Object3D[];
    cells: (number | null)[];
    params: CellParams[];
  }
  const lattices: Lattice[] = [];
  let bookPagesStart = 0;

  const paramsFor = (
    name: KindName,
    spec: KindSpec,
    spacing: number,
    k: number,
    out: CellParams,
  ): void => {
    const random = seeded(name.length * 9973 + Math.round(spec.phase * 131) + k * 7919);
    out.y = LATTICE_TOP - spec.phase - k * spacing + (random() - 0.5) * spacing * 0.5;
    out.u = random() * 2 - 1;
    out.d = 9 + 16 * Math.sqrt(random());
    out.phase = random() * Math.PI * 2;
    out.spin.set(random() - 0.5, random() - 0.5, random() - 0.5).multiplyScalar(0.36);
    out.base.set(random() * 6.28, random() * 6.28, random() * 6.28);
    out.face = Math.floor(random() * Math.max(data.cards.length, 1));
    if (random() < 0.15) out.d = -1; // an empty cell, for variety
  };

  (Object.keys(KINDS) as KindName[]).forEach((name) => {
    const spec = KINDS[name];
    const spacing = spec.spacing * sparse;
    const pool = Math.ceil((ABOVE + BELOW) / spacing) + 1;
    const objects: Object3D[] = [];
    if (name !== 'card') {
      for (let i = 0; i < pool; i++) {
        let object: Object3D;
        switch (name) {
          case 'bottle':
            object = kit.makeBottle();
            break;
          case 'cake':
            object = kit.makeCake();
            break;
          case 'teapot':
            object = kit.makeTeapot();
            break;
          case 'cup':
            object = kit.makeCup(false);
            break;
          case 'watch':
            object = makeWatch(false).group;
            break;
          case 'clock':
            object = makeWatch(true).group;
            break;
          case 'key':
            object = kit.makeKey();
            break;
          case 'rose':
            object = kit.makeRose();
            roses.push(object);
            break;
          default:
            object = kit.makeBook();
        }
        object.visible = false;
        object.scale.setScalar(spec.scale);
        group.add(object);
        objects.push(object);
      }
    }
    lattices.push({
      name,
      spec,
      spacing,
      pool,
      objects,
      cells: new Array<number | null>(pool).fill(null),
      params: Array.from({ length: pool }, () => ({
        y: 0,
        u: 0,
        d: 0,
        phase: 0,
        spin: new Vector3(),
        base: new Euler(),
        face: 0,
      })),
    });
  });

  const cardLattice = lattices.find((l) => l.name === 'card');
  const bookLattice = lattices.find((l) => l.name === 'book');
  // Two more cards for the hero's end, face up, after the lattice's
  const heroCardSlots = [cardLattice?.pool ?? 0, (cardLattice?.pool ?? 0) + 1];
  const cards = createCards((cardLattice?.pool ?? 0) + heroCardSlots.length, cardAtlas);
  group.add(cards.mesh);

  // ── PAPER ── loose pages for band 3, then three turning pages per open book
  const loosePages = small ? 9 : 16;
  const bandBooks = 2;
  bookPagesStart = loosePages;
  const paperCount = loosePages + (bandBooks + (bookLattice?.pool ?? 0)) * 3;
  const paper = createPaper(paperCount, pageTexture, small);
  group.add(paper.mesh);
  const looseSeeds = Array.from({ length: loosePages }, (_, i) => {
    const r = seeded(4001 + i * 31);
    return {
      u: r() * 2 - 1,
      d: 9 + r() * 12,
      fall: r(),
      speed: 0.6 + r() * 0.6,
      phase: r() * 6.28,
      spin: new Vector3(r() - 0.5, r() - 0.5, r() - 0.5).multiplyScalar(0.5),
      size: 0.7 + r() * 0.35,
    };
  });

  // ── HERO END ── the piano and the first scattered objects
  const piano = kit.makePiano();
  group.add(piano);
  const heroBottle = kit.makeBottle();
  const heroCake = kit.makeCake();
  const heroCup = kit.makeCup(true);
  const heroWatch = makeWatch(false).group;
  const drops = Array.from({ length: 6 }, () => kit.makeDrop());
  const hero: {
    object: Object3D;
    u: number;
    d: number;
    y: number;
    tilt: Euler;
    spin: number;
    scale: number;
  }[] = [
    {
      object: heroBottle,
      u: -0.58,
      d: 10.5,
      y: -69.3,
      tilt: new Euler(0.25, 0.4, -0.35),
      spin: 0.06,
      scale: 1.4,
    },
    {
      object: heroCake,
      u: 0.5,
      d: 11.5,
      y: -70.3,
      tilt: new Euler(1.05, 0.2, 0.1),
      spin: 0.04,
      scale: 1.3,
    },
    {
      object: heroCup,
      u: -0.1,
      d: 9.2,
      y: -71.6,
      tilt: new Euler(0.35, 0.3, 0.55),
      spin: 0.03,
      scale: 1.45,
    },
    {
      object: heroWatch,
      u: 0.78,
      d: 13,
      y: -68.3,
      tilt: new Euler(1.4, 0, 0.3),
      spin: 0.05,
      scale: 1.4,
    },
  ];
  hero.forEach((h) => {
    h.object.scale.setScalar(h.scale);
    group.add(h.object);
  });
  drops.forEach((drop) => group.add(drop));

  // ── BAND 3 BOOKS ──
  const bandBookObjects = [kit.makeBook(), kit.makeBook()];
  bandBookObjects.forEach((book) => {
    book.scale.setScalar(1.7);
    group.add(book);
  });

  // ── THE LANDING ── the hall at the bottom of the page
  const hall = createHall(kit, steel, small);
  hall.group.visible = false;
  group.add(hall.group);

  // ── THE CLOTHING RACK ── in the T-shirt section's window (step 14)
  const rack = data.tees
    ? createRack(steel, data.tees, small, rackOptions.onFacing, rackOptions.hold)
    : null;
  if (rack) {
    rack.group.visible = false;
    group.add(rack.group);
  }

  // ── BAND 2 LETTERS ──
  const letters = createLetters(data.word, small);
  group.add(letters.mesh);

  // ── PER FRAME ──
  let time = 0;
  const m = new Matrix4();
  const m2 = new Matrix4();
  const q = new Quaternion();
  const e = new Euler();
  const p = new Vector3();
  const s = new Vector3();
  const hinge = new Matrix4();

  /** Three turning pages of an open book, fanning slowly about its spine. */
  const placeBookPages = (book: Object3D, first: number): void => {
    book.updateMatrixWorld();
    for (let j = 0; j < 3; j++) {
      const angle = Math.PI / 2 + (Math.PI / 2 - 0.24) * Math.sin(time * 0.22 + j * 1.1);
      hinge.makeRotationY(-angle);
      m.copy(book.matrixWorld)
        .multiply(m2.makeTranslation(0, 0, 0.05))
        .multiply(hinge)
        .multiply(m2.makeScale(0.31, 0.4, 1));
      paper.set(first + j, m, [0.07 * Math.sin(angle), 0.015, 0.7, j]);
    }
  };

  const update = (frame: FallFrame): void => {
    time += frame.dt;
    const { camera } = frame;
    const camY = camera.position.y;
    const camZ = SHAFT_Z;
    const halfWidthAt = (d: number) => frame.tanHalfFov * d * frame.aspect;
    const halfHeightAt = (d: number) => frame.tanHalfFov * d;
    const [band1, band2, band3] = frame.bandYs;

    // Lattices
    for (const lattice of lattices) {
      const { spacing, spec } = lattice;
      const kMin = Math.max(Math.ceil((LATTICE_TOP - spec.phase - (camY + ABOVE)) / spacing), 0);
      const kMax = Math.floor((LATTICE_TOP - spec.phase - (camY - BELOW)) / spacing);
      const used = new Set<number>();
      for (let k = kMin; k <= kMax; k++) {
        const slot = k % lattice.pool;
        used.add(slot);
        const params = lattice.params[slot];
        if (!params) continue;
        if (lattice.cells[slot] !== k) {
          lattice.cells[slot] = k;
          paramsFor(lattice.name, spec, spacing, k, params);
        }
        let d = params.d;
        // Kept clear around bands 2 and 3; only small things, far behind the chain, in band 1
        const near = (b: number | undefined) =>
          b !== undefined && Math.abs(params.y - b) < BAND_CLEAR;
        // Nothing drifts into the hall at the landing
        const inHall = frame.landing !== null && params.y < frame.landing.y0 + 6;
        // Nor around the clothing rack
        const atRack = frame.rackY !== null && Math.abs(params.y - frame.rackY) < 5.5;
        if (near(band2) || near(band3) || inHall || atRack || params.y > LATTICE_TOP) d = -1;
        else if (near(band1)) d = spec.smallKind && d > 0 ? Math.max(d, 25) : -1;
        const object = lattice.objects[slot];
        if (d < 0) {
          if (object) object.visible = false;
          if (lattice.name === 'card') cards.hide(slot);
          if (lattice.name === 'book')
            for (let j = 0; j < 3; j++) paper.hide(bookPagesStart + 6 + slot * 3 + j);
          continue;
        }
        p.set(
          params.u * halfWidthAt(d) * 0.8,
          params.y + Math.sin(time * 0.2 + params.phase) * 0.25,
          camZ - d,
        );
        e.set(
          params.base.x + time * params.spin.x,
          params.base.y + time * params.spin.y,
          params.base.z + time * params.spin.z,
        );
        if (lattice.name === 'card') {
          q.setFromEuler(e);
          s.setScalar(spec.scale);
          cards.set(slot, m.compose(p, q, s), params.face);
          continue;
        }
        if (!object) continue;
        object.visible = true;
        object.position.copy(p);
        object.rotation.copy(e);
        if (lattice.name === 'book') {
          // Open books turn slowly, facing roughly outwards
          object.rotation.set(
            0.3 * Math.sin(params.phase),
            params.base.y * 0.2 + time * 0.05,
            0.15,
          );
          placeBookPages(object, bookPagesStart + 6 + slot * 3);
        }
      }
      for (let slot = 0; slot < lattice.pool; slot++) {
        if (used.has(slot)) continue;
        const object = lattice.objects[slot];
        if (object) object.visible = false;
        if (lattice.name === 'card') cards.hide(slot);
        if (lattice.name === 'book')
          for (let j = 0; j < 3; j++) paper.hide(bookPagesStart + 6 + slot * 3 + j);
      }
    }

    // The piano: falling more slowly than the visitor, turning, so it passes them in shot 5
    const fall = Math.min(camY + 52, 12);
    piano.position.set(1.1 - fall * 0.04, -63 + fall * 0.25, camZ - 8.5);
    piano.rotation.set(-0.32 + fall * 0.015, 0.4 + fall * 0.09 + time * 0.03, 0.22);
    piano.visible = camY < -38 && camY > -100;

    // The first scattered objects at the hero's end (a little smaller on narrow screens,
    // where they crowd the frame)
    const heroOn = camY < -40 && camY > -100;
    const narrow = 0.75 + 0.25 * Math.min(Math.max((frame.aspect - 0.5) / 0.8, 0), 1);
    hero.forEach((h, i) => {
      h.object.visible = heroOn;
      h.object.scale.setScalar(h.scale * narrow);
      h.object.position.set(
        h.u * halfWidthAt(h.d) * 0.72,
        h.y + Math.sin(time * 0.25 + i) * 0.15,
        camZ - h.d,
      );
      h.object.rotation.set(h.tilt.x, h.tilt.y + time * h.spin, h.tilt.z);
    });
    // Two cards of our deck, face up, drifting by
    heroCardSlots.forEach((slot, i) => {
      if (!heroOn) {
        cards.hide(slot);
        return;
      }
      const d = 10 + i * 2.5;
      p.set((i === 0 ? 0.3 : -0.78) * halfWidthAt(d) * 0.72, -68.6 - i * 1.9, camZ - d);
      e.set(
        0.15 + 0.1 * Math.sin(time * 0.3 + i),
        (i === 0 ? -0.35 : 0.4) + time * 0.04,
        i === 0 ? 0.3 : -0.25,
      );
      q.setFromEuler(e);
      s.setScalar(2.6 * narrow);
      cards.set(slot, m.compose(p, q, s), i === 0 ? 0 : 6);
    });

    // Drops of tea floating out of the tilted cup
    heroCup.updateMatrixWorld();
    drops.forEach((drop, i) => {
      drop.visible = heroOn;
      p.set(
        0.2 + i * 0.07,
        0.22 + i * 0.055 + Math.sin(time * 0.6 + i) * 0.015,
        0.02 * Math.sin(i * 2.1),
      );
      drop.position.copy(p.applyMatrix4(heroCup.matrixWorld));
      drop.scale.setScalar(1.2 - i * 0.12);
    });

    // Band 3: loose pages fluttering down, two open books turning pages
    const band3On = band3 !== undefined && Math.abs(camY - band3) < 16;
    bandBookObjects.forEach((book, i) => {
      book.visible = band3On;
      if (!band3On) return;
      const d = i === 0 ? 13 : 17.5;
      book.position.set(
        (i === 0 ? -0.5 : 0.55) * halfWidthAt(d) * 0.8,
        band3 + (i === 0 ? 0.5 : -0.8),
        camZ - d,
      );
      book.rotation.set(
        0.25 + 0.05 * Math.sin(time * 0.2 + i),
        (i === 0 ? 0.35 : -0.4) + 0.08 * Math.sin(time * 0.13 + i),
        0.08,
      );
      placeBookPages(book, bookPagesStart + i * 3);
    });
    if (!band3On) for (let j = 0; j < 6; j++) paper.hide(bookPagesStart + j);
    looseSeeds.forEach((page, i) => {
      if (!band3On) {
        paper.hide(i);
        return;
      }
      const span = halfHeightAt(page.d) * frame.bandWindow * 2.6;
      const y =
        band3 + span / 2 - ((((page.fall * span + time * 0.16 * page.speed) % span) + span) % span);
      p.set(
        page.u * halfWidthAt(page.d) * 0.85 + Math.sin(time * 0.3 + page.phase) * 0.4,
        y,
        camZ - page.d,
      );
      e.set(
        page.phase + time * page.spin.x,
        page.phase * 0.5 + time * page.spin.y,
        time * page.spin.z,
      );
      q.setFromEuler(e);
      s.set(0.42 * page.size, 0.56 * page.size, 1);
      // Centre the hinged plane on its position
      m.compose(p, q, s).multiply(m2.makeTranslation(-0.5, 0, 0));
      paper.set(i, m, [0.04, 0.09, 1.4 * page.speed, page.phase]);
    });

    // Band 2: the letters
    const band2On = band2 !== undefined && Math.abs(camY - band2) < 16;
    letters.mesh.visible = band2On;
    if (band2On) {
      letters.update({
        time,
        bandY: band2,
        assembly: frame.assembly,
        halfWidthAt,
        windowHalfAt: (d) => halfHeightAt(d) * frame.bandWindow,
        cameraZ: camZ,
      });
    }

    // The clothing rack, while its window is near
    if (rack) {
      rack.group.visible = frame.rackY !== null && Math.abs(camY - frame.rackY) < 10;
      if (frame.rackY !== null)
        rack.update({
          dt: frame.dt,
          camera,
          offset: frame.rackOffset,
          viewportHeight: frame.viewportHeight,
          wide: frame.wide,
        });
    }

    // The landing's hall, once the visitor is near it
    const landing = frame.landing;
    hall.group.visible = landing !== null && camY < landing.y0 + 16;
    if (landing && hall.group.visible) hall.update(camera, landing);

    paper.setTime(time);
    paper.commit();
    cards.commit();
    watches.forEach((watch) => {
      watch.setNight(frame.night);
      watch.tick(frame.dt);
    });
  };

  const frustum = new Frustum();
  const projection = new Matrix4();
  const world = new Vector3();

  return {
    group,
    update,
    setLabels(labels) {
      kit.setLabels(labels);
    },
    steelMeshes: () => [
      ...watches.flatMap((w) => w.meshes),
      ...kit.steelMeshes.filter((k) => !hall.steel.includes(k)),
    ],
    landingSteel: () => hall.steel,
    rack,
    setTeeAtlas(atlas) {
      rack?.setAtlas(atlas);
    },
    debugCells(kind, top, bottom) {
      const lattice = lattices.find((l) => l.name === kind);
      if (!lattice) return [];
      const out: { y: number; d: number; u: number }[] = [];
      const params: CellParams = {
        y: 0,
        u: 0,
        d: 0,
        phase: 0,
        spin: new Vector3(),
        base: new Euler(),
        face: 0,
      };
      for (let k = 0; k < 400; k++) {
        paramsFor(lattice.name, lattice.spec, lattice.spacing, k, params);
        if (params.y > top) continue;
        if (params.y < bottom) break;
        if (params.d > 0 && params.d < 18) out.push({ y: params.y, d: params.d, u: params.u });
      }
      return out;
    },
    rosesOnScreen(camera) {
      camera.updateMatrixWorld();
      projection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      frustum.setFromProjectionMatrix(projection);
      return roses.filter(
        (rose) => rose.visible && frustum.containsPoint(rose.getWorldPosition(world)),
      ).length;
    },
    dispose() {
      disposers.forEach((dispose) => {
        dispose();
      });
      hall.dispose();
      rack?.dispose();
      kit.dispose();
      cards.dispose();
      paper.dispose();
      letters.dispose();
      cardAtlas.dispose();
      pageTexture.dispose();
    },
  };
}
