import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiProxy = env.VITE_API_PROXY || 'http://localhost:3000';
  const wsProxy = apiProxy.replace(/^http/, 'ws');

  return {
    plugins: [react()],
    server: {
      host: true,
      port: 5173,
      proxy: {
        '/api': apiProxy,
        '/uploads': apiProxy,
        '/ws': { target: wsProxy, ws: true },
      },
    },
  };
});
