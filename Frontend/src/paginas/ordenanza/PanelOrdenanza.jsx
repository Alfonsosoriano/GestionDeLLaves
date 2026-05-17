/*
PARA QUÉ SIRVE: Pantalla principal del ordenanza. Muestra los
  accesos rápidos a las acciones del día (entregar, devolver,
  pérdidas, inventario) y la tabla de movimientos de hoy.
CUÁNDO SE EJECUTA: Al navegar a /panel-ordenanza tras iniciar sesión.
FUNCIONES PRINCIPALES:
  · cargarMovimientosDeHoy() → carga los movimientos del día actual
  · cerrarSesion()           → borra la sesión y redirige al login
*/
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../servicios/api';
import LayoutOrdenanza from '../../componentes/layouts/layout_ordenanza';
import './PanelOrdenanza.scss';

const PanelOrdenanza = () => {
  const navegar = useNavigate();
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const hoyTexto = new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  useEffect(() => {
    const cargarMovimientosHoy = async () => {
      try {
        const response = await api.get('/api/historial?hoy=true');
        if (response.data && response.data.data) {
          const filtrados = response.data.data.filter(
            m => m.accion !== 'perdida' && m.accion !== 'restauracion'
          );
          setMovimientos(filtrados);
        } else {
          setMovimientos([]);
        }
      } catch (error) {
        console.error("Error al cargar los movimientos del día: ", error);
      } finally {
        setCargando(false);
      }
    };
    cargarMovimientosHoy();
  }, []);

  const cerrarSesion = () => {
    localStorage.removeItem('usuarioActual');
    navegar('/login');
  };

  return (
    <LayoutOrdenanza titulo="Panel de Ordenanza">
      {/* // TARJETAS DE ACCION RAPIDA */}
      <div className="cuadricula-panel-ordenanza">
        {/* Tarjeta 1: Registrar Entrega */}
        <Link to="/registro-llave" className="tarjeta-accion tarjeta-entrega">
          <span className="material-symbols-outlined icono-fondo-accion">vpn_key</span>
          <div className="envoltorio-icono-accion">
            <span className="material-symbols-outlined icono-accion">vpn_key</span>
          </div>
          <span className="texto-accion">Registrar Entrega</span>
        </Link>

        {/* Tarjeta 2: Registrar Devolución */}
        <Link to="/devolucion-llave" className="tarjeta-accion tarjeta-devolucion">
          <span className="material-symbols-outlined icono-fondo-accion">key_off</span>
          <div className="envoltorio-icono-accion">
            <span className="material-symbols-outlined icono-accion">key_off</span>
          </div>
          <span className="texto-accion">Registrar Devolución</span>
        </Link>

        {/* Tarjeta 3: Registrar Pérdida */}
        <Link to="/registrar-perdida" className="tarjeta-accion tarjeta-perdida">
          <span className="material-symbols-outlined icono-fondo-accion">report_problem</span>
          <div className="envoltorio-icono-accion">
            <span className="material-symbols-outlined icono-accion">report_problem</span>
          </div>
          <span className="texto-accion">Registrar Pérdida</span>
        </Link>

        {/* Tarjeta 4: Inventario de Llaves */}
        <Link to="/inventario-llaves" className="tarjeta-accion tarjeta-inventario">
          <span className="material-symbols-outlined icono-fondo-accion">inventory_2</span>
          <div className="envoltorio-icono-accion">
            <span className="material-symbols-outlined icono-accion">inventory_2</span>
          </div>
          <span className="texto-accion">Inventario de Llaves</span>
        </Link>
      </div>

      {/* // TABLA DE ULTIMOS MOVIMIENTOS */}
      <section className="seccion-tabla-ordenanza">
        <div className="cabecera-tabla-ordenanza">
          <h2>Últimos movimientos (Hoy)</h2>
        </div>
        <div className="contenedor-tabla-ordenanza">
          <table className="tabla-ordenanza">
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
                <tr>
                  <td colSpan="7" className="po-empty-message">Cargando movimientos...</td>
                </tr>
              ) : movimientos.length === 0 ? (
                <tr>
                  <td colSpan="7" className="po-empty-message">No hay movimientos hoy.</td>
                </tr>
              ) : (
                movimientos.map((movimiento, idx) => {
                  const isOldPending = movimiento.estado === 'entregada' && movimiento.fecha !== hoyTexto;

                  {/* // FILAS DE LA TABLA */}
                  return (
                    <tr key={movimiento.id || idx} className={isOldPending ? 'fila-alerta' : ''}>
                      <td>
                        <div className="po-celda-fecha">
                          {movimiento.fechaHora}
                          {isOldPending && (
                            <span className="material-symbols-outlined icono-vencido" titulo="¡PENDIENTE DE DÍAS ANTERIORES!">
                              warning
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="celda-usuario">{movimiento.usuario}</td>
                      <td>
                        <span className="po-etiqueta-llave">{movimiento.llave}</span>
                      </td>
                      <td className="celda-atenuada">{movimiento.ordenanza || '-'}</td>
                      <td className={movimiento.fechaDevolucion ? 'celda-fecha-devuelta' : 'celda-fecha-pendiente'}>
                        {movimiento.fechaDevolucion || 'Pendiente'}
                      </td>
                      <td className="celda-atenuada">
                        {movimiento.fechaDevolucion ? (movimiento.ordenanzaDevolucion || '-') : '-'}
                      </td>
                      <td>
                        <span className={`etiqueta-estado-ordenanza ${movimiento.accion === 'perdida' ? 'perdida' : (movimiento.accion === 'restauracion' ? 'restauracion' : (movimiento.fechaDevolucion ? 'devolucion' : 'entrega'))}`}>
                          {movimiento.accion === 'perdida' ? 'Perdida' : (movimiento.accion === 'restauracion' ? 'Restaurada' : (movimiento.fechaDevolucion ? 'Devuelta' : 'Entregada'))}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        {/* // PAGINACION / BOTON VER TODO */}
        <div className="pie-tabla-ordenanza">
          <button className="btn-enlace" onClick={() => navegar('/historial')}>Ver todo el historial</button>
        </div>
      </section>

      
    </LayoutOrdenanza>
  );
};

export default PanelOrdenanza;
