/*
PARA QUÉ SIRVE: Estructura visual de todas las páginas del
  administrador: cabecera arriba, barra lateral izquierda con
  menú de navegación, contenido principal a la derecha y pie
  de página abajo.
CUÁNDO SE EJECUTA: Se monta cada vez que el administrador
  navega a cualquier página del área de administración.
USADO EN: PanelAdministracion, GestionUsuarios, FormularioUsuario,
  GestionLlaves, FormularioLlave, HistorialMovimientos,
  ListadoLlaves, Configuracion.
*/

import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Encabezado from '../comunes/encabezado';
import PiePagina  from '../comunes/pie_pagina';
import './layout_administrador.scss';

// Opciones del menú lateral
const elementosMenuLateral = [
  { nombre: 'Panel de Inicio', icono: 'dashboard',  ruta: '/panel-administracion' },
  { nombre: 'Usuarios',        icono: 'group',       ruta: '/gestion-usuarios'     },
  { nombre: 'Llaves',          icono: 'key',         ruta: '/gestion-llaves'       },
  { nombre: 'Inventario',      icono: 'inventory_2', ruta: '/inventario-llaves'    },
  { nombre: 'Historial',       icono: 'history',     ruta: '/historial'            },
  { nombre: 'Ajustes',         icono: 'settings',    ruta: '/configuracion'        },
];

// Recibe el contenido de la página  y el título que aparece en la barra superior
const LayoutAdministrador = ({ children, titulo = 'Administración Central' }) => {
  const ubicacionActual        = useLocation();
  const navegar                = useNavigate();

  // Controla si se muestra el menú lateral en dispositivos móviles
  const [menuAbierto, setMenuAbierto] = useState(false);

  // Controla si se muestra el modal de confirmación de cierre de sesión
  const [mostrarModalSalida, setMostrarModalSalida] = useState(false);

  // Borra la sesión y redirige al login
  const ejecutarCierreSesion = () => {
    localStorage.removeItem('usuarioActual');
    navegar('/login');
  };

  return (
    <div className="envoltorio-admin">
      <Encabezado />

      <div className="pa-inner">
        {/* Capa de fondo oscura (overlay) para cerrar el menú en móvil al hacer clic fuera */}
        {menuAbierto && (
          <div className="barra-lateral-overlay" onClick={() => setMenuAbierto(false)}></div>
        )}

        {/* BARRA NAVEGACIÓN IZQUIERDA*/}
        <aside className={`barra-lateral ${menuAbierto ? 'visible' : ''}`}>
          <nav className="navegacion-lateral">
            {elementosMenuLateral.map((elemento) => (
              <Link
                key={elemento.ruta}
                to={elemento.ruta}
                className={`item-navegacion ${ubicacionActual.pathname === elemento.ruta ? 'active' : ''}`}
                onClick={() => setMenuAbierto(false)}
              >
                <span className="material-symbols-outlined">{elemento.icono}</span>
                {elemento.nombre}
              </Link>
            ))}
          </nav>

          {/* Botón de cerrar sesión */}
          <div className="pie-barra-lateral">
            <button className="btn-cerrar-sesion" onClick={() => setMostrarModalSalida(true)}>
              <span className="material-symbols-outlined">logout</span>
              Cerrar Sesión
            </button>
          </div>
        </aside>

        {/*CONTENIDO PRINCIPAL*/}
        <div className="pa-main-content">
          {/* Barra superior con el nombre de la sección actual */}
          <header className="barra-superior">
            <button className="btn-hamburguesa" onClick={() => setMenuAbierto(!menuAbierto)} aria-label="Abrir menú de navegación">
              <span className="material-symbols-outlined">{menuAbierto ? 'close' : 'menu'}</span>
            </button>
            <div className="texto-ruta">
              <span className="material-symbols-outlined">home</span>
              <span className="material-symbols-outlined">chevron_right</span>
              <span className="titulo">{titulo}</span>
            </div>
          </header>

          {/* Aquí muestra el  contenido de cada página de administración */}
          <main className="pa-dashboard">
            {children}
          </main>
        </div>
      </div>

      <PiePagina />

      {/*Modal cierre de sesión*/}
      {mostrarModalSalida && (
        <div
          className="fondo-modal"
          onClick={() => setMostrarModalSalida(false)}
        >
          <div
            className="tarjeta-modal"
            onClick={e => e.stopPropagation()}
          >
            <span className="material-symbols-outlined icono-modal">logout</span>
            <h2 className="titulo-modal">¿Cerrar sesión?</h2>
            <p className="texto-modal">
              ¿Estás seguro de que deseas cerrar la sesión actual?
            </p>
            <div className="acciones-modal">
              <button
                className="btn-cancelar"
                onClick={() => setMostrarModalSalida(false)}
              >
                Cancelar
              </button>
              <button
                className="btn-confirmar"
                onClick={ejecutarCierreSesion}
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LayoutAdministrador;
