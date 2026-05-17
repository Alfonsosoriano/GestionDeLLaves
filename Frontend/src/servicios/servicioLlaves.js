/*
PARA QUÉ SIRVE: Todas las peticiones HTTP relacionadas con
  las llaves del sistema (listar, crear, editar, borrar).
CUÁNDO SE EJECUTA: Lo llaman GestionLlaves, FormularioLlave,
  ListadoLlaves, PanelAdministracion y HistorialMovimientos.
ENDPOINTS QUE USA:
  GET    /api/llaves        → todas las llaves
  GET    /api/llaves/{id}   → una llave concreta
  POST   /api/llaves        → crear llave nueva
  PUT    /api/llaves/{id}   → modificar llave existente
  DELETE /api/llaves/{id}   → borrar llave
*/

import api from './api';

// Devuelve el listado completo de llaves del sistema
export const obtenerLlaves = async () => {
  const respuesta = await api.get('/api/llaves');
  return respuesta.data;
};

// Devuelve los datos de una sola llave por su identificador
export const obtenerLlavePorId = async (id) => {
  const respuesta = await api.get(`/api/llaves/${id}`);
  return respuesta.data;
};

// Crea una llave nueva con los datos del formulario
export const crearLlave = async (datos) => {
  const respuesta = await api.post('/api/llaves', datos);
  return respuesta.data;
};

// Actualiza los datos de una llave ya existente
export const actualizarLlave = async (id, datos) => {
  const respuesta = await api.put(`/api/llaves/${id}`, datos);
  return respuesta.data;
};

// Elimina definitivamente una llave del sistema
export const eliminarLlave = async (id) => {
  const respuesta = await api.delete(`/api/llaves/${id}`);
  return respuesta.data;
};
