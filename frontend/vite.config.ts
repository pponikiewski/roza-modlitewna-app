import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react()
  ],
  
  // Optymalizacje build
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['sonner', '@headlessui/react'],
          utils: ['axios']
        }
      }
    },
    chunkSizeWarningLimit: 500,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.trace']
      }
    },
    // Kompresja i optymalizacja
    reportCompressedSize: false,
    cssMinify: true
  },
  
  // Optymalizacje dev server
  server: {
    port: 3000,
    host: true,
    strictPort: true,
    hmr: {
      overlay: false // Wyłączenie overlay dla lepszej wydajności
    }
  },
  
  // Optymalizacje dependencies
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react-router-dom', 
      'axios', 
      'sonner',
      '@headlessui/react'
    ],
    // Wykluczenie niepotrzebnych dependencies z pre-bundling
    exclude: []
  },
  
  // CSS optymalizacje
  css: {
    devSourcemap: false, // Wyłączenie sourcemap w dev dla lepszej wydajności
  },
  
  // Esbuild optymalizacje
  esbuild: {
    target: 'es2020',
    legalComments: 'none',
    minifyIdentifiers: true,
    minifySyntax: true,
    minifyWhitespace: true
  }
})
