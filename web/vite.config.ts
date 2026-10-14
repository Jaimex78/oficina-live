import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const API = process.env.OL_API ?? 'http://127.0.0.1:8790';

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number(process.env.OL_WEB_PUERTO ?? 5190),
    strictPort: true,
    host: '127.0.0.1',
    proxy: {
      '/api': { target: API, changeOrigin: false },
      '/ws': { target: API.replace('http', 'ws'), ws: true },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 1800, // Phaser pesa; va en su propio trozo
    rollupOptions: {
      output: {
        manualChunks: { phaser: ['phaser'] },
      },
    },
  },
});
