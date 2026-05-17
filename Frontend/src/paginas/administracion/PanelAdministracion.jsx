/*
PARA QUÉ SIRVE: Pantalla principal del administrador. Muestra
  los indicadores clave (KPIs) del sistema: llaves prestadas,
  en stock, usuarios totales y llaves perdidas. También
  muestra la tabla de llaves pendientes de devolución.
CUÁNDO SE EJECUTA: Al navegar a /panel-administracion.
FUNCIONES PRINCIPALES:
  · cargarDatos()     → carga estadísticas e informes del servidor
  · formatearFecha()  → convierte una fecha del servidor a texto legible
*/
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LayoutAdministrador from '../../componentes/layouts/layout_administrador';
import KpiCard from '../../componentes/ui/KpiCard';
import { obtenerResumen, obtenerPendientes } from '../../servicios/servicioInformes';
import { obtenerUsuarios } from '../../servicios/servicioUsuarios';
import { obtenerLlaves } from '../../servicios/servicioLlaves';
import './PanelAdministracion.scss';

const PanelAdministracion = () => {
  const [estadisticas, setEstadisticas] = useState({
    usuarios: 0,
    llaves: 0,
    llavesPrestadas: 0,
    llavesDisponibles: 0,
    llavesPerdidas: 0
  });
  const [pendientes, setPendientes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const cargarDatos = async () => {
      try {
        setCargando(true);
        
        let datosResumen = {};
        let datosPendientes = [];
        
        try {
          const [responseResumen, responsePendientes] = await Promise.all([obtenerResumen(), obtenerPendientes()]);
          datosResumen = responseResumen.data?.data || responseResumen.data || {};
          datosPendientes = responsePendientes.data?.data || responsePendientes.data || [];
        } catch (e) {
          console.warn("Endpoints de informes no disponibles, usando fallback...");
        }

        // Retroceder si no hay datos
        if (!datosResumen.llaves || Object.keys(datosResumen).length === 0) {
          const [usuariosLista, llavesListaCompleta] = await Promise.all([obtenerUsuarios(), obtenerLlaves()]);
          
          const listaUsuarios = Array.isArray(usuariosLista) ? usuariosLista : (usuariosLista?.data || []);
          const listaLlaves = Array.isArray(llavesListaCompleta) ? llavesListaCompleta : (llavesListaCompleta?.data || []);
          
          datosResumen = {
            usuarios: listaUsuarios.length,
            llaves: listaLlaves.length,
            llavesPrestadas: listaLlaves.filter(l => l.estado === 'prestada').length,
            llavesDisponibles: listaLlaves.filter(l => l.estado === 'disponible').length,
            llavesPerdidas: listaLlaves.filter(l => l.estado === 'perdida').length
          };

          if (datosPendientes.length === 0) {
            datosPendientes = listaLlaves
              .filter(l => l.estado === 'prestada')
              .map(l => ({
                llave: { descripcion: l.descripcion },
                usuario: { nombre: 'En uso' },
                fechaEntrega: new Date().toISOString(),
                diasPendiente: 0
              }));
          }
        }
        
        setEstadisticas(datosResumen);
        setPendientes(datosPendientes);
      } catch (error) {
        console.error('Error crítico cargando datos del panel:', error);
      } finally {
        setCargando(false);
      }
    };

    cargarDatos();
  }, []);

  const formatearFecha = (cadenaFecha) => {
    if (!cadenaFecha) return '---';
    
    if (typeof cadenaFecha === 'object' && cadenaFecha.fecha) {
      cadenaFecha = cadenaFecha.fecha;
    }
    
    const fecha = new Date(cadenaFecha);
    if (isNaN(fecha.getTime())) return '---';
    
    return fecha.toLocaleString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <LayoutAdministrador titulo="Panel de Inicio">
      <div className="pagina-dashboard">
        <div className="cabecera-pagina">
          <h1>Panel de Inicio</h1>
          <p>Resumen del sistema y accesos rápidos</p>
        </div>

        {/* KPIs */}
        <div className="cuadricula-kpi">
          <KpiCard
            variante="primary"
            icono="key"
            label="Llaves Prestadas"
            valor={cargando ? '...' : estadisticas.llavesPrestadas}
          />
          <KpiCard
            variante="success"
            icono="inventory_2"
            label="Llaves en Stock"
            valor={cargando ? '...' : estadisticas.llavesDisponibles}
          />
          <KpiCard
            variante="purple"
            icono="group"
            label="Usuarios Totales"
            valor={cargando ? '...' : estadisticas.usuarios}
          />
          <KpiCard
            variante={estadisticas.llavesPerdidas > 0 ? 'danger' : 'success'}
            icono={estadisticas.llavesPerdidas > 0 ? 'priority_high' : 'check_circle'}
            label="Llaves Perdidas"
            valor={cargando ? '...' : estadisticas.llavesPerdidas}
          />
        </div>

        {/* Tarjeta con llaves pendientes */}
        <div className="cuadricula-diseno">
          <div className="tarjeta-tabla">
            <div className="cabecera-tabla">
              <h2>Llaves Pendientes de Devolución</h2>
              <Link to="/historial" style={{ color: 'var(--pa-secondary)', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>Ver Historial</Link>
            </div>
            
            <div className="contenedor-tabla">
              <table>
                <thead>
                  <tr>
                    <th>Llave</th>
                    <th>Usuario</th>
                    <th>Fecha de Entrega</th>
                    <th>Días Pendiente</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {cargando ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>Cargando datos...</td></tr>
                  ) : pendientes.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>No hay llaves prestadas actualmente.</td></tr>
                  ) : (
                    pendientes.map((p, idx) => (
                      <tr key={idx}>
                        <td className="columna-llave">
                          <span className="material-symbols-outlined">key</span>
                          {p.llave.descripcion}
                        </td>
                        <td>{p.usuario.nombre}</td>
                        <td className="columna-fecha">{formatearFecha(p.fechaEntrega)}</td>
                        <td>{p.diasPendiente} días</td>
                        <td>
                          <span className={`etiqueta-redonda ${p.diasPendiente > 0 ? 'error' : 'primary'}`}>
                            {p.diasPendiente > 0 ? 'Retraso' : 'En uso'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </LayoutAdministrador>
  );
};

export default PanelAdministracion;
