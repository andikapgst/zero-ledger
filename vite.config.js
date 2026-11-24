import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),

    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'icons/*.png'],
      devOptions: {
        enabled: true,          // also active in dev mode
      },

      // ── Web App Manifest ────────────────────────────────────────────────
      manifest: {
        name:             'Zero Ledger – Pencatat Keuangan',
        short_name:       'Zero Ledger',
        description:      'Aplikasi pencatat keuangan pribadi berbasis PWA',
        lang:             'id',
        start_url:        '/',
        scope:            '/',
        display:          'standalone',
        orientation:      'portrait',
        background_color: '#0B1215',
        theme_color:      '#0B1215',
        categories:       ['finance', 'productivity'],
        icons: [
          {
            src:   '/icons/icon-72.png',
            sizes: '72x72',
            type:  'image/png',
          },
          {
            src:   '/icons/icon-96.png',
            sizes: '96x96',
            type:  'image/png',
          },
          {
            src:   '/icons/icon-128.png',
            sizes: '128x128',
            type:  'image/png',
          },
          {
            src:   '/icons/icon-144.png',
            sizes: '144x144',
            type:  'image/png',
          },
          {
            src:   '/icons/icon-152.png',
            sizes: '152x152',
            type:  'image/png',
          },
          {
            src:     '/icons/icon-192.png',
            sizes:   '192x192',
            type:    'image/png',
            purpose: 'maskable any',
          },
          {
            src:     '/icons/icon-384.png',
            sizes:   '384x384',
            type:    'image/png',
          },
          {
            src:     '/icons/icon-512.png',
            sizes:   '512x512',
            type:    'image/png',
            purpose: 'maskable any',
          },
        ],
        shortcuts: [
          {
            name:      'Tambah Transaksi',
            short_name:'Tambah',
            url:       '/transaksi/baru',
            icons:     [{ src: '/icons/icon-96.png', sizes: '96x96' }],
          },
        ],
      },

      // ── Workbox (Service Worker) ─────────────────────────────────────────
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          // Google Fonts
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          // Firebase REST calls (network-first for freshness)
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              networkTimeoutSeconds: 10,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: { '@': '/src' },
  },

  server: {
    host: true,
    port: 5173,
  },

  preview: {
    host: true,
    port: 4173,
  },
});
