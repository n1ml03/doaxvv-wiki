import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mkcert from 'vite-plugin-mkcert'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          ['babel-plugin-react-compiler', {}]
        ]
      }
    }),
    mkcert({
      hosts: ['project-doaxvv.local', 'localhost', '127.0.0.1']
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/content': path.resolve(__dirname, './src/content'),
    },
  },
  server: {
    host: true, // Bind to all network interfaces for cross-device access
    port: 5173,
    strictPort: false, // Allow fallback to another port if 5173 is busy
    allowedHosts: ['.local'], // Only allow *.local domains
  },
  preview: {
    host: true,
    port: 4173,
    strictPort: false,
  },
  assetsInclude: ['**/*.csv', '**/*.pdf'],
  optimizeDeps: {
    exclude: ['*.csv']
  },
  build: {
    // Enable CSS code splitting
    cssCodeSplit: true,
    
    // Configure chunk size warnings
    chunkSizeWarningLimit: 500,
    
    // Rollup options with manual chunking for better code splitting
    rollupOptions: {
      output: {
        // Manual chunk splitting for large dependencies
        manualChunks: {
          // React core - loaded first
          'react-vendor': ['react', 'react-dom'],
          // Router - needed for navigation
          'router': ['react-router-dom'],
          // UI framework - Radix components
          'ui-radix': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-popover',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
          // Charts - only loaded when needed
          'charts': ['recharts'],
          // PDF viewer - only loaded on guide pages with PDFs
          'pdf': ['react-pdf'],
          // Animation library
          'animation': ['framer-motion'],
          // Search library
          'search': ['flexsearch'],
          // Data processing
          'data': ['papaparse', 'date-fns'],
          // Markdown rendering
          'markdown': ['react-markdown', 'rehype-raw', 'rehype-katex', 'remark-gfm', 'remark-math'],
        },
        
        // Asset file naming for better caching
        assetFileNames: (assetInfo) => {
          const fileName = assetInfo.names?.[0] || assetInfo.name || '';
          const ext = fileName.split('.').pop() || '';
          
          // Organize assets by type
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/woff2?|ttf|otf|eot/i.test(ext)) {
            return `assets/fonts/[name]-[hash][extname]`;
          }
          if (ext === 'css') {
            return `assets/css/[name]-[hash][extname]`;
          }
          if (ext === 'csv') {
            return `assets/data/[name]-[hash][extname]`;
          }
          if (ext === 'pdf') {
            return `assets/pdf/[name]-[hash][extname]`;
          }
          
          return `assets/[name]-[hash][extname]`;
        },
        
        // Chunk file naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    
    // Asset optimization
    assetsInlineLimit: 4096, // Inline assets smaller than 4kb
    
    // Source map generation for production debugging
    sourcemap: false, // Set to true if needed for debugging
    
    // Minification
    minify: 'esbuild',
    
    // Target modern browsers for smaller bundle size
    target: 'es2015',
  },
})
