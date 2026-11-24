import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Krishna Gurukul', short_name: 'Gurukul', theme_color: '#00457F', background_color: '#EDF5FA', display: 'standalone', start_url: '/',
        icons: [{ src: '/logo.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' }],
      },
      workbox: { navigateFallbackDenylist: [/^\/api/], globPatterns: ['**/*.{js,css,html,png,svg,webp}'] },
    }),
  ],
  server: { proxy: { '/api': 'http://localhost:4000', '/uploads': 'http://localhost:4000' } },
  build: { chunkSizeWarningLimit: 1200, rollupOptions: { output: { manualChunks: { three: ['three', '@react-three/fiber', '@react-three/drei'], gsap: ['gsap'], charts: ['recharts'] } } } },
});
