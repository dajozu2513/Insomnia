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

import type { ChainAnchors, ChainScene, ChainSceneOptions } from '../types';
import { buildPath, cameraYFor, type ChainPath } from './buildPath';
import {
  CAMERA_FAR,
  CAMERA_FOV,
  CAMERA_NEAR,
  DIST,
  DRIFT,
  ENV_BLUR,
  FLOOR_ANISOTROPY,
  FLOOR_DROP_PORTRAIT,
  FLOOR_DROP_WIDE,
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
  PARTICLES_DESKTOP,
  PARTICLES_SMALL,
  PITCH,
  PULL,
  PULL_COAST,
  PULL_GRIP,
  RESIZE_DEBOUNCE_MS,
  RIM_LIGHT_POSITION,
  SCROLL_EASE,
  SMALL_SCREEN_MAX,
  TONE_MAPPING_EXPOSURE,
} from './constants';
import { installDebugHook } from './debug';
import { createFloor } from './floor';
import { createLinkGeometry, createSteelMaterial } from './geometry';
import { createGlow } from './glow';
import { createHeroMist } from './heroMist';
import { createNightState, sampleNight } from './nightCycle';
import { createParticles } from './particles';
import { createStudioEnvironment } from './studioEnvironment';

/**
 * One long steel chain on a fixed, full-viewport canvas behind the page, in a
 * night atmosphere: a chessboard floor in the mist under the hero, slow dust,
 * fog, and lighting that follows the night cycle.
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
  renderer.setClearColor(FOG_COLOR, 1);
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = TONE_MAPPING_EXPOSURE;
  renderer.outputColorSpace = SRGBColorSpace;

  const scene = new Scene();
  const fog = new Fog(FOG_COLOR, FOG_NEAR, FOG_FAR);
  scene.fog = fog;
  const camera = new PerspectiveCamera(CAMERA_FOV, 1, CAMERA_NEAR, CAMERA_FAR);
  const tanHalfFov = Math.tan(MathUtils.degToRad(camera.fov / 2));

  // ── REFLECTIONS ── a studio built in code, baked into an environment map once.
  // The night cycle never re-bakes it: it is what keeps the steel neutral silver.
  const pmrem = new PMREMGenerator(renderer);
  const studio = createStudioEnvironment();
  const envTarget = pmrem.fromScene(studio.scene, ENV_BLUR);
  scene.environment = envTarget.texture;
  pmrem.dispose();
  studio.dispose();

  const key = new DirectionalLight(KEY_LIGHT_COLOR, KEY_LIGHT_INTENSITY);
  key.position.set(...KEY_LIGHT_POSITION);
  scene.add(key);

  // Rim light from behind and above: its tint and strength follow the night.
  const rim = new DirectionalLight(0xffffff, 0);
  rim.position.set(...RIM_LIGHT_POSITION);
  scene.add(rim);

  // ── ATMOSPHERE ──
  const small = container.clientWidth <= SMALL_SCREEN_MAX;
  const floor = createFloor(Math.min(renderer.capabilities.getMaxAnisotropy(), FLOOR_ANISOTROPY));
  scene.add(floor.mesh);
  const particles = createParticles(small ? PARTICLES_SMALL : PARTICLES_DESKTOP);
  scene.add(particles.points);
  const glow = createGlow();
  scene.add(glow.mesh);
  const heroMist = createHeroMist();
  scene.add(heroMist.mesh);
  /** Debug switch (bench): draw the atmosphere layers or not. */
  let atmosphereOn = true;

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
  /** Hero-only layers as of the last draw (also read by the debug hook). */
  let floorPresence = 0;
  let mistPresence = 0;
  /** The windows, as of the last rebuild. */
  let anchors: ChainAnchors = { hero: null, bands: [] };

  /**
   * How present the hero window is, from its real position on the page (not the
   * eased camera): 1 while it fills the top of the viewport, 0 once it is gone.
   * The floor and the hero's red mist belong to the hero alone, so both are also
   * forced off whenever any band is on screen, at any scroll speed.
   */
  function heroPresence(): { hero: number; bandOnScreen: boolean } {
    const vh = window.innerHeight;
    const rect = anchors.hero?.getBoundingClientRect();
    const hero = rect ? MathUtils.clamp(rect.bottom / vh, 0, 1) : 0;
    const bandOnScreen = anchors.bands.some((band) => {
      const r = band.getBoundingClientRect();
      return r.bottom > 0 && r.top < vh;
    });
    return { hero, bandOnScreen };
  }

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

  // ── NIGHT CYCLE ── cheap parameters only, applied when the progress changes.
  const night = createNightState();
  let appliedNight = -1;

  function applyNight(progress: number): boolean {
    if (Math.abs(progress - appliedNight) < 1e-4) return false;
    appliedNight = progress;
    sampleNight(progress, night);
    fog.color.copy(night.fog);
    fog.near = night.fogNear;
    fog.far = night.fogFar;
    // The canvas clears to the fog colour, so the floor's far edge dissolves into it.
    renderer.setClearColor(night.fog, 1);
    renderer.toneMappingExposure = night.exposure;
    rim.color.copy(night.rimColor);
    rim.intensity = night.rimIntensity;
    glow.setStrength(night.glow);
    return true;
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

  /** `dt` advances the dust; 0 (reduced motion, redraws on scroll) keeps it still. */
  function draw(dt = 0): void {
    const camY = cameraYFor(smoothScroll, pxToWorld(), parallax);
    camera.position.set(0, camY, DIST);
    if (path) {
      // Floor and red mist belong to the hero window: they fade as it leaves and
      // never show while a band is on screen.
      const { hero, bandOnScreen } = heroPresence();
      const inHero = atmosphereOn && !bandOnScreen;
      floorPresence = inHero && camY > floor.y + 0.5 ? MathUtils.smoothstep(hero, 0.55, 0.9) : 0;
      mistPresence = inHero ? MathUtils.smoothstep(hero, 0.3, 0.85) : 0;
      floor.setPresence(floorPresence);
      heroMist.setPresence(mistPresence);
      heroMist.follow(camY, path.halfWidth, path.viewHeight);
      particles.points.visible = atmosphereOn;
      glow.mesh.visible = atmosphereOn && night.glow > 0.002;
      glow.follow(camY, path.halfWidth, path.viewHeight);
      particles.update(dt, camY, path.halfWidth, path.viewHeight);
      layoutLinks(path);
    }
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
    draw(dt);
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
    if (disposed || contextLost) return;
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

  const docTop = (el: Element) => el.getBoundingClientRect().top + window.scrollY;

  function rebuild(): void {
    if (disposed) return;
    const width = container.clientWidth;
    const height = container.clientHeight;
    if (width === 0 || height === 0) return;

    anchors = options.getAnchors();
    const { hero, bands } = anchors;
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
    // Floor below the necklace: lower on tall screens, so the title and ring stay clear.
    floor.y = -path.viewHeight * MathUtils.lerp(FLOOR_DROP_PORTRAIT, FLOOR_DROP_WIDE, path.wide);
    floor.mesh.position.y = floor.y;
    if (!running) {
      syncScroll();
      draw();
    }
  }

  // The night follows the page inside the shared scroll frame. Lighting changes only
  // when the progress does. Without a running loop (reduced motion, or nothing on
  // screen), this is also where the scene redraws on scroll.
  applyNight(options.night.get());
  // ── CONTEXT LOSS ── stop at once and let the owner rebuild on a fresh canvas.
  // preventDefault keeps the browser from treating the loss as final.
  let contextLost = false;
  const onContextLost = (event: Event): void => {
    event.preventDefault();
    contextLost = true;
    running = false;
    renderer.setAnimationLoop(null);
    options.onContextLost?.();
  };
  canvas.addEventListener('webglcontextlost', onContextLost);

  const unsubscribeNight = options.night.subscribe((progress) => {
    const changed = applyNight(progress);
    if (!running && showing.size > 0 && (changed || window.scrollY !== lastScroll)) {
      syncScroll();
      draw();
    }
  });

  // Band positions move when fonts, images or the viewport change size.
  let resizeTimer: ReturnType<typeof setTimeout> | undefined;
  const bodyObserver = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(rebuild, RESIZE_DEBOUNCE_MS);
  });
  bodyObserver.observe(document.body);
  window.addEventListener('resize', rebuild);
  document.addEventListener('visibilitychange', updateLoop);

  rebuild();
  updateLoop();

  const readyFrame = requestAnimationFrame(() => {
    options.onReady?.();
  });

  // Development only: chain-colour measurement and frame timing (see debug.ts).
  const removeDebugHook = import.meta.env.DEV
    ? installDebugHook({
        renderer,
        render: () => {
          syncScroll();
          draw();
        },
        chain,
        setAtmosphere: (on) => {
          atmosphereOn = on;
        },
        setNight: (progress) => {
          appliedNight = -1;
          applyNight(progress);
        },
        presence: () => ({ floor: floorPresence, mist: mistPresence }),
        restoreNight: () => {
          appliedNight = -1;
          applyNight(options.night.get());
        },
      })
    : undefined;

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
      clearTimeout(resizeTimer);
      removeDebugHook?.();

      unsubscribeNight();
      io.disconnect();
      bodyObserver.disconnect();
      window.removeEventListener('resize', rebuild);
      document.removeEventListener('visibilitychange', updateLoop);
      canvas.removeEventListener('webglcontextlost', onContextLost);

      scene.environment = null;
      envTarget.dispose();
      chain.dispose();
      linkGeometry.dispose();
      steel.dispose();
      floor.dispose();
      heroMist.dispose();
      particles.dispose();
      glow.dispose();
      key.dispose();
      rim.dispose();
      renderer.dispose();
      if (!contextLost) renderer.forceContextLoss();
      canvas.remove();
      path = null;
    },
  };
}
