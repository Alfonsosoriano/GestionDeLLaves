import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'https';

// Función para comprobar de manera asíncrona si el backend local responde por HTTPS
const comprobarHttps = () => {
  return new Promise((resolve) => {
    const req = https.request({
      hostname: '127.0.0.1',
      port: 8000,
      path: '/api/llaves',
      method: 'GET',
      rejectUnauthorized: false,
      timeout: 1000,
    }, (res) => {
      resolve(true);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
};

// Configuración de Vite dinámica que soporta de forma transparente tanto HTTP como HTTPS
export default defineConfig(async () => {
  const tieneHttps = await comprobarHttps();
  const target = tieneHttps ? 'https://127.0.0.1:8000' : 'http://127.0.0.1:8000';

  console.log(`\x1b[36m[Vite Proxy] Backend detectado dinámicamente en: ${target}\x1b[0m`);

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
