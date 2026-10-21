import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig({
  plugins: [
    {
      name: 'copy-content-to-extension-assets',
      closeBundle() {
        const distFile = resolve(__dirname, 'dist/assets/content.js');
        const extAssetsDir = resolve(__dirname, 'assets');
        const extFile = resolve(extAssetsDir, 'content.js');
        if (fs.existsSync(distFile)) {
          if (!fs.existsSync(extAssetsDir)) {
            fs.mkdirSync(extAssetsDir, { recursive: true });
          }
          fs.copyFileSync(distFile, extFile);
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/content/index.ts'),
      name: 'VibeInspectorContent',
      formats: ['iife'],
      fileName: () => 'assets/content.js',
    },
    rollupOptions: {
      output: {
        extend: true,
        inlineDynamicImports: true,
      },
    },
  },
});
