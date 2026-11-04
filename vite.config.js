import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  // Preview hosts may mount the site beneath a path instead of a domain root.
  base: './',
  build: {
    rollupOptions: {
      input: {
        home: fileURLToPath(new URL('./index.html', import.meta.url)),
        products: fileURLToPath(new URL('./products/index.html', import.meta.url)),
        investors: fileURLToPath(new URL('./investors/index.html', import.meta.url)),
        technology: fileURLToPath(new URL('./technology/index.html', import.meta.url)),
        concepts: fileURLToPath(new URL('./concepts/index.html', import.meta.url)),
      },
    },
  },
});
