/*
PARA QUÉ SIRVE: Inventario visual de todas las llaves del
  centro. Muestra tarjetas por cada llave y al pulsar
  'Vista Previa' abre un modal con el código de barras
  listo para imprimir.
  Funciona tanto para administradores como para ordenanzas.
CUÁNDO SE EJECUTA: Al navegar a /inventario-llaves.
FUNCIONES PRINCIPALES:
  · cargarLlaves()        → obtiene todas las llaves del servidor
  · imprimirVentana()     → abre una ventana emergente con el código de barras para imprimir
*/
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useNotificaciones } from '../../contexto/contexto_notificaciones';
import { useConfiguracion } from '../../contexto/contexto_configuracion';
import LayoutAdministrador from '../../componentes/layouts/layout_administrador';
import LayoutOrdenanza from '../../componentes/layouts/layout_ordenanza';
import BtnVolver from '../../componentes/ui/BtnVolver';
import Barcode from 'react-barcode';
import api from '../../servicios/api';
import { imprimirCodigo } from '../../utils/imprimirCodigo';
import { normalizarTexto } from '../../utils/normalizar_texto';
import './ListadoLlaves.scss';

const ListadoLlaves = () => {
  const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual') || '{}');
  const esAdministrador = usuarioActual.rol === 'administrador';
  const PlantillaPagina = esAdministrador ? LayoutAdministrador : LayoutOrdenanza;
  const { mostrarNotificacion } = useNotificaciones();
  const { tamanoCodigoBarras } = useConfiguracion();
  const ubicacion = useLocation();
  const navegar = useNavigate();

  const [llaves, setLlaves] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [llaveSeleccionada, setLlaveSeleccionada] = useState(null);
  const referenciaImpresion = useRef();

  const cargarLlaves = useCallback(async () => {
    setCargando(true);
    try {
      const response = await api.get('/api/llaves');
      setLlaves(response.data || []);
    } catch (err) {
      console.error('Error al cargar llaves:', err);
      mostrarNotificacion('Error', 'No se pudieron cargar las llaves.', 'error');
    } finally {
      setCargando(false);
    }
  }, [mostrarNotificacion]);

  useEffect(() => {
    cargarLlaves();
  }, [cargarLlaves]);

  // Manejar apertura automática por parámetro 'open'
  useEffect(() => {
    const parametrosBusqueda = new URLSearchParams(ubicacion.search);
    const llaveParaAbrir = parametrosBusqueda.get('open');
    
    if (llaveParaAbrir && llaves.length > 0) {
      const llave = llaves.find(k => String(k.id) === String(llaveParaAbrir));
      if (llave) {
        setLlaveSeleccionada(llave);
      }
    }
  }, [ubicacion.search, llaves]);

  const llavesFiltradas = llaves.filter(k => 
    normalizarTexto(k.descripcion).includes(normalizarTexto(busqueda)) ||
    (k.codigo_barras && normalizarTexto(k.codigo_barras).includes(normalizarTexto(busqueda)))
  );

  const imprimirVentana = () => {
    if (!llaveSeleccionada) return;
    imprimirCodigo(llaveSeleccionada.codigo_barras, llaveSeleccionada.descripcion, tamanoCodigoBarras);
  };

  return (
    <PlantillaPagina titulo="Inventario de Llaves">
      <div className="lk-container">
        <header className="cabecera-inventario">
          <div className="caja-busqueda-inventario">
            <span className="material-symbols-outlined">search</span>
            <input 
              type="text" 
              placeholder="Buscar por nombre o código..." 
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div className="info-inventario">
            <span className="lk-count">{llavesFiltradas.length} llaves encontradas</span>
          </div>
        </header>

        <div className="cuadricula-llaves">
          {cargando ? (
            <div className="lk-loading">Cargando llaves...</div>
          ) : llavesFiltradas.length === 0 ? (
            <div className="lk-empty">No se encontraron llaves</div>
          ) : (
            llavesFiltradas.map(llave => (
              <div key={llave.id} className="tarjeta-inventario">

                <div className="contenido-tarjeta-inventario">
                  <h3>{llave.descripcion}</h3>
                  <div className={`estado-inventario ${llave.estado?.toLowerCase() || llave.estado?.toLowerCase()}`}>
                    {llave.estado === 'disponible' ? 'Disponible' : (llave.estado === 'prestada' ? 'Prestada' : 'Perdida')}
                  </div>
                </div>
                <div className="acciones-tarjeta-inventario">
                  <button className="btn-vista-previa" onClick={() => setLlaveSeleccionada(llave)}>
                    <span className="material-symbols-outlined">visibility</span>
                    Vista Previa
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal de Vista Previa */}
        {llaveSeleccionada && (
          <div className="fondo-modal-inventario" onClick={() => setLlaveSeleccionada(null)}>
            <div className="lk-modal" onClick={e => e.stopPropagation()}>
              <header className="cabecera-modal-inventario">
                <h2>Vista Previa de Llave</h2>
                <button className="btn-cerrar" onClick={() => setLlaveSeleccionada(null)}>
                  <span className="material-symbols-outlined">close</span>
                </button>
              </header>

              <div className="cuerpo-modal-inventario" id="printable-area">
                <div className="info-vista-previa-inventario">
                  <div className="detalle-vista-previa-inventario">
                    <label>Descripción</label>
                    <span>{llaveSeleccionada.descripcion}</span>
                  </div>
                  <div className="detalle-vista-previa-inventario">
                    <label>Estado Actual</label>
                    <span className={`texto-estado ${llaveSeleccionada.estado?.toLowerCase()}`}>
                      {llaveSeleccionada.estado === 'disponible' ? 'Disponible' : (llaveSeleccionada.estado === 'prestada' ? 'Prestada' : 'Perdida')}
                    </span>
                  </div>
                </div>

                <div className="contenedor-codigo-inventario" id="barcode-to-print">
                  <div className="etiqueta-codigo-inventario">CÓDIGO DE BARRAS</div>
                  <div className="envoltorio-codigo-inventario">
                    <Barcode 
                      value={llaveSeleccionada.codigo_barras || 'NO-CODE'} 
                      width={2}
                      height={80}
                      fontSize={14}
                      background="#ffffff"
                    />
                  </div>
                  <p className="subtexto-codigo-inventario">Escanee este código para registrar movimientos</p>
                </div>
              </div>

              <footer className="pie-modal-inventario">
                <button className="btn-secundario" onClick={() => setLlaveSeleccionada(null)}>Cerrar</button>
                <button className="btn-imprimir" onClick={imprimirVentana}>
                  <span className="material-symbols-outlined">print</span>
                  Imprimir Código
                </button>
              </footer>
            </div>
          </div>
        )}
        <BtnVolver
          onClick={() => esAdministrador ? navegar('/panel-administracion') : navegar('/panel-ordenanza')}
          texto="Volver al Panel"
        />
      </div>

    </PlantillaPagina>
  );
};

export default ListadoLlaves;
