/*
FICHERO: paginas/administracion/Configuracion.jsx
PARA QUÉ SIRVE: Pantalla de ajustes del sistema para el
  administrador. Permite cambiar el nombre del centro y el
  tamaño de impresión del código de barras.
CUÁNDO SE EJECUTA: Al navegar a /configuracion.
FUNCIONES PRINCIPALES:
  · cargarAjustes()        → lee la configuración actual del servidor
  · manejarCambio()        → actualiza el estado del formulario al escribir
  · manejarEnvio()         → guarda los cambios y recarga el contexto global
*/
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LayoutAdministrador from '../../componentes/layouts/layout_administrador';
import { useConfiguracion } from '../../contexto/contexto_configuracion';
import { useNotificaciones } from '../../contexto/contexto_notificaciones';
import { obtenerConfiguracion, guardarConfiguracion } from '../../servicios/servicioConfiguracion';
import './Configuracion.scss';

const OPCIONES_TAMANO = [
  { label: 'Pequeño (150 px)',  valor: 150 },
  { label: 'Mediano (200 px)',  valor: 200 },
  { label: 'Normal (300 px)',   valor: 300 },
  { label: 'Grande (400 px)',   valor: 400 },
];

const Configuracion = () => {
  const navegar = useNavigate();
  const { actualizarConfiguracion } = useConfiguracion();
  const { mostrarNotificacion } = useNotificaciones();
  const [ajustes, setAjustes] = useState({
    nombre_centro: '',
    barcode_size: 400
  });
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const cargarAjustes = async () => {
      try {
        const response = await obtenerConfiguracion();
        setAjustes(anterior => ({ ...anterior, ...response.data, barcode_size: response.data.barcode_size || 400 }));
      } catch (error) {
        console.error('Error cargando ajustes:', error);
      } finally {
        setCargando(false);
      }
    };
    cargarAjustes();
  }, []);

  const manejarCambio = (e) => {
    const { name, value } = e.target;
    setAjustes(anterior => ({ ...anterior, [name]: value }));
  };

  const seleccionarPreset = (valor) => {
    setAjustes(anterior => ({ ...anterior, barcode_size: valor }));
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      await guardarConfiguracion({
        ...ajustes,
        barcode_size: Number(ajustes.barcode_size)
      });
      await actualizarConfiguracion();
      mostrarNotificacion('¡Ajustes Guardados!', 'La configuración se ha actualizado correctamente.', 'success');
    } catch (error) {
      mostrarNotificacion('Error', 'No se pudieron guardar los ajustes.', 'error');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <LayoutAdministrador titulo="Configuración del Sistema">
      <div className="contenedor-configuracion">
        <div className="tarjeta-configuracion">
          <div className="cabecera-configuracion">
            <span className="material-symbols-outlined icono-ajustes">settings</span>
            <div>
              <h2>Ajustes Generales</h2>
              <p>Personaliza la apariencia y el nombre de tu institución</p>
            </div>
          </div>

          {cargando ? (
            <div className="estado-cargando-config">Cargando ajustes...</div>
          ) : (
            <form onSubmit={manejarEnvio} className="formulario-configuracion">
              <div className="grupo-formulario">
                <label htmlFor="nombre_centro">Nombre de la Institución</label>
                <div className="campo-con-icono">
                  <span className="material-symbols-outlined">school</span>
                  <input
                    type="text"
                    id="nombre_centro"
                    name="nombre_centro"
                    value={ajustes.nombre_centro}
                    onChange={manejarCambio}
                    placeholder="Nombre del centro"
                    required
                  />
                </div>
                <p className="ayuda-campo">Este nombre aparecerá en el login y en todas las cabeceras del sistema.</p>
              </div>

              <div className="grupo-formulario">
                <label>Tamaño de Impresión de Códigos de Barras</label>
                <div className="opciones-tamano-barcode">
                  {OPCIONES_TAMANO.map((opcion) => (
                    <label key={opcion.valor} className="opcion-tamano-radio">
                      <input
                        type="radio"
                        name="barcode_size"
                        value={opcion.valor}
                        checked={Number(ajustes.barcode_size) === opcion.valor}
                        onChange={() => seleccionarPreset(opcion.valor)}
                      />
                      <span className="label-opcion">
                        <span className="material-symbols-outlined">straighten</span>
                        {opcion.label}
                      </span>
                    </label>
                  ))}
                </div>
                <p className="ayuda-campo">Este tamaño se aplicará en todas las impresiones del sistema.</p>
              </div>

              <div className="acciones-configuracion">
                <button type="submit" className="btn-guardar" disabled={guardando}>
                  {guardando ? (
                    <>
                      <span className="material-symbols-outlined spin">sync</span>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">save</span>
                      Guardar Cambios
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
          
          <div className="acciones-nav-config" style={{ display: 'flex', justifyContent: 'center', marginTop: '20px', paddingBottom: '10px' }}>
            <button 
              onClick={() => navegar('/panel-administracion')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#ffffff',
                color: '#334155',
                padding: '6px 14px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px',
                boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f8fafc';
                e.currentTarget.style.borderColor = '#cbd5e1';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#ffffff';
                e.currentTarget.style.borderColor = '#e2e8f0';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
              Volver
            </button>
          </div>
        </div>
      </div>
    </LayoutAdministrador>
  );
};

export default Configuracion;
