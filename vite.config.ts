import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // three.js alone is ~520 kB minified. It sits in its own chunk that
    // <ChainStage /> loads on demand, so it never blocks first paint; the limit
    // is raised just enough that this expected chunk does not warn.
    chunkSizeWarningLimit: 600,
  },
});
