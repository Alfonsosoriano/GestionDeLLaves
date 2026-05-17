/*
PARA QUÉ SIRVE: Cabecera superior que aparece en todas las
  páginas. Muestra el logo, el nombre del centro, los datos
  del usuario conectado y el botón de cerrar sesión.
CUÁNDO SE EJECUTA: Se monta dentro de LayoutAdministrador y
  LayoutOrdenanza, y también directamente en EditarPerfil.
USADO EN: LayoutAdministrador, LayoutOrdenanza, EditarPerfil.
*/

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useConfiguracion } from '../../contexto/contexto_configuracion';
import './encabezado.scss';

// Recibe mostrarBotonCerrarSesion para ocultarlo cuando el layout ya lo tiene
const Encabezado = ({ mostrarBotonCerrarSesion = true }) => {
  const { nombreCentro }  = useConfiguracion();
  const navegar           = useNavigate();

  // Leer el usuario guardado en el navegador al iniciar sesión
  const usuarioConectado = JSON.parse(localStorage.getItem('usuarioActual') || '{}');

  // Determina a qué panel redirige el logo según el rol del usuario
  const obtenerRutaPanel = () => {
    if (usuarioConectado.rol === 'administrador') return '/panel-administracion';
    if (usuarioConectado.rol === 'ordenanza')     return '/panel-ordenanza';
    return '/login';
  };

  // Controla si se muestra el modal de confirmación de cierre de sesión
  const [mostrarModalSalida, setMostrarModalSalida] = useState(false);

  // Abre el modal de confirmación antes de cerrar sesión
  const pedirConfirmacionCierreSesion = () => setMostrarModalSalida(true);

  // Borra los datos del usuario y redirige al login
  const ejecutarCierreSesion = () => {
    localStorage.removeItem('usuarioActual');
    navegar('/login');
  };

  return (
    <>
      <header className="cabecera-app">
        <div className="contenido-cabecera">
          {/* Logo clicable que lleva al panel según el rol */}
          <Link to={obtenerRutaPanel()} className="grupo-logo" titulo="Ir al panel principal">
            <div className="envoltorio-logo">
              <span className="material-symbols-outlined icono-llave">vpn_key</span>
            </div>
            <div className="grupo-texto">
              <h1 className="titulo-cabecera">{nombreCentro}</h1>
              <p className="subtitulo-cabecera">Gestión de Llaves</p>
            </div>
          </Link>

          {/* Sección del usuario conectado, solo si hay sesión activa */}
          {usuarioConectado.nombre && (
            <div className="seccion-usuario">
              {/* Al pulsar en el nombre del usuario va a editar su perfil */}
              <Link to="/editar-perfil" className="enlace-usuario">
                <div className="info-usuario">
                  <div className="gl-avatar">
                    {usuarioConectado.nombre?.substring(0, 2).toUpperCase() || '??'}
                  </div>
                  <div className="texto-usuario">
                    <span className="gl-name">{usuarioConectado.nombre || 'Usuario'}</span>
                    <span className="gl-role">{usuarioConectado.rol   || 'Rol'}</span>
                  </div>
                </div>
              </Link>

              {/* Botón de cerrar sesión*/}
              {mostrarBotonCerrarSesion && (
                <button
                  onClick={pedirConfirmacionCierreSesion}
                  className="btn-cerrar-sesion-cabecera"
                  titulo="Cerrar Sesión"
                >
                  <span className="material-symbols-outlined">logout</span>
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Modal de confirmación de cierre de sesión */}
      {mostrarModalSalida && (
        <div className="fondo-modal" onClick={() => setMostrarModalSalida(false)}>
          <div className="tarjeta-modal" onClick={e => e.stopPropagation()}>
            <span className="material-symbols-outlined icono-modal">logout</span>
            <h2 className="titulo-modal">¿Cerrar sesión?</h2>
            <p className="texto-modal">
              ¿Estás seguro de que deseas cerrar la sesión actual?
            </p>
            <div className="acciones-modal">
              <button className="btn-cancelar" onClick={() => setMostrarModalSalida(false)}>
                Cancelar
              </button>
              <button className="btn-confirmar" onClick={ejecutarCierreSesion}>
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Encabezado;
