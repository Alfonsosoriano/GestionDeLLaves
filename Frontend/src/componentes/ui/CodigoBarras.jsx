/*
PARA QUÉ SIRVE: Componente reutilizable para renderizar códigos de barras con JsBarcode.
  Obtiene el tamaño global de los códigos desde el contexto de configuración.
USADO EN: FormularioLlave, FormularioUsuario, RegistroLlave, RegistrarPerdida, DevolucionLlave.
*/
import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { useConfiguracion } from '../../contexto/contexto_configuracion';

const CodigoBarras = ({
  valor,
  mostrarTexto = false,
  paraImpresion = false,
  anchoLinea = 2,
  altoLinea = 60,
  fontSize = 14,
  svgRef = null
}) => {
  const { tamanoCodigoBarras } = useConfiguracion();
  const refLocal = useRef(null);
  const refPrincipal = svgRef || refLocal;

  useEffect(() => {
    if (refPrincipal.current && valor) {
      try {
        const opciones = {
          format: "CODE128",
          lineColor: "#000",
          width: paraImpresion ? 2 : (anchoLinea || 1.5),
          height: paraImpresion ? 80 : (altoLinea || 50),
          displayValue: mostrarTexto,
          fontSize: fontSize || 14,
          background: paraImpresion ? "#ffffff" : "transparent"
        };
        JsBarcode(refPrincipal.current, valor, opciones);
      } catch (e) {
        console.error("Error generando código de barras:", e);
      }
    }
  }, [valor, mostrarTexto, paraImpresion, anchoLinea, altoLinea, fontSize, refPrincipal]);


  const estilo = paraImpresion
    ? { width: '100%', maxWidth: `${tamanoCodigoBarras || 400}px`, height: 'auto' }
    : { width: '100%', maxWidth: '250px', height: 'auto' };

  return <svg ref={refPrincipal} style={estilo}></svg>;
};

export default CodigoBarras;
