import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        mobile: resolve(__dirname, 'mobile.html'),
        step1: resolve(__dirname, 'create-invoice-step1.html'),
        step2: resolve(__dirname, 'create-invoice-step2.html'),
        step3: resolve(__dirname, 'create-invoice-step3.html')
      }
    }
  },
  server: {
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': 'http://localhost:3001'
    }
  }
});
