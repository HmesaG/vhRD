import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
