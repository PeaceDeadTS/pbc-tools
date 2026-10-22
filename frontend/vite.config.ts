import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

const root = import.meta.dirname;
const cdnBase = process.env.VITE_CDN_BASE;
const base = cdnBase ? (cdnBase.endsWith('/') ? cdnBase : `${cdnBase}/`) : '/';

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(root, 'src'),
      '@shared': path.resolve(root, '../shared'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
});
