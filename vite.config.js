import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'icon-maskable.svg', 'icon-v2.svg', 'icon-maskable-v2.svg'],
      manifest: {
        name: '카든냥',
        short_name: '카든냥',
        description: '카메라 든 냥이의 하루 네 장. 25번째 한 장.',
        theme_color: '#1a1d1f',
        background_color: '#f1f2ee',
        display: 'standalone',
        orientation: 'portrait',
        lang: 'ko',
        start_url: '/',
        scope: '/',
        // 아이콘 파일명 강제 변경 (icon → icon-v2) — OS가 변경 감지하도록
        icons: [
          { src: 'icon-v2.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-maskable-v2.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
