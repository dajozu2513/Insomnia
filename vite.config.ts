import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Preloads the intro and hero title face (Cormorant Garamond 300, latin) so the
 * first thing on screen is set in its own font. The file name is hashed, so it is
 * looked up in the bundle at build time; the dev server simply loads it on demand.
 */
function preloadTitleFont(): Plugin {
  return {
    name: 'insomnia-preload-title-font',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(_html, context) {
        const file = Object.keys(context.bundle ?? {}).find((name) =>
          /cormorant-garamond-latin-300-normal-[\w-]+\.woff2$/.test(name),
        );
        if (!file) throw new Error('Title font not found in the bundle');
        return [
          {
            tag: 'link',
            attrs: {
              rel: 'preload',
              href: `/${file}`,
              as: 'font',
              type: 'font/woff2',
              crossorigin: '',
            },
            injectTo: 'head',
          },
        ];
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), preloadTitleFont()],
  build: {
    // three.js alone is ~520 kB minified. It sits in its own chunk that
    // <ChainStage /> loads on demand, so it never blocks first paint; the limit
    // is raised just enough that this expected chunk does not warn.
    chunkSizeWarningLimit: 600,
  },
});
