/*
FICHERO: paginas/administracion/gestionUsuario/GestionUsuarios.jsx
PARA QUÉ SIRVE: Listado de todos los usuarios con buscador
  y acciones de editar, eliminar e imprimir su código de barras.
CUÁNDO SE EJECUTA: Al navegar a /gestion-usuarios.
FUNCIONES PRINCIPALES:
  · cargarUsuarios()      → obtiene todos los usuarios del servidor
  · confirmarEliminacion() → borra el usuario seleccionado del servidor
  · imprimirCodigo()      → abre ventana de impresión del código de barras
  · usuariosFiltrados     → lista filtrada en tiempo real según el buscador
*/
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import LayoutAdministrador from '../../../componentes/layouts/layout_administrador';
import ModalConfirmacion from '../../../componentes/ui/ModalConfirmacion';
import BtnVolver from '../../../componentes/ui/BtnVolver';
import { imprimirCodigo } from '../../../utils/imprimirCodigo';
import { obtenerUsuarios, eliminarUsuario } from '../../../servicios/servicioUsuarios';
import { useNotificaciones } from '../../../contexto/contexto_notificaciones';
import { useConfiguracion } from '../../../contexto/contexto_configuracion';
import { normalizarTexto } from '../../../utils/normalizar_texto';
import './GestionUsuarios.scss';

const GestionUsuarios = () => {
  const { mostrarNotificacion } = useNotificaciones();
  const { tamanoCodigoBarras } = useConfiguracion();
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const navegar = useNavigate();
  const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual') || '{}');

  useEffect(() => {
    cargarUsuarios();
  }, []);

  const cargarUsuarios = async () => {
    try {
      setCargando(true);
      const datos = await obtenerUsuarios();
      setUsuarios(datos);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setCargando(false);
    }
  };

  const confirmarEliminacion = async () => {
    if (!usuarioAEliminar) return;
    setEliminando(true);
    try {
      await eliminarUsuario(usuarioAEliminar.id);
      mostrarNotificacion('¡Eliminado!', 'El usuario ha sido borrado correctamente.', 'success');
      setUsuarioAEliminar(null);
      cargarUsuarios();
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      mostrarNotificacion('Error', 'No se pudo eliminar el usuario', 'error');
    } finally {
      setEliminando(false);
    }
  };


  const usuariosFiltrados = usuarios.filter(usuario => 
    normalizarTexto(usuario.nombre).includes(normalizarTexto(terminoBusqueda)) ||
    normalizarTexto(usuario.email).includes(normalizarTexto(terminoBusqueda)) ||
    normalizarTexto(usuario.rol).includes(normalizarTexto(terminoBusqueda)) ||
    normalizarTexto(usuario.codigoBarras).includes(normalizarTexto(terminoBusqueda))
  );

  return (
    <LayoutAdministrador titulo="Gestión de Usuarios">
      <div className="cabecera-pagina">
        <h1>Gestión de Usuarios</h1>
        <p>Administre los usuarios del sistema, sus roles y permisos</p>
      </div>
      {/* Filtros y acciones */}
      <div className="contenedor-filtros">
        <div className="grupo-filtro envoltorio-busqueda" style={{ flex: 1 }}>
          <label htmlFor="busqueda-usuario">Buscar Usuario</label>
          <span className="material-symbols-outlined">search</span>
          <input 
            type="text" 
            id="busqueda-usuario" 
            placeholder="Nombre, email o rol..." 
            value={terminoBusqueda}
            onChange={(e) => setTerminoBusqueda(e.target.value)}
          />
        </div>
        <Link to="/gestion-usuarios/nuevo" className="sin-subrayado">
          <button className="btn-nuevo-usuario">
            <span className="material-symbols-outlined">person_add</span>
            Nuevo Usuario
          </button>
        </Link>
      </div>

      {/* Tabla de usuarios */}
      <div className="tarjeta-tabla">
        <div className="cabecera-tabla">
          <h2>Directorio de Usuarios</h2>
          <span className="texto-atenuado negrita" style={{ fontSize: '13px' }}>{usuariosFiltrados.length} usuarios</span>
        </div>
        
        <div className="contenedor-tabla">
          <table>
            <thead>
              <tr>
                <th>Nombre y Apellidos</th>
                <th>Rol</th>
                <th>Correo Electrónico</th>
                <th>Código de Barras</th>
                <th className="texto-derecha">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan="5" className="texto-centrado p-6">Cargando usuarios...</td></tr>
              ) : usuariosFiltrados.length === 0 ? (
                <tr><td colSpan="5" className="texto-centrado p-6 texto-atenuado">No se encontraron usuarios.</td></tr>
              ) : (
                usuariosFiltrados.map(usuario => (
                  <tr key={usuario.id}>
                    <td className="negrita">
                      {usuario.nombre}
                    </td>
                    <td>
                      <span className={`etiqueta-estado ${
                        usuario.rol === 'admin' || usuario.rol === 'administrador' || usuario.rol === 'ROLE_ADMIN' ? 'purple' : 'blue'
                      }`}>
                        {usuario.rol === 'admin' || usuario.rol === 'administrador' || usuario.rol === 'ROLE_ADMIN' ? 'Admin' : 'Ordenanza'}
                      </span>
                    </td>
                    <td>{usuario.email}</td>
                    <td>
                      <div className="etiqueta-codigo-barras">
                        <span className="material-symbols-outlined">barcode</span>
                        {usuario.codigoBarras}
                      </div>
                    </td>
                    <td className="texto-derecha">
                      <div className="celda-acciones">
                        <button 
                          className="btn-imprimir" 
                          titulo="Imprimir Código"
                          onClick={() => imprimirCodigo(usuario.codigoBarras || usuario.codigo_barras, usuario.nombre, tamanoCodigoBarras)}
                        >
                          <span className="material-symbols-outlined">print</span>
                        </button>
                        <Link to={`/gestion-usuarios/editar/${usuario.id}`}>
                          <button className="btn-editar" titulo="Editar">
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                        </Link>
                        {usuario.id !== usuarioActual.id ? (
                          <button 
                            className="btn-eliminar" 
                            titulo="Eliminar"
                            onClick={() => setUsuarioAEliminar(usuario)}
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        ) : (
                          <div className="espacio-accion"></div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Confirmación */}
      {usuarioAEliminar && (
        <ModalConfirmacion
          titulo="Confirmar eliminación"
          texto={<>¿Seguro que quieres eliminar al usuario <strong>{usuarioAEliminar.nombre}</strong>? Esta acción no se puede deshacer.</>}
          etiquetaConfirmar={eliminando ? 'Eliminando...' : 'Eliminar Usuario'}
          cargando={eliminando}
          onConfirmar={confirmarEliminacion}
          onCancelar={() => setUsuarioAEliminar(null)}
        />
      )}

      <BtnVolver ruta="/panel-administracion" />
    </LayoutAdministrador>
  );
};

export default GestionUsuarios;
