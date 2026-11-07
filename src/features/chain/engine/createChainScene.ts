import {
  ACESFilmicToneMapping,
  DirectionalLight,
  DynamicDrawUsage,
  Fog,
  InstancedMesh,
  MathUtils,
  Matrix4,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  SRGBColorSpace,
  Vector3,
  WebGLRenderer,
} from 'three';

import type { ChainScene, ChainSceneOptions } from '../types';
import { buildPath, cameraYFor, type ChainPath } from './buildPath';
import {
  CAMERA_FAR,
  CAMERA_FOV,
  CAMERA_NEAR,
  DIST,
  DRIFT,
  ENV_BLUR,
  FOG_COLOR,
  FOG_FAR,
  FOG_NEAR,
  FRAME_SAMPLES,
  KEY_LIGHT_COLOR,
  KEY_LIGHT_INTENSITY,
  KEY_LIGHT_POSITION,
  MAX_FRAME_DT,
  MAX_LINKS,
  MAX_PIXEL_RATIO,
  PARALLAX,
  PITCH,
  PULL,
  PULL_COAST,
  PULL_GRIP,
  RESIZE_DEBOUNCE_MS,
  SCROLL_EASE,
  TONE_MAPPING_EXPOSURE,
} from './constants';
import { createLinkGeometry, createSteelMaterial } from './geometry';
import { createStudioEnvironment } from './studioEnvironment';

/**
 * One long steel chain on a fixed, full-viewport canvas behind the page.
 *
 * Creates its own <canvas> inside `container` (the fixed stage) and removes it
 * again in dispose(), so mounting twice can never leave two canvases or two
 * WebGL contexts. Throws if WebGL is unavailable; the caller falls back to the
 * photos. Everything here runs outside React: scrolling never re-renders.
 */
export function createChainScene(container: HTMLElement, options: ChainSceneOptions): ChainScene {
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);

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
    throw error;
  }

  let reducedMotion = options.reducedMotion;
  let parallax = reducedMotion ? 1 : PARALLAX;

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, MAX_PIXEL_RATIO));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = TONE_MAPPING_EXPOSURE;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  scene.fog = new Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);
  const camera = new PerspectiveCamera(CAMERA_FOV, 1, CAMERA_NEAR, CAMERA_FAR);
  const tanHalfFov = Math.tan(MathUtils.degToRad(camera.fov / 2));

  // ── REFLECTIONS ── a studio built in code, baked into an environment map.
  const pmrem = new PMREMGenerator(renderer);
  const studio = createStudioEnvironment();
  const envTarget = pmrem.fromScene(studio.scene, ENV_BLUR);
  scene.environment = envTarget.texture;
  pmrem.dispose();
  studio.dispose();

  const key = new DirectionalLight(KEY_LIGHT_COLOR, KEY_LIGHT_INTENSITY);
  key.position.set(...KEY_LIGHT_POSITION);
  scene.add(key);

  // ── LINKS ──
  const linkGeometry = createLinkGeometry();
  const steel = createSteelMaterial();
  const chain = new InstancedMesh(linkGeometry, steel, MAX_LINKS);
  chain.instanceMatrix.setUsage(DynamicDrawUsage);
  chain.frustumCulled = false; // instances are culled by hand in layoutLinks()
  chain.count = 0;
  scene.add(chain);

  let path: ChainPath | null = null;
  const pxToWorld = () => path?.pxToWorld ?? 1;

  // Links slide along the path by `flow`. Offsetting the first link by a multiple of
  // two pitches keeps each link's orientation (flat / upright) as it travels.
  const m = new Matrix4();
  const p = new Vector3();
  const xAxis = new Vector3();
  const yAxis = new Vector3();
  const zAxis = new Vector3();
  let flow = 0;

  function layoutLinks(current: ChainPath): void {
    const camX = camera.position.x;
    const camY = camera.position.y;
    const { curve, length, frames } = current;
    const start = MathUtils.euclideanModulo(flow, 2 * PITCH) - 2 * PITCH;
    let n = 0;
    for (let i = 0; n < MAX_LINKS; i++) {
      const s = start + i * PITCH;
      if (s > length) break;
      if (s < 0) continue;
      const u = s / length;
      curve.getPointAt(u, p);
      // Skip links outside the view (with a margin for their size).
      const halfH = (DIST - p.z) * tanHalfFov + 1.5;
      if (Math.abs(p.y - camY) > halfH || Math.abs(p.x - camX) > halfH * camera.aspect + 1.5) {
        continue;
      }
      const k = Math.round(u * FRAME_SAMPLES);
      const tangent = frames.tangents[k];
      // Every other link uses the binormal instead of the normal, so neighbours interlock.
      const up = i % 2 ? frames.binormals[k] : frames.normals[k];
      if (!tangent || !up) continue;
      xAxis.copy(tangent);
      yAxis.copy(up);
      zAxis.crossVectors(xAxis, yAxis);
      m.makeBasis(xAxis, yAxis, zAxis).setPosition(p);
      chain.setMatrixAt(n++, m);
    }
    chain.count = n;
    chain.instanceMatrix.needsUpdate = true;
  }

  // ── RENDER ──
  // The chain responds to scrolling only, never to the pointer or device orientation.
  // - The camera follows an eased copy of the scroll position, so the view glides
  //   after the page and settles instead of jumping with every wheel step.
  // - Scrolling pulls the links along the chain like a hand hauling it: the pull
  //   takes hold almost at once, and when it stops the heavy chain keeps sliding a
  //   moment and coasts to a halt. Scrolling up pulls it back.
  let smoothScroll = window.scrollY;
  let lastScroll = smoothScroll;
  let pullSpeed = 0;

  function draw(): void {
    camera.position.set(0, cameraYFor(smoothScroll, pxToWorld(), parallax), DIST);
    if (path) layoutLinks(path);
    renderer.render(scene, camera);
  }

  let last = performance.now();
  function frame(now: number): void {
    const dt = Math.min((now - last) / 1000, MAX_FRAME_DT);
    last = now;
    if (dt <= 0) return;

    const scroll = window.scrollY;
    smoothScroll += (scroll - smoothScroll) * (1 - Math.exp(-dt / SCROLL_EASE));

    const target = ((scroll - lastScroll) / dt) * pxToWorld() * PULL;
    lastScroll = scroll;
    const tau = Math.abs(target) > Math.abs(pullSpeed) ? PULL_GRIP : PULL_COAST;
    pullSpeed += (target - pullSpeed) * (1 - Math.exp(-dt / tau));

    flow += (DRIFT + pullSpeed) * dt;
    draw();
  }

  // Jump straight to the real scroll position (when nothing was animating it).
  function syncScroll(): void {
    smoothScroll = lastScroll = window.scrollY;
    pullSpeed = 0;
  }

  // ── LOOP ── only render while a window onto the chain is on screen.
  const showing = new Set<Element>();
  let running = false;
  let disposed = false;

  function updateLoop(): void {
    if (disposed) return;
    const shouldRun = showing.size > 0 && !document.hidden && !reducedMotion;
    if (shouldRun === running) return;
    running = shouldRun;
    if (running) {
      last = performance.now();
      syncScroll();
      renderer.setAnimationLoop(frame);
    } else {
      renderer.setAnimationLoop(null);
    }
  }

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) showing.add(entry.target);
      else showing.delete(entry.target);
    }
    updateLoop();
  });
  const observed = new Set<Element>();

  /** Observe exactly the current anchors (they can mount after the engine). */
  function syncObserved(windows: readonly Element[]): void {
    const next = new Set(windows);
    for (const el of observed) {
      if (!next.has(el)) {
        io.unobserve(el);
        observed.delete(el);
        showing.delete(el);
      }
    }
    for (const el of next) {
      if (!observed.has(el)) {
        io.observe(el);
        observed.add(el);
      }
    }
    updateLoop();
  }

  // With reduced motion there is no loop: redraw only when the page scrolls.
  let drawFrame = 0;
  function onScroll(): void {
    if (running || drawFrame || showing.size === 0) return;
    drawFrame = requestAnimationFrame(() => {
      drawFrame = 0;
      syncScroll();
      draw();
    });
  }

  const docTop = (el: Element) => el.getBoundingClientRect().top + window.scrollY;

  function rebuild(): void {
    if (disposed) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;

    const { hero, bands } = options.getAnchors();
    syncObserved(hero ? [hero, ...bands] : bands);

    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    path = buildPath({
      viewportWidth: width,
      viewportHeight: height,
      tanHalfFov,
      parallax,
      bands: bands.map((band) => ({ top: docTop(band), height: band.offsetHeight })),
    });
    if (!running) {
      syncScroll();
      draw();
    }
  }

  // Band positions move when fonts, images or the viewport change size.
  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  const bodyObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rebuild, RESIZE_DEBOUNCE_MS);
  });
  bodyObserver.observe(document.body);
  window.addEventListener('resize', rebuild);
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', updateLoop);

  rebuild();
  updateLoop();

  const readyFrame = requestAnimationFrame(() => {
    options.onReady?.();
  });

  return {
    rebuild,

    setReducedMotion(reduced: boolean): void {
      if (disposed || reduced === reducedMotion) return;
      reducedMotion = reduced;
      parallax = reduced ? 1 : PARALLAX;
      rebuild(); // the band stretches depend on the parallax factor
      updateLoop();
    },

    dispose(): void {
      if (disposed) return;
      disposed = true;
      running = false;
      renderer.setAnimationLoop(null);
      cancelAnimationFrame(readyFrame);
      cancelAnimationFrame(drawFrame);
      clearTimeout(resizeTimer);

      io.disconnect();
      bodyObserver.disconnect();
      window.removeEventListener('resize', rebuild);
      window.removeEventListener('scroll', onScroll);
      document.removeEventListener('visibilitychange', updateLoop);

      scene.environment = null;
      envTarget.dispose();
      chain.dispose();
      linkGeometry.dispose();
      steel.dispose();
      key.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
      path = null;
    },
  };
}
