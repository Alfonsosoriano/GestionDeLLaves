/*
PARA QUÉ SIRVE: Petición HTTP para obtener el historial de
  movimientos (entregas, devoluciones, pérdidas) con paginación.
CUÁNDO SE EJECUTA: Lo llama HistorialMovimientos.jsx al montarse.
*/

import api from './api';

// Obtiene el listado de movimientos con paginación y filtros opcionales
export const obtenerHistorial = async (pagina = 1, limite = 10, filtros = {}) => {
  const parametros = new URLSearchParams({ page: pagina, limit: limite, ...filtros });
  const respuesta = await api.get(`/api/historial?${parametros}`);
  return respuesta.data;
};
