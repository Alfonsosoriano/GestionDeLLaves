/*
FICHERO: paginas/administracion/gestionLlave/GestionLlaves.jsx
PARA QUÉ SIRVE: Listado de todas las llaves con filtros,
  paginación y acciones de editar, eliminar e imprimir código.
CUÁNDO SE EJECUTA: Al navegar a /gestion-llaves.
FUNCIONES PRINCIPALES:
  · cargarLlaves()          → obtiene todas las llaves del servidor
  · manejarBusqueda()       → actualiza el filtro de texto
  · manejarFiltroEstado()   → actualiza el filtro de estado
  · limpiarFiltros()        → borra todos los filtros activos
  · abrirFormularioNuevo()  → navega al formulario de nueva llave
  · abrirEdicion()          → navega al formulario de edición
  · confirmarEliminacion()  → borra la llave seleccionada del servidor
  · imprimirCodigo()        → abre ventana de impresión del código de barras
  · obtenerClaseChip()      → devuelve la clase CSS según el estado
  · obtenerEtiquetaChip()   → devuelve el texto legible del estado
*/
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificaciones } from '../../../contexto/contexto_notificaciones';
import LayoutAdministrador from '../../../componentes/layouts/layout_administrador';
import KpiCard from '../../../componentes/ui/KpiCard';
import ModalConfirmacion from '../../../componentes/ui/ModalConfirmacion';
import BtnVolver from '../../../componentes/ui/BtnVolver';
import { imprimirCodigo } from '../../../utils/imprimirCodigo';
import './GestionLlaves.scss';
import { obtenerLlaves, eliminarLlave } from '../../../servicios/servicioLlaves';
import { useConfiguracion } from '../../../contexto/contexto_configuracion';
import { normalizarTexto } from '../../../utils/normalizar_texto';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const obtenerClaseChip = (estado) => {
  if (!estado) return '';
  const e = estado.toLowerCase();
  if (e === 'disponible') return 'disponible';
  if (e === 'en_uso' || e === 'en uso' || e === 'prestada') return 'en-uso';
  if (e === 'perdida') return 'perdida';
  return '';
};

const obtenerEtiquetaChip = (estado) => {
  if (!estado) return '';
  const e = estado.toLowerCase();
  if (e === 'disponible') return 'Disponible';
  if (e === 'en_uso' || e === 'en uso' || e === 'prestada') return 'Prestada';
  if (e === 'perdida') return 'Perdida';
  return estado;
};

const ELEMENTOS_POR_PAGINA = 8;


// ─── Componente Principal ─────────────────────────────────────────────────────

const GestionLlaves = () => {
  const navegar = useNavigate();
  const { mostrarNotificacion } = useNotificaciones();
  const { tamanoCodigoBarras } = useConfiguracion();

  // ── Estado de datos ──
  const [llaves, setLlaves] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  // ── Estado de filtros ──
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  // ── Paginación ──
  const [pagina, setPagina] = useState(1);

  // ── Modales ──
  const [llaveAEliminar, setLlaveAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  // ── Carga inicial ──
  const cargarLlaves = useCallback(async () => {
    setCargando(true);
    setError('');
    try {
      const datos = await obtenerLlaves();
      setLlaves(Array.isArray(datos) ? datos : datos?.data ?? []);
    } catch (err) {
      console.error('ERROR AL CARGAR LLAVES:', err);
      setError('No se pudo conectar con el servidor. Comprueba que el backend esté activo.');
      // Datos de prueba en caso de error
      setLlaves([
        { id: '550e8400-e29b-41d4-a716-446655440001', codigo_barras: 'LLV-001', descripcion: 'Aula 101 - Informática', estado: 'disponible' },
        { id: '550e8400-e29b-41d4-a716-446655440002', codigo_barras: 'LLV-002', descripcion: 'Aula 102 - Taller', estado: 'prestada' },
        { id: '550e8400-e29b-41d4-a716-446655440003', codigo_barras: 'LLV-003', descripcion: 'Sala de Profesores', estado: 'disponible' },
        { id: '550e8400-e29b-41d4-a716-446655440004', codigo_barras: 'LLV-004', descripcion: 'Dirección', estado: 'reservada' },
        { id: '550e8400-e29b-41d4-a716-446655440005', codigo_barras: 'LLV-005', descripcion: 'Secretaría', estado: 'disponible' },
        { id: '550e8400-e29b-41d4-a716-446655440006', codigo_barras: 'LLV-006', descripcion: 'Biblioteca', estado: 'prestada' },
      ]);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargarLlaves(); }, [cargarLlaves]);

  // ── Filtrado ──
  const llavesFiltradas = llaves.filter((l) => {
    const termino = normalizarTexto(busqueda);
    
    const coincideBusqueda =
      !termino ||
      normalizarTexto(l.id).includes(termino) ||
      normalizarTexto(l.codigo_barras).includes(termino) ||
      normalizarTexto(l.descripcion).includes(termino);

    let estadoNormalizado = (l.estado || '').toLowerCase().replace(' ', '_');
    if (estadoNormalizado === 'en_uso') estadoNormalizado = 'prestada';

    const coincideEstado =
      !filtroEstado ||
      estadoNormalizado === filtroEstado.toLowerCase();

    return coincideBusqueda && coincideEstado;
  });

  // ── Estadísticas ──
  const estadisticas = {
    total: llaves.length,
    disponible: llaves.filter((l) => l.estado?.toLowerCase() === 'disponible').length,
    prestada: llaves.filter((l) => ['en_uso', 'en uso', 'prestada'].includes(l.estado?.toLowerCase())).length,
    perdida: llaves.filter((l) => l.estado?.toLowerCase() === 'perdida').length,
  };

  // ── Paginación ──
  const totalPaginas = Math.max(1, Math.ceil(llavesFiltradas.length / ELEMENTOS_POR_PAGINA));
  const llavesPaginadas = llavesFiltradas.slice((pagina - 1) * ELEMENTOS_POR_PAGINA, pagina * ELEMENTOS_POR_PAGINA);

  const manejarBusqueda = (e) => { setBusqueda(e.target.value); setPagina(1); };
  const manejarFiltroEstado = (e) => { setFiltroEstado(e.target.value); setPagina(1); };
  const limpiarFiltros = () => { setBusqueda(''); setFiltroEstado(''); setPagina(1); };

  // ── CRUD handlers ──
  const abrirFormularioNuevo = () => navegar('/gestion-llaves/nueva');
  const abrirEdicion = (llave) => navegar(`/gestion-llaves/editar/${llave.id}`);

  const confirmarEliminacion = async () => {
    if (!llaveAEliminar) return;
    
    if (String(llaveAEliminar.id).startsWith('550e8400')) {
      setLlaves(llaves.filter(l => l.id !== llaveAEliminar.id));
      setLlaveAEliminar(null);
      return;
    }

    setEliminando(true);
    try {
      await eliminarLlave(llaveAEliminar.id);
      mostrarNotificacion('¡Eliminada!', 'La llave ha sido borrada correctamente.', 'success');
      setLlaveAEliminar(null);
      cargarLlaves();
    } catch (err) {
      console.error('Error al eliminar:', err);
      mostrarNotificacion('Error', 'No se pudo eliminar la llave del servidor. Puede que tenga registros asociados.', 'error');
    } finally {
      setEliminando(false);
    }
  };

  const abrirModalImpresion = (llave) => {
    imprimirCodigo(llave.codigo_barras, llave.descripcion, tamanoCodigoBarras);
  };

  // ── Render ──
  return (
    <LayoutAdministrador titulo="Gestión de Llaves">
      <div className="cabecera-pagina flex-between">
        <div>
          <h1>Gestión de Llaves</h1>
          <p>Control del inventario y estado de las llaves del centro</p>
        </div>
        <button className="btn-primario" onClick={abrirFormularioNuevo}>
          <span className="material-symbols-outlined">add</span>
          Nueva Llave
        </button>
      </div>

      {/* Estadísticas */}
      <div className="cuadricula-kpi">
        <KpiCard variante="purple" icono="key" label="Total Llaves" valor={estadisticas.total} />
        <KpiCard variante="success" icono="inventory_2" label="Disponibles" valor={estadisticas.disponible} />
        <KpiCard variante="primary" icono="vpn_key" label="Prestadas" valor={estadisticas.prestada} />
        <KpiCard variante="danger" icono="warning" label="Perdidas" valor={estadisticas.perdida} />
      </div>

      {/* Filtros */}
      <div className="contenedor-filtros">
        <div className="grupo-filtro envoltorio-busqueda">
          <label htmlFor="busqueda-llaves">Búsqueda</label>
          <span className="material-symbols-outlined">search</span>
          <input
            id="busqueda-llaves"
            type="text"
            placeholder="Código o descripción…"
            value={busqueda}
            onChange={manejarBusqueda}
          />
        </div>

        <div className="grupo-filtro" style={{ flex: '0 0 170px' }}>
          <label htmlFor="filtro-estado">Estado</label>
          <select id="filtro-estado" value={filtroEstado} onChange={manejarFiltroEstado}>
            <option value="">Todos</option>
            <option value="disponible">Disponible</option>
            <option value="prestada">Prestada</option>
            <option value="perdida">Perdida</option>
          </select>
        </div>

        <button className="btn-limpiar" onClick={limpiarFiltros}>
          <span className="material-symbols-outlined">filter_alt_off</span>
          Limpiar
        </button>
      </div>

      {/* Tabla */}
      <div className="tarjeta-tabla">
        <div className="cabecera-tabla">
          <h2>Listado de Llaves</h2>
          <div className="info-pagina">
            {llavesFiltradas.length} llaves registradas
          </div>
        </div>

        {cargando ? (
          <div className="estado-cargando">
            <span className="material-symbols-outlined">sync</span>
            Cargando llaves…
          </div>
        ) : llavesPaginadas.length === 0 ? (
          <div className="estado-vacio">
            <span className="material-symbols-outlined">key_off</span>
            <p>No se encontraron llaves con los filtros aplicados.</p>
          </div>
        ) : (
          <>
            <div className="contenedor-tabla">
            <table>
              <thead>
                <tr>
                  <th>Descripción / Nombre</th>
                  <th>Código de Barras</th>
                  <th>Estado</th>
                  <th className="texto-derecha">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {llavesPaginadas.map((llave) => (
                  <tr key={llave.id}>
                    <td>
                      <div className="negrita">{llave.descripcion}</div>
                    </td>
                    <td>
                      <div className="etiqueta-codigo-barras">
                        <span className="material-symbols-outlined icono-pequeno">barcode</span>
                        {llave.codigo_barras}
                      </div>
                    </td>
                    <td>
                      <span className={`etiqueta-estado ${
                        llave.estado === 'disponible' ? 'green' : 
                        llave.estado === 'prestada' ? 'blue' : 'red'
                      }`}>
                        {obtenerEtiquetaChip(llave.estado)}
                      </span>
                    </td>
                    <td>
                        <div className="celda-acciones">
                          <button
                            className="btn-imprimir"
                            titulo="Imprimir Código"
                            onClick={() => abrirModalImpresion(llave)}
                          >
                            <span className="material-symbols-outlined">print</span>
                          </button>
                          <button
                            className="btn-editar"
                            titulo="Editar"
                            onClick={() => abrirEdicion(llave)}
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <button
                            className="btn-eliminar"
                            titulo="Eliminar"
                            onClick={() => setLlaveAEliminar(llave)}
                          >
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            <div className="paginacion">
              <span className="info-pagina">
                Página {pagina} de {totalPaginas} — {llavesFiltradas.length} resultados
              </span>
              <div className="botones-pagina">
                <button
                  className="boton-pagina"
                  onClick={() => setPagina((p) => p - 1)}
                  disabled={pagina === 1}
                >
                  <span className="material-symbols-outlined">chevron_left</span>
                  Anterior
                </button>
                <button
                  className="boton-pagina"
                  onClick={() => setPagina((p) => p + 1)}
                  disabled={pagina === totalPaginas}
                >
                  Siguiente
                  <span className="material-symbols-outlined">chevron_right</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>


      {/* Modal Confirmar Eliminar */}
      {llaveAEliminar && (
        <ModalConfirmacion
          titulo="Confirmar eliminación"
          texto={<>¿Seguro que quieres eliminar la llave <strong>{llaveAEliminar.descripcion}</strong>? Esta acción no se puede deshacer.</>}
          etiquetaConfirmar={eliminando ? 'Eliminando…' : 'Eliminar Llave'}
          cargando={eliminando}
          onConfirmar={confirmarEliminacion}
          onCancelar={() => setLlaveAEliminar(null)}
        />
      )}

      <BtnVolver ruta="/panel-administracion" />
    </LayoutAdministrador>
  );
};

export default GestionLlaves;
