/*
PARA QUÉ SIRVE: Pie de página con el copyright del centro.
  Aparece al final de todas las páginas que usan un layout.
CUÁNDO SE EJECUTA: Se monta dentro de LayoutAdministrador y
  LayoutOrdenanza, que a su vez son usados por todas las páginas.
USADO EN: LayoutAdministrador, LayoutOrdenanza.
*/

import React from 'react';
import { useConfiguracion } from '../../contexto/contexto_configuracion';
import './pie_pagina.scss';

const PiePagina = () => {
  const { nombreCentro } = useConfiguracion();

  return (
    <footer className="pie-pagina-app">
      <div className="contenido-pie">
        <p>
          &copy; {new Date().getFullYear()} {nombreCentro} — Gestión de Llaves.
          Todos los derechos reservados.
        </p>
        <div className="enlaces-pie">
          <span className="etiqueta-pie">Sistema de Control Interno</span>
        </div>
      </div>
    </footer>
  );
};

export default PiePagina;
