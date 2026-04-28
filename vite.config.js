import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt' — 새 버전이 있으면 사용자가 명시적으로 업데이트하도록.
      // autoUpdate는 PWA 켜둔 채로 며칠 쓰는 사용자가 새 빌드 못 받는 문제 있음.
      registerType: 'prompt',
      includeAssets: ['icon.svg', 'icon-maskable.svg', 'icon-v2.svg', 'icon-maskable-v2.svg', 'icon-v3.svg', 'icon-maskable-v3.svg'],
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
        // 아이콘 파일명 강제 변경 (v2 → v3, 도화지 페르소나로 교체) — OS가 캐시 갱신하도록
        icons: [
          { src: 'icon-v3.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: 'icon-maskable-v3.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
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
