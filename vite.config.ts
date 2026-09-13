import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'

export default defineConfig({
  server: {
    host: '0.0.0.0',
    https: {
      key: fs.readFileSync('./192.168.1.7+2-key.pem'),
      cert: fs.readFileSync('./192.168.1.7+2.pem'),
    },
    proxy: {
      '/api': {
        target: 'http://192.168.1.3:3000',
        changeOrigin: true,
      },
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      devOptions: {
        enabled: true,
        type: 'module',
      },
      manifest: {
        name: 'SisMedy',
        short_name: 'SisMedy',
        description: 'Sistema de gestión de MedyFisio',
        theme_color: '#A000D1',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      injectManifest: {
        injectionPoint: undefined,
      },
    }),
  ],
})