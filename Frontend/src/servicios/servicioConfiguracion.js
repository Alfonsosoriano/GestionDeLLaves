/*
PARA QUÉ SIRVE: Hace las peticiones HTTP al servidor para
  leer y guardar la configuración del sistema (nombre del
  centro, tamaño del código de barras).
CUÁNDO SE EJECUTA: Lo llama ContextoConfiguracion al arrancar,
  y la página Configuracion.jsx cuando el admin guarda cambios.
*/

import api from './api';

// Lee toda la configuración guardada en el servidor
export const obtenerConfiguracion = () => api.get('/api/configuracion');

// Guarda los cambios de configuración en el servidor
export const guardarConfiguracion = (datos) => api.post('/api/configuracion', datos);

// Lee solo el nombre del centro (para usos puntuales)
export const obtenerNombreCentro = () => api.get('/api/configuracion/nombre-centro');
