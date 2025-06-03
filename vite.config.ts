import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import Icons from 'unplugin-icons/vite';

export default defineConfig({
  plugins: [
    react(),
    Icons({
      compiler: 'jsx',
      jsx: 'react',
      autoInstall: true,
      scale: 1.2,
      defaultClass: 'icon',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json', '.svg'],
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
        '@next/font',
        'react-icons',
        'react-icons/fa',
        'react-icons/fa6',
        'react-icons/md',
        'react-icons/ai',
        'react-icons/fi',
        'react-icons/bs'
      ],
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
    },
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
  },
  optimizeDeps: {
    include: ['lodash', 'uuid', 'react-icons', '@iconify/react'],
  },
}); 