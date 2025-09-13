import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
// import pwa from 'vite-plugin-pwa'
// import { VitePWA } from 'vite-plugin-pwa'


// import vitePwa from '@vue/cli-plugin-pwa'
import path from 'path'
import { fileURLToPath } from 'url'
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    vue(),
    // VitePWA({
    //   registerType: 'autoUpdate',
    //   manifest: {
    //     name: '应用名称',
    //     short_name: '简称',
    //     theme_color: '#ffffff',
    //     icons: [
    //       {
    //         src: 'pwa-192x192.png',
    //         sizes: '192x192',
    //         type: 'image/png'
    //       },
    //       {
    //         src: 'pwa-512x512.png', 
    //         sizes: '512x512',
    //         type: 'image/png'
    //       }
    //     ]
    //   },
    //   workbox: {
    //     globPatterns: ['**/*.{js,css,html,png,svg}']
    //   }
    // })
  ],
  server: {
    proxy: {
      '/openapi': {
        // target: 'http://192.168.10.22:8080',
        target: 'http://wb-service.arthub.qq.com/blade/blade/',
        // target: 'http://10.92.10.22:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/openapi/, ''),
      },
    }
  },
  resolve: {
    alias: {
      // '__dirname': path.resolve(__dirname, '.'),
      '@': path.resolve(__dirname, './src'),
      '@renderer': path.resolve(__dirname, './src/renderer'),
      '@main': path.resolve(__dirname, './electron'),
      '@components': path.resolve(__dirname, './src/components'),
      '@assets': path.resolve(__dirname, './src/assets')
    },
    extensions: ['.js', '.vue', '.json', '.ts']

  }
})
