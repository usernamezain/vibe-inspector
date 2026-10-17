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
        if (!fs.existsSync(distDir)) {
          fs.mkdirSync(distDir, { recursive: true });
        }

        // Copy manifest.json
        fs.copyFileSync(
          resolve(__dirname, 'manifest.json'),
          resolve(distDir, 'manifest.json')
        );

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
        sidepanel: resolve(__dirname, 'sidepanel.html'),
        background: resolve(__dirname, 'src/background/index.ts'),
        content: resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'background') {
            return 'assets/background.js';
          }
          if (chunkInfo.name === 'content') {
            return 'assets/content.js';
          }
          return 'assets/[name].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
