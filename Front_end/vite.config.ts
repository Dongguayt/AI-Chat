import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  //本地开发时的代理配置
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000', // 指向本地的 FastAPI
        changeOrigin: true,
        // 注意：因为后端代码里路由本来就带了 /api 前缀，
        // 所以这里不需要 rewrite 重写路径。
      },
    },
  },
});