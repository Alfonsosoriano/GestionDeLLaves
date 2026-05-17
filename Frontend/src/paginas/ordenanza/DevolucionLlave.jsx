/*
PARA QUÉ SIRVE: Formulario para registrar la devolución de una
  llave. El ordenanza escanea el código de la llave; el del
  carnet del ordenanza es opcional.
CUÁNDO SE EJECUTA: Al navegar a /devolucion-llave.
FUNCIONES PRINCIPALES:
  · consultarInfoCodigo()   → busca usuario o llave por código escaneado
  · manejarDevolucion()     → valida y envía la devolución al servidor
  · alPulsarTeclaOrdenanza() / alPulsarTeclaLlave() / alPulsarTeclaNombre()
    → gestionan el foco entre campos al pulsar Enter
*/
import React, { useState, useEffect, useRef } from 'react';
import LayoutOrdenanza from '../../componentes/layouts/layout_ordenanza';
import { Link, useNavigate } from 'react-router-dom';
import CodigoBarras from '../../componentes/ui/CodigoBarras';
import api from '../../servicios/api';
import { useNotificaciones } from '../../contexto/contexto_notificaciones';
import './RegistroLlave.scss';

const DevolucionLlave = () => {
  const navegar = useNavigate();
  const { mostrarNotificacion } = useNotificaciones();

  const [codigoOrdenanza, setCodigoOrdenanza] = useState('');
  const [codigoLlave, setCodigoLlave] = useState('');
  const [nombrePersona, setNombrePersona] = useState('');

  const [vistaPreviaLlave, setVistaPreviaLlave] = useState(null);
  const [vistaPreviaUsuario, setVistaPreviaUsuario] = useState(null);

  const [cargando, setCargando] = useState(false);
  const [errores, setErrores] = useState({ ordenanza: '', llave: '', nombre: '' });

  const referenciaCodigoLlave = useRef(null);
  const referenciaCodigoUsuario = useRef(null);

  const consultarInfoCodigo = async (codigo, tipo) => {
    if (!codigo) return;
    try {
      const response = await api.get(`/api/registros/info/${codigo}`);
      if (response.data.tipo === tipo) {
        if (tipo === 'llave') {
          setVistaPreviaLlave(response.data.datos);
          setErrores(anterior => ({ ...anterior, llave: '' }));
        } else {
          setVistaPreviaUsuario(response.data.datos);
          setErrores(anterior => ({ ...anterior, ordenanza: '' }));
        }
      } else {
        throw new Error('Tipo incorrecto');
      }
    } catch (err) {
      if (tipo === 'llave') {
        setVistaPreviaLlave(null);
        setErrores(anterior => ({ ...anterior, llave: 'El código no pertenece a una llave registrada' }));
      } else if (tipo === 'usuario') {
        setVistaPreviaUsuario(null);
        setErrores(anterior => ({ ...anterior, ordenanza: 'El código no pertenece a un usuario registrado' }));
      }
    }
  };

  const manejarDevolucion = async (e) => {
    e?.preventDefault();
    setErrores({ ordenanza: '', llave: '', nombre: '' });

    if (!codigoLlave) {
      setErrores(anterior => ({ ...anterior, llave: 'El código de llave es obligatorio.' }));
      return;
    }

    setCargando(true);

    try {
      let idLlave = vistaPreviaLlave?.id;

      if (!idLlave || vistaPreviaLlave?.codigoBarras !== codigoLlave) {
        try {
          const resLlave = await api.get(`/api/registros/info/${codigoLlave}`);
          if (resLlave.data.tipo === 'llave') {
            idLlave = resLlave.data.datos.id;
            setVistaPreviaLlave(resLlave.data.datos);
          } else {
            setErrores(anterior => ({ ...anterior, llave: 'Código no reconocido como llave' }));
            setCargando(false);
            return;
          }
        } catch (e) {
          setErrores(anterior => ({ ...anterior, llave: 'Código de llave no encontrado' }));
          setCargando(false);
          return;
        }
      }

      let idUsuario = vistaPreviaUsuario?.id;
     
      if (codigoOrdenanza && (!idUsuario || vistaPreviaUsuario?.codigoBarras !== codigoOrdenanza)) {
        try {
          const resUsuario = await api.get(`/api/registros/info/${codigoOrdenanza}`);
          if (resUsuario.data.tipo === 'usuario') {
            idUsuario = resUsuario.data.datos.id;
            setVistaPreviaUsuario(resUsuario.data.datos);
          } else {
            setErrores(anterior => ({ ...anterior, ordenanza: 'Código no reconocido como usuario' }));
            setCargando(false);
            return;
          }
        } catch (e) {
          setErrores(anterior => ({ ...anterior, ordenanza: 'Código de usuario no encontrado' }));
          setCargando(false);
          return;
        }
      }

      const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual') || '{}');

      
      await api.post('/api/registros/devolver', {
        llave_id: idLlave,
        ordenanza_id: idUsuario || usuarioActual.id,
        observaciones: nombrePersona ? `Devuelto por: ${nombrePersona}` : ''
      });

      mostrarNotificacion('¡Devolución Completada!', 'La llave ha sido devuelta con éxito.', 'success', () => {
        navegar('/panel-ordenanza');
      });

      setCodigoOrdenanza('');
      setCodigoLlave('');
      setNombrePersona('');
      setVistaPreviaLlave(null);
      setVistaPreviaUsuario(null);

    } catch (err) {
      const mensajeError = err.response?.data?.error || err.message || 'Error al procesar devolución';
      if (mensajeError.toLowerCase().includes('llave')) {
        setErrores(anterior => ({ ...anterior, llave: mensajeError }));
      } else if (mensajeError.toLowerCase().includes('usuario') || mensajeError.toLowerCase().includes('ordenanza')) {
        setErrores(anterior => ({ ...anterior, ordenanza: mensajeError }));
      } else {
        mostrarNotificacion('Error de Devolución', mensajeError, 'error');
      }
    } finally {
      setCargando(false);
    }
  };

  const alPulsarTeclaOrdenanza = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('llave-barcode')?.focus();
    }
  };

  const alPulsarTeclaLlave = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.getElementById('nombre-persona')?.focus();
    }
  };

  const alPulsarTeclaNombre = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (codigoLlave) {
        manejarDevolucion(e);
      }
    }
  };

  return (
    <LayoutOrdenanza titulo="REGISTRAR DEVOLUCIÓN">
      <div className="envoltorio-registro">
        <main className="rl-main">
          {/*  COLUMNA FORMULARIO */}
          <div className="formulario-registro-col">
            <div className="tarjeta-registro">
              <div className="cabecera-tarjeta-registro">
                <h1 className="texto-superficie">Devolución de Llave</h1>
              </div>

          <div className="cuerpo-tarjeta-registro">
            {/*  FORMULARIO */}
            <form className="formulario-registro" onSubmit={manejarDevolucion}>
              <div className="grupo-campo-registro">
                <label htmlFor="ordenanza-barcode">Código Ordenanza (Opcional)</label>
                <div className="rl-envoltorio-campo">
                  <span className="material-symbols-outlined">barcode_scanner</span>
                  <input
                    type="text"
                    id="ordenanza-barcode"
                    placeholder="Escanee el carnet si está disponible"
                    value={codigoOrdenanza}
                    onChange={(e) => {
                      setCodigoOrdenanza(e.target.value);
                      setErrores(anterior => ({ ...anterior, ordenanza: '' }));
                    }}
                    onKeyDown={alPulsarTeclaOrdenanza}
                    onBlur={() => { if (codigoOrdenanza) consultarInfoCodigo(codigoOrdenanza, 'usuario'); }}
                    autoFocus
                  />
                  <button 
                    type="button" 
                    className="rl-scan-trigger"
                    onClick={() => document.getElementById('ordenanza-barcode').focus()}
                    titulo="Pulsa para activar el lector de barras"
                  >
                    <span className="material-symbols-outlined">Barcode_Reader</span>
                    Pulsa para escanear
                  </button>
                </div>
                {errores.ordenanza && <span className="mensaje-error-campo">{errores.ordenanza}</span>}
              </div>

              <div className="grupo-campo-registro">
                <label htmlFor="llave-barcode">Leer Código de Barras Llave</label>
                <div className="rl-envoltorio-campo">
                  <span className="material-symbols-outlined">vpn_key</span>
                  <input
                    type="text"
                    id="llave-barcode"
                    placeholder="Escanee la llave a devolver"
                    value={codigoLlave}
                    onChange={(e) => {
                      setCodigoLlave(e.target.value);
                      setErrores(anterior => ({ ...anterior, llave: '' }));
                    }}
                    onKeyDown={alPulsarTeclaLlave}
                    onBlur={() => { if (codigoLlave) consultarInfoCodigo(codigoLlave, 'llave'); }}
                  />
                  <button 
                    type="button" 
                    className="rl-scan-trigger"
                    onClick={() => document.getElementById('llave-barcode').focus()}
                    titulo="Pulsa para activar el lector de barras"
                  >
                    <span className="material-symbols-outlined">Barcode_Reader</span>
                    Pulsa para escanear
                  </button>
                </div>
                {errores.llave && <span className="mensaje-error-campo">{errores.llave}</span>}
              </div>

              <div className="grupo-campo-registro">
                <label htmlFor="nombre-persona">Persona que devuelve (Opcional)</label>
                <div className="rl-envoltorio-campo">
                  <span className="material-symbols-outlined">person</span>
                  <input
                    type="text"
                    id="nombre-persona"
                    placeholder="Nombre de quien entrega la llave"
                    value={nombrePersona}
                    onChange={(e) => {
                      setNombrePersona(e.target.value);
                      setErrores(anterior => ({ ...anterior, nombre: '' }));
                    }}
                    onKeyDown={alPulsarTeclaNombre}
                  />
                </div>
                {errores.nombre && <span className="mensaje-error-campo">{errores.nombre}</span>}
              </div>

                  {vistaPreviaLlave && vistaPreviaLlave.estado && vistaPreviaLlave.estado.toLowerCase() === "disponible" && (
                    <div className="rl-warning-banner">
                      <span className="material-symbols-outlined">warning</span>
                      Esta llave ya se encuentra disponible en conserjería y no puede ser devuelta.
                    </div>
                  )}

                  {/* BOTON DE ENVIO / ACCIONES */}
                  <div style={{ display: 'flex', gap: '16px', marginTop: '24px' }}>
                    <button
                      type="submit"
                      className="btn-enviar devolucion"
                      disabled={cargando || (vistaPreviaLlave && vistaPreviaLlave.estado && vistaPreviaLlave.estado.toLowerCase() === "disponible")}
                    >
                      <span className="material-symbols-outlined">{cargando ? 'sync' : 'keyboard_return'}</span>
                      {cargando ? 'Procesando...' : 'Registrar Devolución'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <Link to="/panel-ordenanza" className="btn-volver">
                <span className="material-symbols-outlined">arrow_back</span>
                Volver
              </Link>
            </div>
          </div>

          {/*  COLUMNA VISTAS PREVIAS */}
          <div className="columna-vista-previa-registro">
            {/*  TARJETA VISTA PREVIA LLAVE */}
            <div className="tarjeta-registro">
              <div className="cabecera-tarjeta-registro">
                <h2 className="texto-superficie">Llave a Devolver</h2>
              </div>
              <div className="cuerpo-tarjeta-registro">
                <div className="cabecera-vista-previa-registro">
                  <div>
                    <h3>{vistaPreviaLlave ? vistaPreviaLlave.descripcion : 'Esperando lectura...'}</h3>
                    <p>{vistaPreviaLlave ? 'Registrada en sistema' : ''}</p>
                  </div>
                  {vistaPreviaLlave && (
                    <span className={`etiqueta-registro ${vistaPreviaLlave.estado.toLowerCase()}`}>
                      {vistaPreviaLlave.estado}
                    </span>
                  )}
                </div>
                <div className="vista-previa-codigo-barras">
                  <div style={{ minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {codigoLlave ? (
                      <CodigoBarras 
                        valor={codigoLlave} 
                        svgRef={referenciaCodigoLlave} 
                        anchoLinea={1.5} 
                        altoLinea={50} 
                      />
                    ) : (
                      <span style={{ color: '#ccc' }}>Esperando código...</span>
                    )}
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '2px', fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>
                    {codigoLlave || '---'}
                  </div>
                </div>
              </div>
            </div>

            {/*  TARJETA VISTA PREVIA ORDENANZA / USUARIO */}
            <div className="tarjeta-registro">
              <div className="cabecera-tarjeta-registro">
                <h2 className="texto-superficie">Ordenanza / Usuario</h2>
              </div>
              <div className="cuerpo-tarjeta-registro">
                <div className="cabecera-vista-previa-registro">
                  <div>
                    <h3>{vistaPreviaUsuario ? vistaPreviaUsuario.nombre : 'Sin identificar'}</h3>
                    <p>{vistaPreviaUsuario ? vistaPreviaUsuario.rol : 'Opcional'}</p>
                  </div>
                </div>
                <div className="vista-previa-codigo-barras">
                  <div style={{ minHeight: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {codigoOrdenanza ? (
                      <CodigoBarras 
                        valor={codigoOrdenanza} 
                        svgRef={referenciaCodigoUsuario} 
                        anchoLinea={1.5} 
                        altoLinea={50} 
                      />
                    ) : (
                      <span style={{ color: '#ccc' }}>Esperando código...</span>
                    )}
                  </div>
                  <div style={{ textAlign: 'center', marginTop: '2px', fontSize: '18px', fontWeight: 'bold', letterSpacing: '2px' }}>
                    {codigoOrdenanza || '---'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </LayoutOrdenanza>
  );
};

export default DevolucionLlave;
