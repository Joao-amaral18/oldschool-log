import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Plugin to inject environment variables into service worker
const injectSWEnvPlugin = () => ({
  name: 'inject-sw-env',
  generateBundle(options, bundle) {
    const swFile = bundle['sw.js']
    if (swFile && 'code' in swFile) {
      swFile.code = swFile.code
        .replace('self.VITE_SUPABASE_URL', `"${process.env.VITE_SUPABASE_URL}"`)
        .replace('self.VITE_SUPABASE_ANON_KEY', `"${process.env.VITE_SUPABASE_ANON_KEY}"`)
    }
  }
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    injectSWEnvPlugin(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectRegister: false,
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'Workout Online',
        short_name: 'Oldschool',
        description: 'Registre seus treinos com fluidez, mesmo offline.',
        theme_color: '#121212',
        background_color: '#121212',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        categories: ['health', 'fitness', 'productivity'],
        shortcuts: [
          {
            name: 'Novo Treino',
            short_name: 'Treino',
            description: 'Iniciar um novo treino',
            url: '/treino',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }]
          },
          {
            name: 'Histórico',
            short_name: 'Histórico',
            description: 'Ver histórico de treinos',
            url: '/history',
            icons: [{ src: 'icons/icon-192.png', sizes: '192x192' }]
          }
        ],
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/maskable-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    }),
  ],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
