
import React from 'react';

/**
 * @param {string} variante
 * @param {string} icono
 * @param {string} label
 * @param {number|string} valor
 */
const KpiCard = ({ variante = 'primary', icono, label, valor }) => (
  <div className={`tarjeta-kpi ${variante}`}>
    <div className="contenido-kpi">
      <p>{label}</p>
      <h3>{valor ?? '—'}</h3>
    </div>
    <div className="caja-icono-kpi">
      <span className="material-symbols-outlined">{icono}</span>
    </div>
    <span className="material-symbols-outlined icono-fondo-kpi">{icono}</span>
  </div>
);

export default KpiCard;
