/*
Uso:
  <BtnVolver onClick={() => navegar('/panel-administracion')} />
  <BtnVolver ruta="/panel-administracion" />
*/
import React from 'react';
import { useNavigate } from 'react-router-dom';

/**
 * @param {function} [onClick]
 * @param {string}   [ruta]
 * @param {string}   [texto]
 */
const BtnVolver = ({ onClick, ruta, texto = 'Volver' }) => {
  const navegar = useNavigate();

  const manejarClick = onClick ?? (() => navegar(ruta ?? -1));

  return (
    <div className="acciones-nav">
      <button className="btn-volver" onClick={manejarClick}>
        <span className="material-symbols-outlined">arrow_back</span>
        {texto}
      </button>
    </div>
  );
};

export default BtnVolver;
