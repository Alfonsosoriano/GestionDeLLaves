/*
PARA QUÉ SIRVE: Gestiona los modales emergentes de aviso y
  confirmación que aparecen en toda la aplicación.
  Expone dos funciones:
    · mostrarNotificacion(titulo, mensaje, tipo, alCerrar, acciones)
    · mostrarConfirmacion(titulo, mensaje, alConfirmar, alCancelar)
CUÁNDO SE EJECUTA: El proveedor se monta en App.jsx.
  Los modales se pintan encima de todo el contenido cuando
  algún componente llama a estas funciones.
USADO EN: Prácticamente todas las páginas que guardan, borran
  o realizan acciones importantes.
*/

import React, { createContext, useContext, useState, useCallback } from 'react';
import './modal_notificacion.scss';

const ContextoNotificaciones = createContext();

export const ProveedorNotificaciones = ({ children }) => {

  // Estado del modal de notificación simple
  const [notificacion, setNotificacion] = useState({
    abierta: false,
    titulo: '',
    mensaje: '',
    tipo: 'exito',
    alCerrar: null,
    acciones: []
  });

  // Estado del modal de confirmación (Sí / No)
  const [confirmacion, setConfirmacion] = useState({
    abierta: false,
    titulo: '',
    mensaje: '',
    alConfirmar: null,
    alCancelar: null
  });

  /*
  Abre el modal de notificación con los datos recibidos.
  Llamado desde cualquier página con: mostrarNotificacion('Título', 'Texto', 'exito')
  */
  const mostrarNotificacion = useCallback((titulo, mensaje, tipo = 'exito', alCerrar = null, acciones = []) => {
    setNotificacion({ abierta: true, titulo, mensaje, tipo, alCerrar, acciones });
  }, []);

  /*
  Abre el modal de confirmación con botones Cancelar / Confirmar.
  Llamado desde páginas de borrado o acciones irreversibles.
  */
  const mostrarConfirmacion = useCallback((titulo, mensaje, alConfirmar, alCancelar = null) => {
    setConfirmacion({ abierta: true, titulo, mensaje, alConfirmar, alCancelar });
  }, []);

  // Cierra el modal de notificación y ejecuta la función de retorno si existe
  const cerrarNotificacion = useCallback(() => {
    if (notificacion.alCerrar) notificacion.alCerrar();
    setNotificacion(anterior => ({ ...anterior, abierta: false }));
  }, [notificacion]);

  // Ejecuta la acción de confirmar y cierra el modal
  const confirmarAccion = useCallback(() => {
    if (confirmacion.alConfirmar) confirmacion.alConfirmar();
    setConfirmacion(anterior => ({ ...anterior, abierta: false }));
  }, [confirmacion]);

  // Cancela la acción y cierra el modal
  const cancelarAccion = useCallback(() => {
    if (confirmacion.alCancelar) confirmacion.alCancelar();
    setConfirmacion(anterior => ({ ...anterior, abierta: false }));
  }, [confirmacion]);

  // Devuelve el icono correcto según el tipo de notificación
  const obtenerIconoSegunTipo = (tipo) => {
    if (tipo === 'exito')     return 'check_circle';
    if (tipo === 'error')     return 'cancel';
    if (tipo === 'advertencia') return 'warning';
    return 'info';
  };

  return (
    <ContextoNotificaciones.Provider value={{ mostrarNotificacion, mostrarConfirmacion }}>
      {children}

      {/*Modal de notificación simple */}
      {notificacion.abierta && (
        <div className="fondo-notificacion">
          <div className={`notification-modal ${notificacion.tipo}`}>
            <div className="icono-notificacion">
              <span className="material-symbols-outlined">
                {obtenerIconoSegunTipo(notificacion.tipo)}
              </span>
            </div>
            <div className="notification-content">
              <h2>{notificacion.titulo}</h2>
              <p>{notificacion.mensaje}</p>
            </div>
            <div className="acciones-confirmacion">
              {/* Botones extra*/}
              {notificacion.acciones && notificacion.acciones.map((accion, indice) => (
                <button
                  key={indice}
                  className={`btn-accion-notificacion ${accion.tipo || ''}`}
                  onClick={() => {
                    if (accion.alHacer) accion.alHacer();
                    cerrarNotificacion();
                  }}
                >
                  {accion.icono && <span className="material-symbols-outlined">{accion.icono}</span>}
                  {accion.etiqueta}
                </button>
              ))}
              <button className="btn-notificacion" onClick={cerrarNotificacion}>
                {notificacion.acciones?.length > 0 ? 'Cerrar' : 'Entendido'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/*Modal de confirmación*/}
      {confirmacion.abierta && (
        <div className="fondo-notificacion">
          <div className="notification-modal warning confirmacion">
            <div className="icono-notificacion">
              <span className="material-symbols-outlined">help</span>
            </div>
            <div className="notification-content">
              <h2>{confirmacion.titulo}</h2>
              <p>{confirmacion.mensaje}</p>
            </div>
            <div className="acciones-confirmacion">
              <button className="btn-cancelar"  onClick={cancelarAccion}>Cancelar</button>
              <button className="btn-confirmar" onClick={confirmarAccion}>Confirmar</button>
            </div>
          </div>
        </div>
      )}
    </ContextoNotificaciones.Provider>
  );
};


export const useNotificaciones = () => {
  const contexto = useContext(ContextoNotificaciones);
  if (!contexto) {
    throw new Error('useNotificaciones debe usarse dentro de un ProveedorNotificaciones');
  }
  return contexto;
};
