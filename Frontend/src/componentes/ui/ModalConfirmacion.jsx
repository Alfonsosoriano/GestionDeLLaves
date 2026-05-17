import React from 'react';

/**
 * @param {string|ReactNode} titulo
 * @param {string|ReactNode} texto
 * @param {string}           [etiquetaConfirmar]
 * @param {boolean}          [cargando]
 * @param {function}         onConfirmar
 * @param {function}         onCancelar
 */
const ModalConfirmacion = ({
  titulo = 'Confirmar acción',
  texto,
  etiquetaConfirmar = 'Eliminar',
  cargando = false,
  onConfirmar,
  onCancelar,
}) => (
  <div
    className="fondo-modal"
    onClick={(e) => e.target === e.currentTarget && onCancelar?.()}
  >
    <div className="tarjeta-modal">
      <span className="material-symbols-outlined icono-modal">delete_forever</span>
      <h2 className="titulo-modal">{titulo}</h2>
      <p className="texto-modal">{texto}</p>
      <div className="acciones-modal">
        <button
          className="btn-cancelar"
          onClick={onCancelar}
          disabled={cargando}
        >
          Cancelar
        </button>
        <button
          className="btn-confirmar"
          onClick={onConfirmar}
          disabled={cargando}
        >
          {cargando ? 'Procesando…' : etiquetaConfirmar}
        </button>
      </div>
    </div>
  </div>
);

export default ModalConfirmacion;
