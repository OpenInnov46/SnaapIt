import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolve } from 'path'
import { copyFileSync, mkdirSync } from 'fs'

function copyManifest() {
  return {
    name: 'copy-manifest',
    writeBundle() {
      mkdirSync('dist', { recursive: true });
      copyFileSync('manifest.json', 'dist/manifest.json');
    }
  }
}

export default defineConfig({
  base: './',
  plugins: [svelte(), copyManifest()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html'),
        background: resolve(__dirname, 'src/background/background.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          return chunkInfo.name === 'background'
            ? '[name].js'
            : 'assets/[name].js';
        },
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
        format: 'es'
      }
    },
    minify: false
  }
})
