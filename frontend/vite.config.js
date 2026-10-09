import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Configuración del frontend: en desarrollo, el proxy redirige /api al backend (investigación R9).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.js',
  },
});
