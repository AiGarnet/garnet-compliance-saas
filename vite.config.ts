import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'moment': resolve(__dirname, 'node_modules/moment'),
    },
  },
  // This is helpful for Single Page Applications on Netlify
  server: {
    port: 3000,
    strictPort: true,
  },
}) 