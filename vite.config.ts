import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    target: 'es2020',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // React core
          vendor: ['react', 'react-dom', 'react-router-dom'],
          // Firebase - split into smaller chunks
          'firebase-core': ['firebase/app'],
          'firebase-auth': ['firebase/auth'],
          'firebase-firestore': ['firebase/firestore'],
          'firebase-analytics': ['firebase/analytics'],
          // Charts - defer loading
          charts: ['recharts'],
          // Icons and UI
          icons: ['lucide-react'],
          // Date utilities
          'date-utils': ['date-fns'],
        },
        // Optimize chunk names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '') : 'chunk'
          return `assets/${facadeModuleId}-[hash].js`
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'],
        passes: 2
      },
      mangle: {
        safari10: true
      }
    }
  },
  server: {
    port: 3000,
    host: true
  },
  preview: {
    port: 4173,
    host: true
  },
  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'date-fns',
      'lucide-react'
    ],
    exclude: ['firebase', 'recharts'] // Defer these for code splitting
  },
  // Resolve configuration
  resolve: {
    alias: {
      '@': '/src'
    }
  }
}) 