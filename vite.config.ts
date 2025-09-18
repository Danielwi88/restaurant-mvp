import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_API_PROXY_TARGET || env.VITE_API_BASE_URL || 'https://berestaurantappformentee-production.up.railway.app'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        // Forward /api/* to remote backend in dev to avoid CORS
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: true,
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 900,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
            'query-vendor': ['@tanstack/react-query'],
            'ui-vendor': ['lucide-react', 'sonner'],
            'axios-vendor': ['axios'],
          },
        },
      },
    },
  }
})
// https://vite.dev/config/
