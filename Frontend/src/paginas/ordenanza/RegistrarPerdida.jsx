/*
PARA QUÉ SIRVE: Permite marcar una llave como perdida buscándola
  por código o descripción. También muestra el listado de llaves
  actualmente perdidas y permite restaurarlas.
CUÁNDO SE EJECUTA: Al navegar a /registrar-perdida.
FUNCIONES PRINCIPALES:
  · buscarEnListado()         → busca llaves mientras el usuario escribe (debounce)
  · elegirLlave()             → selecciona una llave del desplegable de resultados
  · manejarMarcarPerdida()    → envía la pérdida al servidor
  · cargarHistorial()         → carga las llaves actualmente perdidas
  · manejarRestauracion()     → pide confirmación antes de restaurar
  · ejecutarRestaurado()      → llama al servidor para restaurar la llave
*/
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useNotificaciones } from '../../contexto/contexto_notificaciones';
import CodigoBarras from '../../componentes/ui/CodigoBarras';
import api from '../../servicios/api';
import LayoutOrdenanza from '../../componentes/layouts/layout_ordenanza';
import { normalizarTexto } from '../../utils/normalizar_texto';
import './RegistrarPerdida.scss';

const RegistrarPerdida = () => {
  const navegar = useNavigate();
  const { mostrarNotificacion, mostrarConfirmacion } = useNotificaciones();
  const [consulta, setConsulta] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [vistaPreviaLlave, setVistaPreviaLlave] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const [mensaje, setMensaje] = useState({ type: '', text: '' });
  const [resultadosBusqueda, setResultadosBusqueda] = useState([]);
  const [mostrarDesplegable, setMostrarDesplegable] = useState(false);
  const [historialPerdidas, setHistorialPerdidas] = useState([]);
  const [cargandoHistorial, setCargandoHistorial] = useState(false);
  
  const referenciaCodigoBarras = useRef(null);

  //BUSCAR EN LISTADO
  const buscarEnListado = async (terminoBusqueda) => {
    if (!terminoBusqueda || terminoBusqueda.trim().length < 2) {
      setResultadosBusqueda([]);
      setMostrarDesplegable(false);
      return;
    }

    
    setBuscando(true);
    try {
      const response = await api.get(`/api/llaves/buscar?q=${encodeURIComponent(terminoBusqueda)}`);
      setResultadosBusqueda(response.data);
      setMostrarDesplegable(response.data.length > 0);
    } catch (err) {
      console.error("Error buscando llaves", err);
      setResultadosBusqueda([]);
      setMostrarDesplegable(false);
    } finally {
      setBuscando(false);
    }
  };

  //TEMPORIZADOR PARA BUSQUEDA
  useEffect(() => {
    const temporizadorDebounce = setTimeout(() => {
      if (consulta && !vistaPreviaLlave) {
        buscarEnListado(consulta);
      }
    }, 300);

    return () => clearTimeout(temporizadorDebounce);
  }, [consulta, vistaPreviaLlave]);

  //CARGAR HISTORIAL DE PERDIDAS
  const cargarHistorial = async () => {
    try {
      setCargandoHistorial(true);
      const response = await api.get('/api/llaves');
      if (response.data && Array.isArray(response.data)) {
        setHistorialPerdidas(response.data.filter(k => k.estado && k.estado.toLowerCase() === 'perdida'));
      }
    } catch (error) {
      console.error("Error al cargar historial de perdidas:", error);
    } finally {
      setCargandoHistorial(false);
    }
  };

  //ESTADO DE CARGA DEL HISTORIAL
  useEffect(() => {
    cargarHistorial();
  }, []);

  const manejarRestauracion = async (llave) => {
    if (!mostrarConfirmacion) {
      if (!window.confirm(`¿Estás seguro de que deseas restaurar la llave ${llave.descripcion}?`)) return;
      ejecutarRestaurado(llave.id);
      return;
    }

    mostrarConfirmacion(
      'Confirmar Restauración',
      `¿Estás seguro de que deseas restaurar la llave "${llave.descripcion}"? Volverá a estar disponible para préstamos.`,
      () => ejecutarRestaurado(llave.id)
    );
  };

  //LLAMA AL SERVIDOR PARA RESTAURAR LA LLAVE
  const ejecutarRestaurado = async (llaveId) => {
    try {
      const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual') || '{}');
      await api.post('/api/registros/restaurar', { 
        llave_id: llaveId, 
        usuario_id: usuarioActual.id,
        observaciones: 'Restaurada desde el panel de pérdidas' 
      });
      setMensaje({ type: 'success', text: 'La llave ha sido restaurada y registrada en el historial.' });
      cargarHistorial();
      if(mostrarNotificacion) {
        mostrarNotificacion(
          'Llave Restaurada', 
          'La llave se ha restaurado correctamente y vuelve a estar disponible.', 
          'success'
        );
      }
    } catch(err) {
      console.error(err.response?.data || err);
      const mensajeError = err.response?.data?.error || 'Error al restaurar la llave';
      setMensaje({ type: 'error', text: mensajeError });
      if(mostrarNotificacion) mostrarNotificacion('Error al Restaurar', mensajeError, 'error');
    }
  };

  //ELIGE UNA LLAVE DEL DESPLEGABLE DE RESULTADOS
  const elegirLlave = (llave) => {
    setVistaPreviaLlave(llave);
    setConsulta(llave.codigo_barras || llave.codigoBarras);
    setMostrarDesplegable(false);
    setResultadosBusqueda([]);
  };

  //MANEJA EL EVENTO DE MARCAR UNA LLAVE COMO PERDIDA
  const manejarMarcarPerdida = async (e) => {
    if (e) e.preventDefault();

    if (!vistaPreviaLlave && consulta.trim()) {
      if (resultadosBusqueda.length > 0) {
        const q = normalizarTexto(consulta.trim());
        const coincidenciaExacta = resultadosBusqueda.find(l =>
          normalizarTexto(l.codigo_barras || l.codigoBarras) === q ||
          normalizarTexto(l.descripcion) === q
        );
        const elegida = coincidenciaExacta || resultadosBusqueda[0];
        setVistaPreviaLlave(elegida);
        setConsulta(elegida.codigo_barras || elegida.codigoBarras);
        setResultadosBusqueda([]);
        return;
      }
    }

    if (!vistaPreviaLlave) {
      setMensaje({ type: 'error', text: 'Debe buscar y seleccionar una llave.' });
      return;
    }

    setCargando(true);
    setMensaje({ type: '', text: '' });

    try {
      const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual') || '{}');
      await api.post('/api/registros/perder', {
        llave_id: vistaPreviaLlave.id,
        usuario_id: usuarioActual.id,
        observaciones: observaciones || 'Marcada como pérdida por ordenanza'
      });

      setMensaje({ type: 'success', text: '¡Llave registrada como PERDIDA!' });
      setConsulta('');
      setObservaciones('');
      cargarHistorial();
      setVistaPreviaLlave(null);
      setResultadosBusqueda([]);
    } catch (err) {
      setMensaje({ type: 'error', text: err.response?.data?.error || err.message || 'Error al registrar pérdida' });
    } finally {
      setCargando(false);
    }
  };

  return (
    <LayoutOrdenanza titulo="REGISTRAR PÉRDIDA">
      <main className="rp-principal">
        <div className="rp-contenedor-centrado">
          {/* // COLUMNA FORMULARIO / TARJETA PRINCIPAL */}
          <div className="rp-tarjeta-formulario">
            {/* // FORMULARIO */}
            <form className="rp-formulario" onSubmit={manejarMarcarPerdida}>
              <div className="rp-grupo-input">
                <label htmlFor="llave-search">Buscar Llave (Código o Descripción)</label>
                <div className="rp-input-con-icono">
                  <span className="material-symbols-outlined">search</span>
                  <input
                    id="llave-search"
                    type="text"
                    placeholder="Escriba el codigo de barras o descripcion de la llave"
                    value={consulta}
                    onChange={(e) => {
                      setConsulta(e.target.value);
                      if (vistaPreviaLlave) setVistaPreviaLlave(null);
                    }}
                    autoFocus
                    autoComplete="off"
                  />
                  {buscando && (
                    <span className="material-symbols-outlined rp-cargando-icono">
                      sync
                    </span>
                  )}
                </div>

                {/* // TABLA DE RESULTADOS / BUSQUEDA */}
                {mostrarDesplegable && (
                  <ul className="rp-resultados-busqueda">
                    {resultadosBusqueda.map((llave) => (
                      <li key={llave.id} onClick={() => elegirLlave(llave)}>
                        <div className="rp-fila-info-llave">
                          <strong>{llave.codigo_barras || llave.codigoBarras}</strong> - {llave.descripcion}
                        </div>
                        <span className={`rp-etiqueta-estado estado-${llave.estado.toLowerCase()}`}>
                          {llave.estado}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* // VISTA PREVIA SELECCIONADA */}
              {vistaPreviaLlave && (
                <div className="rp-vista-previa-seleccionada">
                  <div className="rp-imagen-vista-previa">
                    <CodigoBarras 
                      valor={vistaPreviaLlave.codigo_barras || vistaPreviaLlave.codigoBarras} 
                      svgRef={referenciaCodigoBarras}
                      anchoLinea={2}
                      altoLinea={50}
                    />
                    <div className="rp-texto-codigo-barras">{vistaPreviaLlave.codigo_barras || vistaPreviaLlave.codigoBarras}</div>
                  </div>
                  <div className="rp-detalles-vista-previa">
                    <p><strong>Descripción:</strong> {vistaPreviaLlave.descripcion}</p>
                    <p><strong>Estado:</strong> <span className={`estado-${vistaPreviaLlave.estado.toLowerCase()}`}>{vistaPreviaLlave.estado}</span></p>
                  </div>
                </div>
              )}

              <div className="rp-grupo-input">
                <label htmlFor="observaciones-field">Observaciones (Opcional)</label>
                <div className="rp-input-con-icono">
                  <span className="material-symbols-outlined">notes</span>
                  <input
                    id="observaciones-field"
                    type="text"
                    placeholder="Escriba detalles del extravío..."
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                  />
                </div>
              </div>

              {mensaje.text && (
                <div className={`rp-mensaje ${mensaje.type}`}>
                  {mensaje.text}
                </div>
              )}

              {/* // BOTON DE ENVIO / ACCIONES */}
              <button
                type="submit"
                className="rp-btn-enviar"
                disabled={cargando || (!vistaPreviaLlave && !consulta)}
              >
                {cargando ? 'Procesando...' : 'REGISTRAR PÉRDIDA'}
              </button>
            </form>
          </div>
          {/* // TABLA DE HISTORIAL / HISTORIAL */}
          <div className="rp-historial">
              <h2>Historial de Llaves Perdidas</h2>
              
              {cargandoHistorial ? (
                <p className="rp-historial-cargando">Cargando llaves perdidas...</p>
              ) : historialPerdidas.length === 0 ? (
                <p className="rp-historial-vacio">No hay llaves marcadas como perdidas actualmente.</p>
              ) : (
                <div className="rp-contenedor-tabla-historial">
                  <table>
                    <thead>
                      <tr>
                        <th>Cód. Barras</th>
                        <th>Descripción</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historialPerdidas.map(llave => (
                        <tr key={llave.id}>
                          <td>{llave.codigo_barras || llave.codigoBarras}</td>
                          <td>{llave.descripcion}</td>
                          <td>
                            <button 
                              type="button"
                              className="rp-btn-restaurar"
                              onClick={() => manejarRestauracion(llave)}
                            >
                              <span className="material-symbols-outlined">settings_backup_restore</span> Restaurar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            <div className="rp-acciones-navegacion">
              <Link to="/panel-ordenanza" className="rp-btn-volver">
                <span className="material-symbols-outlined">arrow_back</span>
                Volver
              </Link>
            </div>
          </div>
        </div>
      </main>
    </LayoutOrdenanza>
  );
};

export default RegistrarPerdida;
