import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Cada vez que React llame a /api/..., Vite lo redirige al backend
      // Así evitás errores de CORS durante el desarrollo
      '/api': 'http://localhost:8080'
    }
  }
})