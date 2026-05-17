/*
PARA QUÉ SIRVE: Crea y exporta una instancia de Axios ya
  configurada con la URL base del servidor backend.
  Todos los demás servicios importan esta instancia para
  no repetir la URL en cada llamada.
CUÁNDO SE EJECUTA: Se importa en cada servicio (servicioLlaves,
  servicioUsuarios, etc.) la primera vez que se usa.
USADO EN: Todos los ficheros de la carpeta servicios y algunas
  páginas que hacen peticiones directas (HistorialMovimientos,
  ListadoLlaves, PanelOrdenanza, RegistroLlave, DevolucionLlave,
  RegistrarPerdida).
*/

import axios from 'axios';

const DIRECCION_SERVIDOR = import.meta.env.VITE_API_URL || '';

const api = axios.create({
  baseURL: DIRECCION_SERVIDOR,
});

// Interceptor para inyectar el token JWT en cada petición
api.interceptors.request.use(
  (config) => {
    const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual'));
    if (usuarioActual && usuarioActual.token) {
      config.headers.Authorization = `Bearer ${usuarioActual.token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (!error.config.url.includes('/api/usuarios/login')) {
        localStorage.removeItem('usuarioActual');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
