import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig({
  plugins: [
    vue(),
    visualizer({
      filename: 'dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vue ecosystem
          'vue-vendor': ['vue', 'vue-router'],
          
          // Vuetify and UI components
          'vuetify-vendor': ['vuetify'],
          
          // Chart.js and related
          'chart-vendor': ['chart.js', 'vue-chartjs'],
        },
      },
    },
    // Set chunk size warning limit to 500kb (default) since we've optimized chunks
    chunkSizeWarningLimit: 500,
  },
})
