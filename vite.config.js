import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // gray-matter uses Node's Buffer global when parsing Markdown at runtime
    // in the browser. This polyfill injects a browser-compatible Buffer shim.
    nodePolyfills({ include: ['buffer'] }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.js'],
  },
});
