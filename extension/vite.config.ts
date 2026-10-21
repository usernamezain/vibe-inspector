import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import fs from 'fs';

export default defineConfig({
  base: '',
  plugins: [
    react(),
    {
      name: 'copy-extension-manifest-and-assets',
      closeBundle() {
        const distDir = resolve(__dirname, 'dist');
        const extDir = resolve(__dirname);
        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true });
        }

        // Copy manifest.json
        fs.copyFileSync(
          resolve(extDir, 'manifest.json'),
          resolve(distDir, 'manifest.json')
        );

        // Copy built sidepanel.src.html to sidepanel.html in dist and extDir
        const builtSrcHtml = resolve(distDir, 'sidepanel.src.html');
        if (fs.existsSync(builtSrcHtml)) {
          fs.copyFileSync(builtSrcHtml, resolve(distDir, 'sidepanel.html'));
          fs.copyFileSync(builtSrcHtml, resolve(extDir, 'sidepanel.html'));
        }

        // Copy dist/assets/* to extension/assets/*
        const distAssets = resolve(distDir, 'assets');
        const extAssets = resolve(extDir, 'assets');
        if (fs.existsSync(distAssets)) {
          if (!fs.existsSync(extAssets)) {
            fs.mkdirSync(extAssets, { recursive: true });
          }
          for (const file of fs.readdirSync(distAssets)) {
            fs.copyFileSync(resolve(distAssets, file), resolve(extAssets, file));
          }
        }

        // Copy icons if present
        const iconsSrc = resolve(__dirname, 'public/icons');
        const iconsDist = resolve(distDir, 'icons');
        if (fs.existsSync(iconsSrc)) {
          if (!fs.existsSync(iconsDist)) {
            fs.mkdirSync(iconsDist, { recursive: true });
          }
          for (const file of fs.readdirSync(iconsSrc)) {
            fs.copyFileSync(resolve(iconsSrc, file), resolve(iconsDist, file));
          }
        }
      },
    },
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        sidepanel: resolve(__dirname, 'sidepanel.src.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'assets/background.js';
          }
          return 'assets/[name].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
