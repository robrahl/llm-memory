import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  base: '/ui/',
  root: 'src/ui',
  build: {
    outDir: '../../dist/ui',
    emptyOutDir: true,
    assetsDir: '.',
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/ui'),
    },
  },
});
