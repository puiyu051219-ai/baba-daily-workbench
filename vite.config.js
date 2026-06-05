import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['.loca.lt', '.trycloudflare.com', 'localhost', '127.0.0.1'],
  },
})
