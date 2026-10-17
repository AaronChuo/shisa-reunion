import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  worker: { format: 'es' },
  plugins: [
    react(),
    VitePWA({
      // Ask before swapping versions so a reload never lands in the middle of a puzzle
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'fonts/*.woff2'],
      manifest: {
        name: '小獅搭路',
        short_name: '小獅搭路',
        description: '幫西薩用積木搭路回家的益智遊戲',
        lang: 'zh-Hant-TW',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        scope: '/',
        background_color: '#E4F2F0',
        theme_color: '#E4F2F0',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precache the whole game (code, worker, fonts, icons, postcard photos) so it runs with no network at all
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2,webmanifest}'],
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
      },
    }),
  ],
});
