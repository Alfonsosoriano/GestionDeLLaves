/*
PARA QUÉ SIRVE: Muestra el historial completo de movimientos
  (entregas, devoluciones, pérdidas, restauraciones) con
  filtros por texto, fecha y estado. Al pulsar una fila se
  abre un panel lateral con el detalle del movimiento.
  Funciona tanto para administradores como para ordenanzas.
CUÁNDO SE EJECUTA: Al navegar a /historial.
FUNCIONES PRINCIPALES:
  · cargarLlaves()          → carga el inventario de llaves (para filtros)
  · cargarMovimientos()     → carga todos los movimientos del servidor
  · abrirDetalle()          → abre el panel lateral con el detalle
  · cerrarDetalle()         → cierra el panel lateral
  · movimientosFiltrados    → lista filtrada por búsqueda, fechas y estado (useMemo)
  · metricas                → contadores de totales por tipo (useMemo)
*/
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import api from '../../servicios/api';
import { useNavigate } from 'react-router-dom';
import LayoutAdministrador from '../../componentes/layouts/layout_administrador';
import LayoutOrdenanza from '../../componentes/layouts/layout_ordenanza';
import BtnVolver from '../../componentes/ui/BtnVolver';
import { normalizarTexto } from '../../utils/normalizar_texto';
import './HistorialMovimientos.scss';

const HistorialMovimientos = () => {
  const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual') || '{}');
  const esAdministrador = usuarioActual.rol === 'administrador';
  const PlantillaPagina = esAdministrador ? LayoutAdministrador : LayoutOrdenanza;
  const navegar = useNavigate();
  const hoyTexto = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  // Estados de datos
  const [llaves, setLlaves] = useState([]);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);


  // Estados de filtros
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('Todos');

  // Estado para el Drawer
  const [movimientoSeleccionado, setMovimientoSeleccionado] = useState(null);
  const [estaDetalleAbierto, setEstaDetalleAbierto] = useState(false);

  // Cargar llaves para el sidebar
  const cargarLlaves = useCallback(async () => {
    try {
      const response = await api.get('/api/llaves');
      setLlaves(response.data || []);
    } catch (error) {
      console.error("Error al cargar llaves:", error);
    }
  }, []);

  // Cargar movimientos
  const cargarMovimientos = useCallback(async () => {
    setCargando(true);
    try {
      const response = await api.get('/api/historial', { params: { limit: 100 } });
      setMovimientos(response.data.data || []);
    } catch (error) {
      console.error("Error al cargar movimientos:", error);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarLlaves();
    cargarMovimientos();
  }, [cargarLlaves, cargarMovimientos]);



  // Filtrado de movimientos en tabla
  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter(m => {
      const objetoLlave = llaves.find(k => k.id === m.llaveId || k.descripcion === m.llave);
      const busquedaMinusculas = normalizarTexto(terminoBusqueda);
      const coincideBusqueda = terminoBusqueda ? (
        normalizarTexto(m.usuario).includes(busquedaMinusculas) ||
        normalizarTexto(m.ordenanza).includes(busquedaMinusculas) ||
        normalizarTexto(m.ordenanzaDevolucion).includes(busquedaMinusculas) ||
        normalizarTexto(m.llave).includes(busquedaMinusculas) ||
        (objetoLlave && normalizarTexto(objetoLlave.codigoBarras || objetoLlave.codigo_barras).includes(busquedaMinusculas))
      ) : true;
      const estadoElemento = m.accion === 'perdida' ? 'perdida' : 
                         (m.accion === 'restauracion' ? 'restaurada' : 
                         (m.fechaDevolucion ? 'devuelta' : 'entregada'));

      const coincideEstado = filtroEstado === 'Todos' ? true : (
        filtroEstado.toLowerCase() === estadoElemento
      );

      // Filtros de fecha
      let coincideFecha = true;
      if (fechaDesde || fechaHasta) {
        const fechaMovimiento = new Date(m.fechaHora.split(' ')[0].split('/').reverse().join('-'));
        if (fechaDesde && fechaMovimiento < new Date(fechaDesde)) coincideFecha = false;
        if (fechaHasta && fechaMovimiento > new Date(fechaHasta)) coincideFecha = false;
      }

      return coincideBusqueda && coincideEstado && coincideFecha;
    });
  }, [movimientos, terminoBusqueda, filtroEstado, fechaDesde, fechaHasta, llaves]);

  // Métricas
  const metricas = useMemo(() => {
    const contadores = { total: movimientosFiltrados.length, entregadas: 0, devueltas: 0, perdidas: 0, restauradas: 0 };
    movimientosFiltrados.forEach(m => {
      if (m.accion === 'perdida') contadores.perdidas++;
      else if (m.accion === 'restauracion') contadores.restauradas++;
      else if (m.fechaDevolucion) contadores.devueltas++;
      else contadores.entregadas++;
    });
    return contadores;
  }, [movimientosFiltrados]);

  const abrirDetalle = (movimiento) => {
    setMovimientoSeleccionado(movimiento);
    setEstaDetalleAbierto(true);
  };

  const cerrarDetalle = () => {
    setEstaDetalleAbierto(false);
    setTimeout(() => setMovimientoSeleccionado(null), 300);
  };



  return (
    <PlantillaPagina titulo="Historial de Movimientos">
      <div className="pagina-historial">



        {/* ÁREA PRINCIPAL */}
        <main className="area-principal">
          <header className="cabecera-principal">
            <div className="titulo-cabeceras">
              <h1>Historial de Movimientos</h1>
              <p>{metricas.total} movimientos registrados</p>
            </div>
          </header>

          {/* FILTROS */}
          <div className="contenedor-filtros">
            <div className="grupo-filtro envoltorio-busqueda">
              <label>Buscador</label>
              <span className="material-symbols-outlined">search</span>
              <input
                type="text"
                placeholder="Profesor, llave, código..."
                value={terminoBusqueda}
                onChange={(e) => setTerminoBusqueda(e.target.value)}
              />
            </div>

            <div className="grupo-filtro" style={{ flex: '0 0 160px' }}>
              <label>Desde</label>
              <input type="date" value={fechaDesde} onChange={(e) => setFechaDesde(e.target.value)} />
            </div>

            <div className="grupo-filtro" style={{ flex: '0 0 160px' }}>
              <label>Hasta</label>
              <input type="date" value={fechaHasta} onChange={(e) => setFechaHasta(e.target.value)} />
            </div>

            <div className="grupo-filtro" style={{ flex: '0 0 150px' }}>
              <label>Estado</label>
              <select value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
                <option>Todos</option>
                <option>Entregada</option>
                <option>Devuelta</option>
                <option>Perdida</option>
                <option>Restaurada</option>
              </select>
            </div>
          </div>

          {/* TABLA */}
          <div className="tarjeta-tabla">
            <div className="cabecera-tabla">
              <h2>Registro de Movimientos</h2>
              <div className="texto-atenuado texto-pequeno font-bold">
                {movimientosFiltrados.length} movimientos encontrados
              </div>
            </div>

            <div className="contenedor-tabla">
              <table className="tabla-historial">
                <thead>
                  <tr>
                    <th>Entrega</th>
                    <th>Profesor / Alumno</th>
                    <th>Llave</th>
                    <th>Ordenanza Entrega</th>
                    <th>Devolución</th>
                    <th>Ordenanza Devolución</th>
                    <th>Estado</th>
                  </tr>
                </thead>
              <tbody>
                {cargando ? (
                  <tr><td colSpan="7" className="texto-centrado py-5">Cargando...</td></tr>
                ) : movimientosFiltrados.length === 0 ? (
                  <tr><td colSpan="7" className="texto-centrado py-5">No hay movimientos</td></tr>
                ) : (
                  movimientosFiltrados.map(m => {
                    const isOldPending = !m.fechaDevolucion && m.accion === 'entrega' && m.fechaHora.split(' ')[0] !== hoyTexto;
                    
                    return (
                      <tr key={m.id} onClick={() => abrirDetalle(m)} className={`fila-clickeable ${isOldPending ? 'fila-vencida' : ''}`}>
                        <td>
                          <div className="celda-fecha">
                            {m.fechaHora}
                            {isOldPending && (
                              <span className="material-symbols-outlined icono-vencido" titulo="¡PENDIENTE DE DÍAS ANTERIORES!">
                                warning
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="font-bold">{m.usuario}</td>
                        <td>
                          <span className="etiqueta-llave">{m.llave}</span>
                        </td>
                        <td className="texto-atenuado">{m.ordenanza || '-'}</td>
                        <td className={m.fechaDevolucion ? "" : "italic texto-atenuado"}>
                          {m.fechaDevolucion || 'Pendiente'}
                        </td>
                        <td className="texto-atenuado">{m.fechaDevolucion ? (m.ordenanzaDevolucion || '-') : '-'}</td>
                        <td>
                          <span className={`etiqueta-estado ${
                            m.accion === 'perdida' ? 'red' : 
                            (m.accion === 'restauracion' ? 'purple' : 
                            (m.fechaDevolucion ? 'green' : 'blue'))
                          }`}>
                            {m.accion === 'perdida' ? 'Perdida' : 
                             (m.accion === 'restauracion' ? 'Restaurada' : 
                             (m.fechaDevolucion ? 'Devuelta' : 'Entregada'))}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <BtnVolver
          onClick={() => esAdministrador ? navegar('/panel-administracion') : navegar('/panel-ordenanza')}
        />
        </main>

        {/* DRAWER DE DETALLE */}
        <div className={`fondo-panel-lateral ${estaDetalleAbierto ? 'open' : ''}`} onClick={cerrarDetalle}>
          <div className="panel-lateral" onClick={e => e.stopPropagation()}>
            {movimientoSeleccionado && (
              <>
                <header className="cabecera-panel">
                  <div className="parte-superior-cabecera">
                    <div className="icono-llave-grande">
                      <span className="material-symbols-outlined">vpn_key</span>
                    </div>
                    <button className="btn-cerrar" onClick={cerrarDetalle}>
                      <span className="material-symbols-outlined">close</span>
                    </button>
                  </div>
                  <h2>{movimientoSeleccionado.llave}</h2>
                </header>

                <div className="cuerpo-panel">
                  <section className="seccion-info">
                    <h3>Información del movimiento</h3>
                    <div className="cuadricula-info">
                      <div className="elemento-info">
                        <label>{(movimientoSeleccionado.accion === 'perdida' || movimientoSeleccionado.accion === 'restauracion') && !movimientoSeleccionado.ordenanza ? 'Responsable' : 'Profesor / Alumno'}</label>
                        <span>{movimientoSeleccionado.usuario}</span>
                      </div>

                      {movimientoSeleccionado.ordenanza && (
                        <div className="elemento-info">
                          <label>Ordenanza Entrega</label>
                          <span>{movimientoSeleccionado.ordenanza}</span>
                        </div>
                      )}

                      <div className="elemento-info">
                        <label>{(movimientoSeleccionado.accion === 'perdida' || movimientoSeleccionado.accion === 'restauracion') ? 'Fecha Acción' : 'Fecha Entrega'}</label>
                        <span>{movimientoSeleccionado.fechaHora}</span>
                      </div>

                      {movimientoSeleccionado.fechaDevolucion && (
                        <>
                          <div className="elemento-info">
                            <label>{movimientoSeleccionado.accion === 'perdida' ? 'Registrado por (Pérdida)' : (movimientoSeleccionado.accion === 'restauracion' ? 'Restaurado por' : 'Ordenanza Devolución')}</label>
                            <span>{movimientoSeleccionado.ordenanzaDevolucion || '-'}</span>
                          </div>
                          <div className="elemento-info">
                            <label>{movimientoSeleccionado.accion === 'perdida' ? 'Fecha de Pérdida' : (movimientoSeleccionado.accion === 'restauracion' ? 'Fecha de Restauración' : 'Fecha Devolución')}</label>
                            <span>{movimientoSeleccionado.fechaDevolucion}</span>
                          </div>
                        </>
                      )}

                      {!movimientoSeleccionado.fechaDevolucion && (
                        <div className="elemento-info">
                          <label>Estado actual</label>
                          <span className="italic texto-atenuado">Pendiente de devolución</span>
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="seccion-cronologia">
                    <h3>Historial de estados</h3>
                    <div className="cronologia">
                      {/* Estado Actual (Más reciente) */}
                      <div className="elemento-cronologia active">
                        <div className="marcador-cronologia">
                          <span className="material-symbols-outlined">
                            {movimientoSeleccionado.accion === 'perdida' ? 'report' : (movimientoSeleccionado.fechaDevolucion ? 'check_circle' : 'pending')}
                          </span>
                        </div>
                        <div className="contenido-cronologia">
                          <span className="nombre-estado">
                            {movimientoSeleccionado.accion === 'perdida' ? 'Perdida' : (movimientoSeleccionado.accion === 'restauracion' ? 'Restaurada' : (movimientoSeleccionado.fechaDevolucion ? 'Devuelta' : 'Entregada'))}
                          </span>
                          <span className="fecha">{movimientoSeleccionado.fechaDevolucion || movimientoSeleccionado.fechaHora}</span>
                          <span className="responsable">Responsable: {
                            movimientoSeleccionado.accion === 'perdida' || movimientoSeleccionado.accion === 'restauracion'
                              ? (movimientoSeleccionado.ordenanzaDevolucion || movimientoSeleccionado.usuario)
                              : (movimientoSeleccionado.fechaDevolucion ? (movimientoSeleccionado.ordenanzaDevolucion || movimientoSeleccionado.ordenanza) : movimientoSeleccionado.ordenanza)
                          }</span>
                        </div>
                      </div>

                      {/* Estado Inicial (Entrega) solo si hubo entrega real */}
                      {movimientoSeleccionado.ordenanza && (
                        <div className="elemento-cronologia">
                          <div className="marcador-cronologia">
                            <span className="material-symbols-outlined">vpn_key</span>
                          </div>
                          <div className="contenido-cronologia">
                            <span className="nombre-estado">Entregada</span>
                            <span className="fecha">{movimientoSeleccionado.fechaHora}</span>
                            <span className="responsable">Responsable: {movimientoSeleccionado.ordenanza}</span>
                          </div>
                        </div>
                      )}

                      <div className="elemento-cronologia available">
                        <div className="marcador-cronologia">
                          <span className="material-symbols-outlined">meeting_room</span>
                        </div>
                        <div className="contenido-cronologia">
                          <span className="nombre-estado">Disponible</span>
                          <span className="responsable">Llave en el centro</span>
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </PlantillaPagina>
  );
};

export default HistorialMovimientos;
