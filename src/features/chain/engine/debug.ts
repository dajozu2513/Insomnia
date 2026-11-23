import { WebGLRenderTarget, type Object3D, type WebGLRenderer } from 'three';

/*
 * Development-only review tools, installed as window.__insomniaChain by the
 * engine when import.meta.env.DEV is true (never in production builds).
 *
 *   __insomniaChain.measure(progress, target)  colour of the steel ('chain', 'watch'
 *                                      at the edge, or 'objects': the floating watches,
 *                                      clock faces and keys) at a night progress, for the
 *                                      view on screen (renders twice: with and without
 *                                      that steel; its pixels are where the frames differ)
 *   __insomniaChain.presence()         veil strength, how far the motes gather in
 *                                      the hole, the motes' streak, roses on screen and
 *                                      band 2's word, as of the last frame
 *   __insomniaChain.memory()           geometries, textures and shader programs alive
 *   __insomniaChain.bench(frames)      CPU+GPU time per frame: everything, without
 *                                      the atmosphere layers, without the fall's scene
 *                                      (walls, roots, stones, the edge) and without the
 *                                      objects of the fall, rendered into an offscreen
 *                                      target of the canvas's size so vsync does not cap
 *                                      the numbers
 */

interface DebugTargets {
  renderer: WebGLRenderer;
  /** Draws the current view (camera at the real scroll position). */
  render: () => void;
  /** The steel that can be measured, by name (read when measured: objects load late). */
  steel: Record<SteelTarget, () => readonly Object3D[]>;
  /** Turns the objects of the fall on or off for the next draws. */
  setObjects: (on: boolean) => void;
  /** Near cells of one kind of object between two heights (to frame screenshots). */
  cells: (kind: string, top: number, bottom: number) => { y: number; d: number; u: number }[];
  /** Turns the motes, glow and veils on or off for the next draws. */
  setAtmosphere: (on: boolean) => void;
  /** Turns the fall's scene (walls, roots, stones, the edge of the hole) on or off. */
  setFallScene: (on: boolean) => void;
  setNight: (progress: number) => void;
  restoreNight: () => void;
  presence: () => {
    mist: number;
    inHole: number;
    stretch: number;
    roses: number;
    assembly: number;
    objects: boolean;
    cameraY: number;
    landed: number;
    bandYs: number[];
    /** The render loop is running; paused while a product dialog is open. */
    running: boolean;
    paused: boolean;
  };
}

type SteelTarget = 'chain' | 'watch' | 'objects' | 'landing' | 'rack' | 'walls' | 'roots';

export interface ChainColour {
  progress: number;
  target: SteelTarget;
  /** Chain pixels found. */
  pixels: number;
  /** Mean HSV saturation of the chain's pixels, 0..1. */
  saturation: number;
  /** Mean relative luminance of the chain's pixels, 0..1. */
  luminance: number;
  /** Mean R, G, B of the chain's pixels, 0..255. */
  rgb: [number, number, number];
  /** Hue of the mean colour, degrees (0 red, 30 brown and ochre, 60 yellow). */
  hue: number;
  /** Share of the pixels with a pink or red cast: hue 300 to 15 degrees, saturation above 0.12. */
  pinkShare: number;
  /**
   * Where the pink pixels are, by the brightest channel (below 8, 8 to 15, 16 to 23,
   * 24 and up), as shares of all the pixels: on near-black pixels a hue means nothing.
   */
  pinkByBrightness: [number, number, number, number];
  /** The same for the visibly lit pixels only (brightest channel 24 or more), where a cast shows. */
  lit: {
    pixels: number;
    saturation: number;
    rgb: [number, number, number];
    hue: number;
    pinkShare: number;
  };
}

function readFrame(renderer: WebGLRenderer): { data: Uint8Array; width: number; height: number } {
  const gl = renderer.getContext();
  const width = gl.drawingBufferWidth;
  const height = gl.drawingBufferHeight;
  const data = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
  return { data, width, height };
}

function linear(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

/** HSV hue in degrees. */
function hueOf(r: number, g: number, b: number, max: number, min: number): number {
  const d = max - min;
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return (h * 60 + 360) % 360;
}

export function installDebugHook(targets: DebugTargets): () => void {
  const {
    renderer,
    render,
    steel,
    setAtmosphere,
    setFallScene,
    setObjects,
    setNight,
    restoreNight,
    presence,
  } = targets;

  const api = {
    presence,
    cells: targets.cells,
    /** GPU resources alive in the renderer (to check that nothing leaks). */
    memory: () => ({ ...renderer.info.memory, programs: renderer.info.programs?.length ?? 0 }),

    measure(progress: number, target: SteelTarget = 'chain'): ChainColour {
      const objects = steel[target]();
      // The earth (walls, roots) is measured without the motes and veils in front of it
      const earth = target === 'walls' || target === 'roots';
      if (earth) setAtmosphere(false);
      setNight(progress);
      render();
      const withChain = readFrame(renderer);
      objects.forEach((o) => (o.visible = false));
      render();
      const without = readFrame(renderer);
      objects.forEach((o) => (o.visible = true));

      let pixels = 0;
      let pink = 0;
      const pinkBuckets = [0, 0, 0, 0];
      let litPixels = 0;
      let litPink = 0;
      let litSaturation = 0;
      const litSum = [0, 0, 0];
      let saturation = 0;
      let luminance = 0;
      const sum = [0, 0, 0];
      const a = withChain.data;
      const b = without.data;
      for (let i = 0; i < a.length; i += 4) {
        const r = a[i] ?? 0;
        const g = a[i + 1] ?? 0;
        const bl = a[i + 2] ?? 0;
        const diff =
          Math.abs(r - (b[i] ?? 0)) +
          Math.abs(g - (b[i + 1] ?? 0)) +
          Math.abs(bl - (b[i + 2] ?? 0));
        if (diff < 24) continue; // not a chain pixel
        const max = Math.max(r, g, bl);
        const min = Math.min(r, g, bl);
        pixels++;
        const sat = max > 0 ? (max - min) / max : 0;
        saturation += sat;
        const pinkish =
          sat > 0.12 && max > min && ((h) => h >= 300 || h <= 15)(hueOf(r, g, bl, max, min));
        if (pinkish) {
          pink++;
          const bucket = max < 8 ? 0 : max < 16 ? 1 : max < 24 ? 2 : 3;
          pinkBuckets[bucket] = (pinkBuckets[bucket] ?? 0) + 1;
        }
        if (max >= 24) {
          litPixels++;
          litSaturation += sat;
          if (pinkish) litPink++;
          litSum[0] = (litSum[0] ?? 0) + r;
          litSum[1] = (litSum[1] ?? 0) + g;
          litSum[2] = (litSum[2] ?? 0) + bl;
        }
        luminance += 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(bl);
        sum[0] = (sum[0] ?? 0) + r;
        sum[1] = (sum[1] ?? 0) + g;
        sum[2] = (sum[2] ?? 0) + bl;
      }
      if (earth) setAtmosphere(true);
      restoreNight();
      render();
      const n = Math.max(pixels, 1);
      const rgb: [number, number, number] = [
        (sum[0] ?? 0) / n,
        (sum[1] ?? 0) / n,
        (sum[2] ?? 0) / n,
      ];
      const hi = Math.max(...rgb);
      const lo = Math.min(...rgb);
      return {
        progress,
        target,
        pixels,
        saturation: saturation / n,
        luminance: luminance / n,
        rgb,
        hue: hi > lo ? hueOf(rgb[0], rgb[1], rgb[2], hi, lo) : 0,
        pinkShare: pink / n,
        pinkByBrightness: [
          (pinkBuckets[0] ?? 0) / n,
          (pinkBuckets[1] ?? 0) / n,
          (pinkBuckets[2] ?? 0) / n,
          (pinkBuckets[3] ?? 0) / n,
        ],
        lit: (() => {
          const ln = Math.max(litPixels, 1);
          const lrgb: [number, number, number] = [
            (litSum[0] ?? 0) / ln,
            (litSum[1] ?? 0) / ln,
            (litSum[2] ?? 0) / ln,
          ];
          const lhi = Math.max(...lrgb);
          const llo = Math.min(...lrgb);
          return {
            pixels: litPixels,
            saturation: litSaturation / ln,
            rgb: lrgb,
            hue: lhi > llo ? hueOf(lrgb[0], lrgb[1], lrgb[2], lhi, llo) : 0,
            pinkShare: litPink / ln,
          };
        })(),
      };
    },

    bench(frames = 120): {
      withAtmosphere: number;
      withoutAtmosphere: number;
      withoutFallScene: number;
      withoutObjects: number;
    } {
      const gl = renderer.getContext();
      const target = new WebGLRenderTarget(gl.drawingBufferWidth, gl.drawingBufferHeight, {
        samples: 4,
      });
      const pixel = new Uint8Array(4);
      const time = (): number => {
        renderer.setRenderTarget(target);
        const start = performance.now();
        for (let i = 0; i < frames; i++) render();
        renderer.readRenderTargetPixels(target, 0, 0, 1, 1, pixel); // wait for the GPU
        const ms = (performance.now() - start) / frames;
        renderer.setRenderTarget(null);
        return ms;
      };
      time(); // warm up
      const withAtmosphere = time();
      setAtmosphere(false);
      const withoutAtmosphere = time();
      setAtmosphere(true);
      setFallScene(false);
      const withoutFallScene = time();
      setFallScene(true);
      setObjects(false);
      const withoutObjects = time();
      setObjects(true);
      target.dispose();
      render();
      return { withAtmosphere, withoutAtmosphere, withoutFallScene, withoutObjects };
    },
  };

  const host = window as unknown as { __insomniaChain?: typeof api };
  host.__insomniaChain = api;
  return () => {
    if (host.__insomniaChain === api) delete host.__insomniaChain;
  };
}
