import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// Custom plugin to handle CommonJS modules
const handleCjsModules = () => {
  return {
    name: 'handle-cjs-modules',
    resolveId(source) {
      // Special handling for moment
      if (source === 'moment') {
        return { id: 'moment', external: true };
      }
      return null;
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    handleCjsModules()
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: ['moment'],
      output: {
        globals: {
          moment: 'moment'
        }
      }
    }
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