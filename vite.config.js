import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    include: ['@mediapipe/face_mesh', '@mediapipe/camera_utils'],
  },
  build: {
    commonjsOptions: {
      include: [/@mediapipe\/face_mesh/, /@mediapipe\/camera_utils/, /node_modules/],
    },
  },
})
