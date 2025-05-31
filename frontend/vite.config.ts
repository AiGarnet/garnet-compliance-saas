import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
  build: {
    rollupOptions: {
      external: [
        'lodash',
        'react',
        'react-dom',
        'react-router-dom',
        'framer-motion',
        'moment',
        'zod',
        'lucide-react',
        'uuid',
        'clsx',
        'date-fns',
        'jose',
        'jsonwebtoken',
        'keycloak-js',
        'react-markdown',
        'sharp',
        'tailwind-merge',
        '@next/font'
      ],
    },
  },
  optimizeDeps: {
    include: ['lodash', 'uuid'],
  },
}); 