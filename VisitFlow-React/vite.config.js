import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo.png', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'Visitas Hub RD | Sistema de Gestión de Visitas',
        short_name: 'Visitas Hub RD',
        description: 'Vanguardia en Seguridad y Gestión de Accesos - Grupo Mesa Vasquez',
        theme_color: '#f58220',
        background_color: '#0f172a',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/api-dgii': {
        target: 'https://wptsoftwares.giize.com:54443',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-dgii/, '/WPTConsultasDGIApiLocal/wptconsultasdgii')
      },
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false
      },
      '/socket.io': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
        ws: true
      }
    }
  }
})
