/*
PARA QUÉ SIRVE: Almacena la configuración global del sistema
  (nombre del centro y tamaño del código de barras) y la
  comparte con cualquier componente que la necesite sin
  tener que pasarla como prop uno a uno.
CUÁNDO SE EJECUTA: El proveedor (ProveedorConfiguracion) se
  monta en App.jsx al arrancar. Cualquier componente
  que llame a useConfiguracion() recibe estos valores al instante.
USADO EN: Encabezado, PiePagina, LayoutOrdenanza, InicioSesion,
  RecuperarContrasena, FormularioLlave, FormularioUsuario, Configuracion.
*/

import React, { createContext, useContext, useState, useEffect } from 'react';
import { obtenerConfiguracion } from '../servicios/servicioConfiguracion';

const ContextoConfiguracion = createContext();

/*
Proveedor: Se coloca en App.jsx para que todos los hijos puedan leer la config.
*/
export const ProveedorConfiguracion = ({ children }) => {
  const [nombreCentro, setNombreCentro]             = useState('IES Oretania');
  const [tamanoCodigoBarras, setTamanoCodigoBarras] = useState(400);

  /*
  Pide la configuración al servidor y actualiza los estados locales.
  Se llama al montar el proveedor y también cuando el admin guarda cambios.
  */
  const actualizarConfiguracion = async () => {
    try {
      const response = await obtenerConfiguracion();
      if (response.data) {
        if (response.data.nombre_centro) {
          setNombreCentro(response.data.nombre_centro);
        }
        if (response.data.barcode_size) {
          setTamanoCodigoBarras(Number(response.data.barcode_size));
        }
      }
    } catch (error) {
      console.error('Error cargando configuración del centro:', error);
    }
  };

  // Al montar el proveedor por primera vez cargamos la configuración guardada
  useEffect(() => {
    actualizarConfiguracion();
  }, []);

  return (
    <ContextoConfiguracion.Provider
      value={{
        nombreCentro,
        setNombreCentro,
        tamanoCodigoBarras,
        setTamanoCodigoBarras,
        actualizarConfiguracion
      }}
    >
      {children}
    </ContextoConfiguracion.Provider>
  );
};

export const useConfiguracion = () => {
  const contexto = useContext(ContextoConfiguracion);
  if (!contexto) {
    throw new Error('useConfiguracion debe usarse dentro de un ProveedorConfiguracion');
  }
  return contexto;
};
