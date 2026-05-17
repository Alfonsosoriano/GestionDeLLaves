/*
PARA QUÉ SIRVE: Peticiones HTTP al servidor para obtener
  estadísticas y resúmenes del sistema (llaves prestadas,
  perdidas, usuarios activos, etc.).
CUÁNDO SE EJECUTA: Lo llama PanelAdministracion.jsx al montarse.
*/

import api from './api';

// Devuelve el resumen general del sistema (contadores)
export const obtenerResumen = () => api.get('/api/informes');

// Devuelve las llaves actualmente prestadas sin devolver
export const obtenerPendientes = () => api.get('/api/informes/pendientes');

// Devuelve las llaves con más movimientos registrados
export const obtenerLlavesMasUsadas = () => api.get('/api/informes/llaves-mas-usadas');

// Devuelve las llaves marcadas como perdidas
export const obtenerLlavesPerdidas = () => api.get('/api/informes/llaves-perdidas');

// Devuelve estadísticas de actividad por usuario
export const obtenerActividadUsuarios = () => api.get('/api/informes/usuarios');

// Devuelve el estado global del inventario de llaves
export const obtenerEstadoLlaves = () => api.get('/api/informes/llaves');
