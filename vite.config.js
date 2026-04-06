import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  base: '/sunwave/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        playlists: resolve(__dirname, 'playlists.html'),
        fanzine: resolve(__dirname, 'fanzine.html'),
        charte: resolve(__dirname, 'charte.html'),
        morceaux: resolve(__dirname, 'morceaux.html'),
      }
    }
  }
})
