import { WebGLRenderTarget, type InstancedMesh, type WebGLRenderer } from 'three';

/*
 * Development-only review tools, installed as window.__insomniaChain by the
 * engine when import.meta.env.DEV is true (never in production builds).
 *
 *   __insomniaChain.measure(progress)  chain colour at a night progress, for the
 *                                      view on screen (renders twice: with and
 *                                      without the chain; the chain's pixels are
 *                                      where the two frames differ)
 *   __insomniaChain.presence()         floor opacity and hero red-mist strength
 *                                      as of the last frame
 *   __insomniaChain.bench(frames)      CPU+GPU time per frame with and without
 *                                      the atmosphere layers, rendered into an
 *                                      offscreen target of the canvas's size so
 *                                      vsync does not cap the numbers
 */

interface DebugTargets {
  renderer: WebGLRenderer;
  /** Draws the current view (camera at the real scroll position). */
  render: () => void;
  chain: InstancedMesh;
  /** Turns the floor, dust and glow on or off for the next draws. */
  setAtmosphere: (on: boolean) => void;
  setNight: (progress: number) => void;
  restoreNight: () => void;
  /** Hero-only layers as of the last draw: floor opacity and red-mist strength. */
  presence: () => { floor: number; mist: number };
}

export interface ChainColour {
  progress: number;
  /** Chain pixels found. */
  pixels: number;
  /** Mean HSV saturation of the chain's pixels, 0..1. */
  saturation: number;
  /** Mean relative luminance of the chain's pixels, 0..1. */
  luminance: number;
  /** Mean R, G, B of the chain's pixels, 0..255. */
  rgb: [number, number, number];
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

export function installDebugHook(targets: DebugTargets): () => void {
  const { renderer, render, chain, setAtmosphere, setNight, restoreNight, presence } = targets;

  const api = {
    presence,

    measure(progress: number): ChainColour {
      setNight(progress);
      render();
      const withChain = readFrame(renderer);
      chain.visible = false;
      render();
      const without = readFrame(renderer);
      chain.visible = true;

      let pixels = 0;
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
        saturation += max > 0 ? (max - min) / max : 0;
        luminance += 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(bl);
        sum[0] = (sum[0] ?? 0) + r;
        sum[1] = (sum[1] ?? 0) + g;
        sum[2] = (sum[2] ?? 0) + bl;
      }
      restoreNight();
      render();
      const n = Math.max(pixels, 1);
      return {
        progress,
        pixels,
        saturation: saturation / n,
        luminance: luminance / n,
        rgb: [(sum[0] ?? 0) / n, (sum[1] ?? 0) / n, (sum[2] ?? 0) / n],
      };
    },

    bench(frames = 120): { withAtmosphere: number; withoutAtmosphere: number } {
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
      target.dispose();
      render();
      return { withAtmosphere, withoutAtmosphere };
    },
  };

  const host = window as unknown as { __insomniaChain?: typeof api };
  host.__insomniaChain = api;
  return () => {
    if (host.__insomniaChain === api) delete host.__insomniaChain;
  };
}
