/*
FICHERO: componentes/layouts/layout_ordenanza.jsx
PARA QUÉ SIRVE: Estructura visual de todas las páginas del
  ordenanza: cabecera arriba, título de sección en el centro
  y pie de página abajo. Más simple que el layout de admin
  porque no tiene barra lateral.
CUÁNDO SE EJECUTA: Se monta cada vez que el ordenanza navega
  a una página de su área.
USADO EN: PanelOrdenanza, RegistroLlave, DevolucionLlave,
  RegistrarPerdida. También en HistorialMovimientos y
  ListadoLlaves cuando el usuario conectado es ordenanza.
*/

import React from 'react';
import { useConfiguracion } from '../../contexto/contexto_configuracion';
import Encabezado from '../comunes/encabezado';
import PiePagina  from '../comunes/pie_pagina';
import './layout_ordenanza.scss';

// Recibe el contenido de la página  y el título de la sección
const LayoutOrdenanza = ({ children, titulo }) => {
  const { nombreCentro } = useConfiguracion();

  return (
    <div className="envoltorio-principal">
      <Encabezado />

      <div className="gl-content-area">
        <header className="cabecera-global">
          <div className="contenido-cabecera">
            <div></div>
            <div className="grupo-titulo">
              <h1>{titulo}</h1>
              <p className="subtitulo-cabecera">{nombreCentro} — Gestión de Llaves</p>
            </div>
            <div className="gl-spacer"></div>
          </div>
        </header>

        {/* MUESTRA EL CONTENIDO DE LA PÁGINA ORDENANZA */}
        <main className="gl-main">
          {children}
        </main>
      </div>

      <PiePagina />
    </div>
  );
};

export default LayoutOrdenanza;
