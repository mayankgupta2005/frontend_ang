import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        login: 'login.html',
        onboarding: 'onboarding.html',
        dashboard: 'dashboard.html',
        blackbox: 'blackbox.html'
      }
    }
  }
});
