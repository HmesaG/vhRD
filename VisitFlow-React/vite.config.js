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
        name: 'VisitFlow',
        short_name: 'VisitFlow',
        description: 'Sistema de Gestión de Visitas - GMV',
        theme_color: '#f58220',
        background_color: '#ffffff',
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
        target: 'https://wptsoftwares.giize.com:54443/WPTConsultasDGIApiLocal/wptconsultasdgii',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api-dgii/, '')
      }
    }
  }
})
