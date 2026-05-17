/*
FICHERO: paginas/administracion/gestionLlave/FormularioLlave.jsx
PARA QUÉ SIRVE: Formulario para crear o editar una llave.
  Según si hay :id en la URL entra en modo edición o creación.
  Muestra una vista previa en tiempo real con el código de barras.
CUÁNDO SE EJECUTA: Al navegar a /gestion-llaves/nueva
  o a /gestion-llaves/editar/:id.
FUNCIONES PRINCIPALES:
  · cargarDatosLlave()         → carga los datos de la llave a editar
  · manejarCambio()            → actualiza el estado del formulario al escribir
  · manejarEnvio()             → crea o actualiza la llave en el servidor
  · generarCodigoAleatorio()   → genera un código de barras aleatorio para llave nueva
  · imprimirDirectamente()     → abre ventana de impresión del código
*/
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CodigoBarras from '../../../componentes/ui/CodigoBarras';
import { obtenerLlavePorId, crearLlave, actualizarLlave, eliminarLlave } from '../../../servicios/servicioLlaves';
import LayoutAdministrador from '../../../componentes/layouts/layout_administrador';
import { useNotificaciones } from '../../../contexto/contexto_notificaciones';
import { useConfiguracion } from '../../../contexto/contexto_configuracion';
import { imprimirCodigo } from '../../../utils/imprimirCodigo';
import './FormularioLlave.scss';

const FormularioLlave = () => {
  const navegar = useNavigate();
  const { mostrarNotificacion, mostrarConfirmacion } = useNotificaciones();
  const { tamanoCodigoBarras } = useConfiguracion();
  const { id } = useParams();
  const esModoEdicion = !!id;
  const referenciaCodigoBarras = useRef(null);
  const referenciaImpresionCodigoBarras = useRef(null);

  const [datosFormulario, setDatosFormulario] = useState({
    codigoBarras: '',
    descripcion: '',
    estado: 'disponible',
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (esModoEdicion) {
      const cargarLlave = async () => {
        setCargando(true);
        try {
          const resultado = await obtenerLlavePorId(id);
          const datos = resultado.data || resultado;
          
          setDatosFormulario({
            codigoBarras: datos.codigo_barras || '',
            descripcion: datos.descripcion || '',
            estado: datos.estado || 'disponible',
          });
        } catch (err) {
          console.error('Error al cargar la llave:', err);
        } finally {
          setCargando(false);
        }
      };
      cargarLlave();
    } else {
      // Generar código automático para nuevas llaves
      if (!datosFormulario.codigoBarras) {
        generarCodigoAleatorio();
      }
    }
  }, [id, esModoEdicion]);

  const imprimirDirectamente = () => {
    imprimirCodigo(datosFormulario.codigoBarras, datosFormulario.descripcion, tamanoCodigoBarras);
  };

  const generarCodigoAleatorio= () => {
    const prefijo = 'LLAVE';
    const numero = Math.floor(100000 + Math.random() * 900000);
    const nuevoCodigo = `${prefijo}${numero}`;
    setDatosFormulario(prev => ({ ...prev, codigoBarras: nuevoCodigo }));
  };

  const manejarCambio = (e) => {
    const { id, value, type, checked } = e.target;
    setDatosFormulario(prev => ({
      ...prev,
      [id]: type === 'checkbox' ? checked : value
    }));
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const datosAEnviar = {
        codigo_barras: datosFormulario.codigoBarras,
        descripcion: datosFormulario.descripcion,
        estado: datosFormulario.estado
      };

      if (esModoEdicion) {
        await actualizarLlave(id, datosAEnviar);
        mostrarNotificacion('¡Actualizada!', 'La llave ha sido actualizada correctamente.', 'success', () => navegar('/gestion-llaves'));
      } else {
        await crearLlave(datosAEnviar);
        mostrarNotificacion(
          '¡Creada!', 
          'La llave ha sido registrada con éxito.', 
          'success', 
          () => navegar('/gestion-llaves'),
          [{
            etiqueta: 'Imprimir Código',
            tipo: 'dark',
            icono: 'print',
            alHacer: () => imprimirDirectamente()
          }]
        );
      }
    } catch (err) {
      console.error('Error al guardar:', err);
      const mensajeError = err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'No se pudo guardar la llave. Comprueba los datos.';
      setError(mensajeError);
    }
  };

  return (
    <LayoutAdministrador titulo="Gestión de Llaves">
      <div className="cabecera-pagina">
        <div className="ruta-navegacion">
          Administración &gt; Gestión de Llaves &gt; {esModoEdicion ? 'Edición' : 'Registro'}
        </div>
        <h1>{esModoEdicion ? 'Editar Llave' : 'Registro de Nueva Llave'}</h1>
      </div>

      <div className="cuadricula-formulario-llave">
        {/* Columna Izquierda: Formulario */}
        <div className="tarjeta-llave">
          <h3 className="titulo-tarjeta-llave">{esModoEdicion ? 'Modificar Datos' : 'Datos de la Entidad'}</h3>
          
          {error && (
            <div className="error-formulario-llave">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          <form className="formulario-llave" onSubmit={manejarEnvio}>

            <div className="grupo-campo-llave full-width">
              <label htmlFor="descripcion">Descripción *</label>
              <input
                type="text"
                id="descripcion"
                placeholder="Ej: Aula 204 - Informática"
                required
                minLength={5}
                maxLength={255}
                value={datosFormulario.descripcion}
                onChange={manejarCambio}
              />
            </div>

            <div className="fila-campo-llave">
              <div className="grupo-campo-llave flex-2">
                <label htmlFor="codigoBarras">Código de Barras *</label>
                <div className="fl-envoltorio-campo-with-btn">
                  <input
                    type="text"
                    id="codigoBarras"
                    placeholder="Generando código..."
                    required
                    readOnly
                    className="campo-solo-lectura"
                    value={datosFormulario.codigoBarras}
                    onChange={manejarCambio}
                  />
                  {!esModoEdicion && (
                    <button 
                      type="button" 
                      className="btn-generar" 
                      onClick={generarCodigoAleatorio}
                      titulo="Generar código aleatorio"
                    >
                      <span className="material-symbols-outlined">barcode_scanner</span>
                      Generar
                    </button>
                  )}
                </div>
              </div>
              {esModoEdicion && (
                <div className="grupo-campo-llave flex-1">
                  <label htmlFor="estado">Estado *</label>
                  <select 
                    id="estado" 
                    value={datosFormulario.estado} 
                    onChange={manejarCambio}
                  >
                    <option value="disponible">Disponible</option>
                    <option value="prestada">Prestada</option>
                    <option value="perdida">Perdida</option>
                  </select>
                </div>
              )}
            </div>



            <div className="acciones-formulario-llave">
              <button type="button" className="btn-cancelar" onClick={() => navegar('/gestion-llaves')}>
                Cancelar
              </button>
              <button type="submit" className="btn-guardar">
                {esModoEdicion ? 'Actualizar Llave' : 'Guardar Llave'}
              </button>
              {esModoEdicion && (
                <button 
                  type="button" 
                  className="btn-eliminar" 
                  onClick={() => {
                    mostrarConfirmacion(
                      '¿Eliminar Llave?', 
                      'Esta acción borrará permanentemente la llave del sistema. ¿Desea continuar?',
                      async () => {
                        try {
                          await eliminarLlave(id);
                          mostrarNotificacion('¡Eliminada!', 'La llave ha sido borrada del sistema.', 'success', () => navegar('/gestion-llaves'));
                        } catch (err) {
                          mostrarNotificacion('Error', 'No se pudo eliminar la llave', 'error');
                        }
                      }
                    );
                  }}
                >
                  <span className="material-symbols-outlined">delete</span>
                  Eliminar Llave
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Columna Derecha: Vista Previa */}
        <div className="barra-lateral-llave">
          <div className="tarjeta-vista-previa-llave">
            <div className="acento-vista-previa"></div>
            <div className="icono-vista-previa">
              <span className="material-symbols-outlined">key</span>
            </div>
            <div className="info-vista-previa">
              <p className="etiqueta-vista-previa">VISTA PREVIA</p>
              <h4 className="nombre-vista-previa">
                {datosFormulario.descripcion || 'Descripción de la llave'}
              </h4>
              <p className="ubicacion-vista-previa">
                {esModoEdicion ? 'Actualizando Registro' : 'Nueva Alta en Sistema'}
              </p>
            </div>
            <div className={`etiqueta-estado-llave ${datosFormulario.estado} my-4`}>
              <span className="punto-estado"></span>
              <span className="texto-estado">{datosFormulario.estado.toUpperCase()}</span>
            </div>
            <div className="codigo-barras-vista-previa">
              <div className="contenedor-imagen-barras">
                {datosFormulario.codigoBarras ? (
                  <CodigoBarras 
                    valor={datosFormulario.codigoBarras} 
                    svgRef={referenciaCodigoBarras}
                  />
                ) : (
                  <div className="placeholder-codigo-barras">
                    ESPERANDO CÓDIGO
                  </div>
                )}
              </div>
              <p className="texto-codigo-barras">
                {datosFormulario.codigoBarras || '---'}
              </p>
            </div>
          </div>


        </div>
      </div>
      {/* SVG oculto que sirve de fuente para la ventana de impresión */}
      <div className="hidden">
        <CodigoBarras 
          valor={datosFormulario.codigoBarras} 
          mostrarTexto={true} 
          paraImpresion={true} 
          svgRef={referenciaImpresionCodigoBarras} 
        />
      </div>
    </LayoutAdministrador>
  );
};

export default FormularioLlave;
