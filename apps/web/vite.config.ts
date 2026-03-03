import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Navigator Diary',
        short_name: 'Navigator',
        description: 'Navigator Diary PWA',
        theme_color: '#0b4a6f',
        background_color: '#f6f5f2',
        display: 'standalone',
        icons: [
          {
            src: 'icon.svg',
            sizes: 'any',
            type: 'image/svg+xml'
          }
        ]
      }
    })
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://127.0.0.1:3000',
      '/socket.io': {
        target: 'http://127.0.0.1:3000',
        ws: true
      }
    }
  }
})
