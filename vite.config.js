import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        playlists: resolve(__dirname, 'playlists.html'),
        charte: resolve(__dirname, 'charte.html'),
        cgu: resolve(__dirname, 'cgu.html'),
        mentionsLegales: resolve(__dirname, 'mentions-legales.html'),
      }
    }
  }
})
