import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // The API owns the data; during development Vite proxies API calls so the
    // app uses the same relative URLs as in production.
    proxy: {
      '/api': 'http://localhost:5180',
    },
  },
  build: {
    // The production bundle is served by RubiksCube.Api as static files.
    outDir: '../../src/RubiksCube.Api/wwwroot',
    emptyOutDir: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test/setup.ts'],
    css: false,
  },
});
