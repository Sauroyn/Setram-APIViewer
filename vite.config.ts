import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/vehicle-positions': {
        target: 'https://proxy.transport.data.gouv.fr/resource/setram-lemans-gtfs-rt-vehicle-position',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/vehicle-positions/, ''),
      },
      '/api/trip-updates': {
        target: 'https://proxy.transport.data.gouv.fr/resource/setram-lemans-gtfs-rt-trip-update',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/trip-updates/, ''),
      },
    },
  },
})
