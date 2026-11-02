import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  build: {
    chunkSizeWarningLimit: 700, // three.js lives in the ad page only
    assetsDir: 'static', // keep /assets for the DPC images in /public/assets
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        ad: resolve(__dirname, 'ad.html'),
      },
    },
  },
});
