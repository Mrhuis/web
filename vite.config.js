import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080', // Your backend server address
        changeOrigin: true,
        },
      '/ws': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true
      },
      '/media': {
        target: 'http://localhost:8080', // 代理媒体文件请求到后端
        changeOrigin: true,
      }
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  define: {
    global: 'globalThis'
  }
}) 