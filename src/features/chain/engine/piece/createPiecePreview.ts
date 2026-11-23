import {
  ACESFilmicToneMapping,
  CylinderGeometry,
  DirectionalLight,
  Group,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  type MeshStandardMaterial,
  PerspectiveCamera,
  PMREMGenerator,
  Quaternion,
  Scene,
  SphereGeometry,
  SRGBColorSpace,
  TorusGeometry,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';

import {
  ENV_BLUR,
  KEY_LIGHT_COLOR,
  KEY_LIGHT_INTENSITY,
  KEY_LIGHT_POSITION,
  TONE_MAPPING_EXPOSURE,
} from '../constants';
import { createSteelMaterial } from '../geometry';
import { createStudioEnvironment } from '../studioEnvironment';
import { buildForm, type FormCurve } from './forms';
import { createLinkPattern, DETAIL_FULL, DETAIL_SMALL, type LinkPattern } from './linkShapes';
import { at } from './at';
import type { PiecePreview, PiecePreviewOptions, PieceSpec } from './types';

/*
 * The 3D preview of a jewelry piece (the back of the card in the jewelry
 * dialog): the chosen link repeated along the chosen form, at the chosen
 * length, in the chain's own steel and studio, so it reads exactly like the
 * chain. Its own small renderer, created when the card first turns over and
 * disposed with the dialog; the page's loop is paused meanwhile (ChainStage).
 */

/** Looking down a little at the piece, and its resting three-quarter turn. */
const PITCH = (16 * Math.PI) / 180;
const REST_YAW = 0.62;
const FOV = 26;
/**
 * On its own the piece swings slowly either side of the front (period s,
 * amplitude rad), so it always reads as worn against the guide; a drag turns it
 * all the way round, and it eases back into the swing after AUTO_PAUSE s.
 */
const SWING_PERIOD = 18;
const SWING = REST_YAW;
const AUTO_PAUSE = 2.5;
/** Drag: radians per pixel, and how fast a flick slows down, s. */
const DRAG_TURN = 0.011;
const COAST = 0.5;
/** Changes: the links slide into a new shape over this long; a new link crossfades. */
const SLIDE = 0.75;
const FADE = 0.5;
/** A drag starts after this many pixels across (vertical moves scroll the dialog). */
const DRAG_START = 6;

/** Per instance: position (3), rotation (4), scale (1). */
const STRIDE = 8;

interface Layout {
  /** One array per component of the pattern. */
  parts: Float32Array[];
  /** Framing: the piece's radius about the axis, its height range. */
  radius: number;
  bottom: number;
  top: number;
}

interface Piece {
  id: string;
  pattern: LinkPattern;
  material: MeshStandardMaterial;
  group: Group;
  meshes: InstancedMesh[];
  clasp: Mesh | null;
  opacity: number;
  fading: -1 | 0 | 1;
  /** What is shown now, where it slides from and to. */
  shown: Float32Array[];
  from: Float32Array[];
  to: Layout | null;
  slide: number;
}

/** Previews created and freed this visit (development: read from window.__insomniaPieceStats). */
const stats = { created: 0, disposed: 0 };
if (import.meta.env.DEV) {
  (window as unknown as { __insomniaPieceStats?: typeof stats }).__insomniaPieceStats = stats;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

export function createPiecePreview(host: HTMLElement, options: PiecePreviewOptions): PiecePreview {
  const canvas = document.createElement('canvas');
  canvas.className = 'piece-canvas';
  const svgNs = 'http://www.w3.org/2000/svg';
  const guide = document.createElementNS(svgNs, 'svg');
  guide.setAttribute('class', 'piece-guide');
  guide.setAttribute('aria-hidden', 'true');
  const guidePath = document.createElementNS(svgNs, 'path');
  guide.appendChild(guidePath);
  host.append(guide, canvas);

  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'low-power',
    });
  } catch (error) {
    canvas.remove();
    guide.remove();
    throw error;
  }
  stats.created += 1;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = TONE_MAPPING_EXPOSURE;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  // The chain's studio, baked the same way: the steel reads exactly like the chain
  const pmrem = new PMREMGenerator(renderer);
  const studio = createStudioEnvironment();
  const envTarget = pmrem.fromScene(studio.scene, ENV_BLUR);
  scene.environment = envTarget.texture;
  pmrem.dispose();
  studio.dispose();
  const key = new DirectionalLight(KEY_LIGHT_COLOR, KEY_LIGHT_INTENSITY);
  key.position.set(...KEY_LIGHT_POSITION);
  scene.add(key);

  const camera = new PerspectiveCamera(FOV, 1, 0.1, 4000);
  const spinner = new Group();
  scene.add(spinner);

  const detail = options.small ? DETAIL_SMALL : DETAIL_FULL;
  const patterns = new Map<string, LinkPattern>();
  const claspGeometry = new TorusGeometry(0.3, 0.06, 8, 28);
  // The body part, invisible: it only hides the chain behind it
  const bodyMaterial = new MeshBasicMaterial({ colorWrite: false });
  let body: Mesh | null = null;

  function setBody(curve: FormCurve, thickness: number): void {
    if (body) {
      body.geometry.dispose();
      body.removeFromParent();
      body = null;
    }
    const shape = curve.body;
    if (!shape) return;
    if (shape.kind === 'ellipsoid') {
      body = new Mesh(new SphereGeometry(1, 32, 20), bodyMaterial);
      body.scale.set(shape.rx, shape.ry, shape.rz);
    } else {
      // Never wider than the chain is, wherever it goes round it
      const inner = curve.points.reduce((m, v) => Math.min(m, Math.hypot(v.x, v.z)), Infinity);
      const radius = Math.min(shape.radius, inner - thickness / 2 - 0.05);
      body = new Mesh(
        new CylinderGeometry(radius, radius, shape.top - shape.bottom, 40),
        bodyMaterial,
      );
      body.position.y = (shape.top + shape.bottom) / 2;
    }
    body.renderOrder = -1;
    // It turns with the piece (the head is not round)
    spinner.add(body);
  }
  const pieces: Piece[] = [];
  let current: Piece | null = null;
  let form: FormCurve | null = null;
  let spec: PieceSpec | null = null;
  let reduced = options.reducedMotion;
  let active = false;
  let disposed = false;

  // ── TURNING ──
  let yaw = REST_YAW;
  let spin = 0;
  let idle = AUTO_PAUSE;
  // Starts at the resting three-quarter turn
  let swing = SWING_PERIOD / 4;

  // ── FRAMING ── eased towards the piece's size
  const frame = { y: 0, distance: 40, goalY: 0, goalDistance: 40, ready: false };
  let width = 1;
  let height = 1;
  let guideKey = '';

  const patternFor = (id: string): LinkPattern => {
    let pattern = patterns.get(id);
    if (!pattern) {
      pattern = createLinkPattern(id, detail);
      patterns.set(id, pattern);
    }
    return pattern;
  };

  // ── LAYOUT ── links at even steps of arc length along the form's curve
  const p = new Vector3();
  const q = new Vector3();
  const tangent = new Vector3();
  const normal = new Vector3();
  const side = new Vector3();
  const zAxis = new Vector3();
  const yAxis = new Vector3();
  const basis = new Matrix4();
  const quaternion = new Quaternion();

  function layout(pattern: LinkPattern, curve: FormCurve, lengthCm: number): Layout {
    const { points, closed } = curve;
    const n = points.length;
    const cumulative = new Float32Array(n + 1);
    for (let i = 1; i < n; i++)
      cumulative[i] = at(cumulative, i - 1) + at(points, i).distanceTo(at(points, i - 1));
    const open = at(cumulative, n - 1);
    const total = closed ? open + at(points, 0).distanceTo(at(points, n - 1)) : open;
    cumulative[n] = total;
    const pointAt = (s: number, out: Vector3) => {
      let t = closed ? ((s % total) + total) % total : Math.min(Math.max(s, 0), open);
      let lo = 0;
      let hi = closed ? n : n - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (at(cumulative, mid) <= t) lo = mid;
        else hi = mid;
      }
      const a = at(points, lo);
      const b = at(points, hi % n);
      const span = at(cumulative, hi) - at(cumulative, lo) || 1;
      t = (t - at(cumulative, lo)) / span;
      return out.copy(a).lerp(b, t);
    };

    // A ring is the chain scaled down so about a dozen links go round the finger
    const scale = spec?.form === 'ring' ? Math.min(1, lengthCm / (pattern.span * 12)) : 1;
    const unit = pattern.span * scale;
    const repeats = closed
      ? Math.max(3, Math.round(total / unit))
      : Math.max(1, Math.floor(total / unit));
    const stretch = closed ? total / (repeats * unit) : 1;
    const start = closed ? 0 : (total - repeats * unit) / 2;
    const parts = pattern.components.map(() => [] as number[]);
    let radius = 0;
    let bottom = Infinity;
    let top = -Infinity;
    let index = 0;
    for (let r = 0; r < repeats; r++) {
      let offset = r * pattern.span;
      pattern.components.forEach((component, c) => {
        const s = start + (offset + component.span / 2) * scale * stretch;
        offset += component.span;
        pointAt(s, p);
        pointAt(s - 0.04, q);
        pointAt(s + 0.04, tangent);
        tangent.sub(q).normalize();
        curve.normal(p, normal);
        normal.addScaledVector(tangent, -normal.dot(tangent)).normalize();
        side.crossVectors(tangent, normal);
        const edge =
          component.turn === 'edge' || (component.turn === 'alternate' && index % 2 === 1);
        zAxis.copy(edge ? side : normal);
        yAxis.crossVectors(zAxis, tangent);
        basis.makeBasis(tangent, yAxis, zAxis);
        quaternion.setFromRotationMatrix(basis);
        at(parts, c).push(
          p.x,
          p.y,
          p.z,
          quaternion.x,
          quaternion.y,
          quaternion.z,
          quaternion.w,
          scale,
        );
        radius = Math.max(radius, Math.hypot(p.x, p.z));
        bottom = Math.min(bottom, p.y);
        top = Math.max(top, p.y);
        index += 1;
      });
    }
    const reach = 0.6 * scale;
    return {
      parts: parts.map((list) => Float32Array.from(list)),
      radius: radius + reach,
      bottom: bottom - reach,
      top: top + reach,
    };
  }

  // ── PIECES ──
  function makePiece(id: string): Piece {
    const pattern = patternFor(id);
    const material = createSteelMaterial();
    if (pattern.normalMap) {
      material.normalMap = pattern.normalMap;
      material.normalScale = new Vector2(0.55, 0.55);
    }
    const group = new Group();
    spinner.add(group);
    return {
      id,
      pattern,
      material,
      group,
      meshes: [],
      clasp: null,
      opacity: 1,
      fading: 0,
      shown: [],
      from: [],
      to: null,
      slide: 1,
    };
  }

  function disposePiece(piece: Piece): void {
    piece.meshes.forEach((mesh) => {
      mesh.dispose();
    });
    piece.group.removeFromParent();
    piece.material.dispose();
  }

  /** Makes sure each component has a mesh with room for `count` links. */
  function fit(piece: Piece, counts: number[]): void {
    counts.forEach((count, c) => {
      const mesh = piece.meshes[c];
      if (mesh && mesh.instanceMatrix.count >= count) {
        mesh.count = count;
        return;
      }
      if (mesh) {
        mesh.dispose();
        mesh.removeFromParent();
      }
      const component = at(piece.pattern.components, c);
      const next = new InstancedMesh(
        component.geometry,
        piece.material,
        Math.ceil(count * 1.25) + 4,
      );
      next.count = count;
      next.frustumCulled = false;
      piece.group.add(next);
      piece.meshes[c] = next;
    });
  }

  function setOpacity(piece: Piece, opacity: number): void {
    piece.opacity = opacity;
    const transparent = opacity < 1;
    if (piece.material.transparent !== transparent) {
      piece.material.transparent = transparent;
      piece.material.needsUpdate = true;
    }
    piece.material.opacity = opacity;
  }

  /** Lays the piece out for the current form, sliding from where it is (unless `snap`). */
  function place(piece: Piece, lengthCm: number, snap: boolean): void {
    if (!form) return;
    const next = layout(piece.pattern, form, lengthCm);
    piece.from = piece.shown.length
      ? piece.shown.map((a) => a.slice())
      : next.parts.map((a) => a.slice());
    piece.to = next;
    piece.slide = snap ? 1 : 0;
    piece.shown = next.parts.map((a) => a.slice());
    fit(
      piece,
      next.parts.map((a) => a.length / STRIDE),
    );
    // The clasp at the back of a necklace
    if (form.clasp && !piece.clasp) {
      piece.clasp = new Mesh(claspGeometry, piece.material);
      piece.group.add(piece.clasp);
    }
    if (piece.clasp) {
      piece.clasp.visible = form.clasp !== null;
      if (form.clasp) {
        piece.clasp.position.copy(form.clasp);
        piece.clasp.rotation.set(0, Math.PI / 2, 0);
      }
    }
    frame.goalY = (next.bottom + next.top) / 2;
    const halfHeight = (next.top - next.bottom) / 2;
    const tanV = Math.tan((FOV * Math.PI) / 360);
    const tanH = tanV * (width / height);
    const tall = halfHeight * Math.cos(PITCH) + next.radius * Math.sin(PITCH);
    frame.goalDistance = 1.12 * Math.max(tall / tanV, next.radius / tanH) + next.radius;
    if (snap || !frame.ready) {
      frame.y = frame.goalY;
      frame.distance = frame.goalDistance;
      frame.ready = true;
    }
    writeInstances(piece);
  }

  const mp = new Vector3();
  const mq = new Quaternion();
  const mq2 = new Quaternion();
  const ms = new Vector3();
  const matrix = new Matrix4();

  function writeInstances(piece: Piece): void {
    if (!piece.to) return;
    const t = smooth(Math.min(piece.slide, 1));
    piece.to.parts.forEach((to, c) => {
      const from = piece.from[c] ?? to;
      const shown = at(piece.shown, c);
      const mesh = piece.meshes[c];
      if (!mesh) return;
      const n2 = to.length / STRIDE;
      const n1 = from.length / STRIDE;
      for (let i = 0; i < n2; i++) {
        // Each link slides from its place along the old shape to its place on the new one
        const j = n1 > 1 ? Math.round((i * (n1 - 1)) / Math.max(n2 - 1, 1)) : 0;
        const a = n1 > 0 ? j * STRIDE : i * STRIDE;
        const src = n1 > 0 ? from : to;
        const b = i * STRIDE;
        mp.set(at(src, a), at(src, a + 1), at(src, a + 2)).lerp(
          ms.set(at(to, b), at(to, b + 1), at(to, b + 2)),
          t,
        );
        mq.set(at(src, a + 3), at(src, a + 4), at(src, a + 5), at(src, a + 6));
        mq2.set(at(to, b + 3), at(to, b + 4), at(to, b + 5), at(to, b + 6));
        mq.slerp(mq2, t);
        const scale = at(src, a + 7) + (at(to, b + 7) - at(src, a + 7)) * t;
        shown.set([mp.x, mp.y, mp.z, mq.x, mq.y, mq.z, mq.w, scale], b);
        matrix.compose(mp, mq, ms.setScalar(scale));
        mesh.setMatrixAt(i, matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    });
  }

  // ── THE SCALE GUIDE ── the form's outline projected through the camera (SVG, crisp)
  const gp = new Vector3();
  function drawGuide(): void {
    const keyNow = `${spec?.form ?? ''}|${frame.y.toFixed(3)}|${frame.distance.toFixed(3)}|${String(width)}x${String(height)}`;
    if (keyNow === guideKey) return;
    guideKey = keyNow;
    guide.setAttribute('viewBox', `0 0 ${String(width)} ${String(height)}`);
    const d = (form?.guide ?? [])
      .map((poly) =>
        poly
          .map(([x, y], i) => {
            gp.set(x, y, 0).project(camera);
            const sx = ((gp.x + 1) / 2) * width;
            const sy = ((1 - gp.y) / 2) * height;
            return `${i === 0 ? 'M' : 'L'}${sx.toFixed(1)} ${sy.toFixed(1)}`;
          })
          .join(''),
      )
      .join('');
    guidePath.setAttribute('d', d);
  }

  // ── DRAW ──
  function draw(dt: number): void {
    if (disposed) return;
    // Turning: on its own, slowly; a flick coasts and slows down
    if (!dragging) {
      if (Math.abs(spin) > 1e-3 && !reduced) {
        yaw += spin * dt;
        spin *= Math.exp(-dt / COAST);
      } else spin = 0;
      idle += dt;
      if (!reduced && idle > AUTO_PAUSE) {
        swing += dt;
        // Unwind whole turns from a drag, then ease into the swing
        yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
        const goal = SWING * Math.sin((2 * Math.PI * swing) / SWING_PERIOD);
        yaw += (goal - yaw) * (1 - Math.exp(-dt / 1.6));
      }
    }
    spinner.rotation.y = yaw;

    // Changes: slides and crossfades
    for (const piece of [...pieces]) {
      if (piece.slide < 1) {
        piece.slide = reduced ? 1 : Math.min(piece.slide + dt / SLIDE, 1);
        writeInstances(piece);
      }
      if (piece.fading !== 0) {
        const next = reduced
          ? piece.fading > 0
            ? 1
            : 0
          : piece.opacity + (piece.fading * dt) / FADE;
        setOpacity(piece, Math.min(Math.max(next, 0), 1));
        if (piece.fading > 0 && piece.opacity >= 1) piece.fading = 0;
        if (piece.fading < 0 && piece.opacity <= 0) {
          pieces.splice(pieces.indexOf(piece), 1);
          disposePiece(piece);
        }
      }
    }

    const ease = reduced ? 1 : 1 - Math.exp(-dt / 0.22);
    frame.y += (frame.goalY - frame.y) * ease;
    frame.distance += (frame.goalDistance - frame.distance) * ease;
    camera.position.set(
      0,
      frame.y + Math.sin(PITCH) * frame.distance,
      Math.cos(PITCH) * frame.distance,
    );
    camera.lookAt(0, frame.y, 0);
    camera.near = Math.max(frame.distance / 50, 0.05);
    camera.far = frame.distance * 4;
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    drawGuide();
    renderer.render(scene, camera);
  }

  // ── LOOP ── only while the piece is showing; with reduced motion, on demand
  let running = false;
  let last = 0;
  const tick = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.1);
    last = now;
    draw(dt);
  };
  function updateLoop(): void {
    const run = active && !reduced && !disposed;
    if (run === running) return;
    running = run;
    if (run) {
      last = performance.now();
      renderer.setAnimationLoop(tick);
    } else renderer.setAnimationLoop(null);
  }
  const redraw = () => {
    if (!running && !disposed) draw(0);
  };

  // ── SIZE ──
  function resize(): void {
    width = Math.max(host.clientWidth, 1);
    height = Math.max(host.clientHeight, 1);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    if (current && spec) place(current, spec.length, true);
    redraw();
  }
  const sizeObserver = new ResizeObserver(resize);
  sizeObserver.observe(host);
  width = Math.max(host.clientWidth, 1);
  height = Math.max(host.clientHeight, 1);
  renderer.setSize(width, height, false);
  camera.aspect = width / height;

  // ── DRAG ── horizontal drags turn the piece; vertical ones scroll the dialog
  let dragging = false;
  let press: {
    id: number;
    x: number;
    y: number;
    lastX: number;
    lastT: number;
    mode: 'pending' | 'drag' | 'scroll';
  } | null = null;
  const onDown = (e: PointerEvent) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    press = {
      id: e.pointerId,
      x: e.clientX,
      y: e.clientY,
      lastX: e.clientX,
      lastT: e.timeStamp,
      mode: 'pending',
    };
  };
  const onMove = (e: PointerEvent) => {
    if (press?.id !== e.pointerId) return;
    const dx = e.clientX - press.x;
    const dy = e.clientY - press.y;
    if (press.mode === 'pending') {
      if (Math.abs(dx) > DRAG_START && Math.abs(dx) > Math.abs(dy)) {
        press.mode = 'drag';
        dragging = true;
        canvas.setPointerCapture(e.pointerId);
      } else if (Math.abs(dy) > DRAG_START) press.mode = 'scroll';
    }
    if (press.mode !== 'drag') return;
    const step = e.clientX - press.lastX;
    const dt = (e.timeStamp - press.lastT) / 1000;
    yaw += step * DRAG_TURN;
    if (dt > 0) spin = 0.7 * ((step * DRAG_TURN) / dt) + 0.3 * spin;
    press.lastX = e.clientX;
    press.lastT = e.timeStamp;
    idle = 0;
    redraw();
  };
  const onUp = (e: PointerEvent) => {
    if (press?.id !== e.pointerId) return;
    if (press.mode === 'drag' && e.timeStamp - press.lastT > 80) spin = 0;
    press = null;
    dragging = false;
    idle = 0;
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);

  const onContextLost = (event: Event) => {
    event.preventDefault();
    running = false;
    renderer.setAnimationLoop(null);
    options.onFailed?.();
  };
  canvas.addEventListener('webglcontextlost', onContextLost);

  // ── DEVELOPMENT HOOK ── steel colour and cost of the preview
  const removeHook = import.meta.env.DEV
    ? (() => {
        const w = window as unknown as { __insomniaPiece?: unknown };
        w.__insomniaPiece = {
          state: () => ({
            spec,
            active,
            running,
            yaw,
            links: current?.meshes.reduce((sum, mesh) => sum + mesh.count, 0) ?? 0,
            pieces: pieces.length,
            memory: { ...renderer.info.memory },
            programs: renderer.info.programs?.length ?? 0,
          }),
          /** Mean colour and saturation of the steel (pixels the piece covers fully). */
          measure: (atYaw = REST_YAW) => {
            const saved = yaw;
            yaw = atYaw;
            spin = 0;
            idle = -1e9;
            draw(0);
            const gl = renderer.getContext();
            const w2 = gl.drawingBufferWidth;
            const h2 = gl.drawingBufferHeight;
            const data = new Uint8Array(w2 * h2 * 4);
            gl.readPixels(0, 0, w2, h2, gl.RGBA, gl.UNSIGNED_BYTE, data);
            let count = 0;
            let sat = 0;
            let sumR = 0;
            let sumG = 0;
            let sumB = 0;
            for (let i = 0; i < data.length; i += 4) {
              if (at(data, i + 3) < 250) continue;
              const r = at(data, i);
              const g = at(data, i + 1);
              const b = at(data, i + 2);
              const max = Math.max(r, g, b);
              const min = Math.min(r, g, b);
              sat += max > 0 ? (max - min) / max : 0;
              sumR += r;
              sumG += g;
              sumB += b;
              count += 1;
            }
            yaw = saved;
            idle = 0;
            return {
              pixels: count,
              saturation: count ? sat / count : 0,
              rgb: [sumR, sumG, sumB].map((v) => Math.round(v / Math.max(count, 1))),
            };
          },
          /** ms per frame, rendered back to back (not capped by vsync). */
          bench: (frames = 120) => {
            const gl = renderer.getContext();
            const pixel = new Uint8Array(4);
            draw(1 / 60);
            gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
            const t0 = performance.now();
            for (let i = 0; i < frames; i++) draw(1 / 60);
            gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
            return (performance.now() - t0) / frames;
          },
        };
        return () => {
          delete w.__insomniaPiece;
        };
      })()
    : undefined;

  return {
    set(next: PieceSpec): void {
      if (disposed) return;
      if (spec?.link === next.link && spec.form === next.form && spec.length === next.length)
        return;
      spec = next;
      const thickness = patternFor(next.link).thickness;
      form = buildForm(next.form, next.length, thickness);
      setBody(form, thickness);
      if (current?.id !== next.link) {
        // A new link crossfades in; the old one fades out and is freed
        const old = current;
        current = makePiece(next.link);
        pieces.push(current);
        place(current, next.length, true);
        if (old && !reduced) {
          old.fading = -1;
          current.fading = 1;
          setOpacity(current, 0);
        } else if (old) {
          pieces.splice(pieces.indexOf(old), 1);
          disposePiece(old);
        }
      } else {
        // Same link, new form or size: the links slide into the new shape
        place(current, next.length, reduced);
      }
      redraw();
    },

    setActive(on: boolean): void {
      if (disposed) return;
      active = on;
      idle = AUTO_PAUSE;
      updateLoop();
      redraw();
    },

    setReducedMotion(on: boolean): void {
      if (disposed) return;
      reduced = on;
      if (on) {
        yaw = REST_YAW;
        spin = 0;
      }
      updateLoop();
      redraw();
    },

    dispose(): void {
      if (disposed) return;
      disposed = true;
      running = false;
      stats.disposed += 1;
      renderer.setAnimationLoop(null);
      removeHook?.();
      sizeObserver.disconnect();
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onUp);
      canvas.removeEventListener('webglcontextlost', onContextLost);
      pieces.forEach(disposePiece);
      pieces.length = 0;
      patterns.forEach((pattern) => {
        pattern.components.forEach((component) => {
          component.geometry.dispose();
        });
        pattern.normalMap?.dispose();
      });
      patterns.clear();
      claspGeometry.dispose();
      body?.geometry.dispose();
      bodyMaterial.dispose();
      scene.environment = null;
      envTarget.dispose();
      key.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      guide.remove();
    },
  };
}
