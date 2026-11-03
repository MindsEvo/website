import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  base: './',
  publicDir: path.join(root, 'public'),
  worker: { format: 'es' },
  build: {
    outDir: path.resolve(root, '../engine-dist'),
    emptyOutDir: true,
    lib: {
      entry: path.join(root, 'src/go-engine-entry.ts'),
      formats: ['es'],
      fileName: () => 'go-engine.js'
    },
    rollupOptions: {
      output: {
        assetFileNames: 'assets/[name][extname]',
        chunkFileNames: 'assets/[name]-[hash].js'
      }
    }
  }
});