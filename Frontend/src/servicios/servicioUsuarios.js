/*
PARA QUÉ SIRVE: Todas las peticiones HTTP relacionadas con
  los usuarios del sistema (listar, crear, editar, borrar).
CUÁNDO SE EJECUTA: Lo llaman GestionUsuarios, FormularioUsuario,
  EditarPerfil y PanelAdministracion.
ENDPOINTS QUE USA:
  GET    /api/usuarios        → todos los usuarios
  GET    /api/usuarios/{id}   → un usuario concreto
  POST   /api/usuarios        → crear usuario nuevo
  PUT    /api/usuarios/{id}   → modificar usuario existente
  DELETE /api/usuarios/{id}   → borrar usuario
*/

import api from './api';

// Devuelve el listado completo de usuarios registrados
export const obtenerUsuarios = async () => {
  const respuesta = await api.get('/api/usuarios');
  return respuesta.data;
};

// Devuelve los datos de un usuario concreto por su identificador
export const obtenerUsuarioPorId = async (id) => {
  const respuesta = await api.get(`/api/usuarios/${id}`);
  return respuesta.data;
};

// Registra un nuevo usuario en el sistema
export const crearUsuario = async (datos) => {
  const respuesta = await api.post('/api/usuarios', datos);
  return respuesta.data;
};

// Actualiza los datos de un usuario ya existente
export const actualizarUsuario = async (id, datos) => {
  const respuesta = await api.put(`/api/usuarios/${id}`, datos);
  return respuesta.data;
};

// Elimina definitivamente un usuario del sistema
export const eliminarUsuario = async (id) => {
  const respuesta = await api.delete(`/api/usuarios/${id}`);
  return respuesta.data;
};
