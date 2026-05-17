/*
PARA QUÉ SIRVE: Formulario para crear o editar un usuario.
  Según si hay :id en la URL entra en modo edición o creación.
  Muestra una tarjeta de identificación con el código de barras.
CUÁNDO SE EJECUTA: Al navegar a /gestion-usuarios/nuevo
  o a /gestion-usuarios/editar/:id.
FUNCIONES PRINCIPALES:
  · cargarDatosUsuario()    → carga los datos del usuario a editar
  · manejarCambio()         → actualiza el estado del formulario al escribir
  · manejarEnvio()          → crea o actualiza el usuario en el servidor
  · generarCodigo()         → genera un código de barras para usuario nuevo
  · imprimirDirectamente()  → abre ventana de impresión del código
*/
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import CodigoBarras from '../../../componentes/ui/CodigoBarras';
import { obtenerUsuarioPorId, crearUsuario, actualizarUsuario, eliminarUsuario } from '../../../servicios/servicioUsuarios';
import LayoutAdministrador from '../../../componentes/layouts/layout_administrador';
import { useNotificaciones } from '../../../contexto/contexto_notificaciones';
import { useConfiguracion } from '../../../contexto/contexto_configuracion';
import { imprimirCodigo } from '../../../utils/imprimirCodigo';
import './FormularioUsuario.scss';

const FormularioUsuario = () => {
  const navegar = useNavigate();
  const { mostrarNotificacion, mostrarConfirmacion } = useNotificaciones();
  const { tamanoCodigoBarras } = useConfiguracion();
  const { id } = useParams();
  const esModoEdicion = !!id;
  const referenciaCodigoBarras = useRef(null);
  const referenciaImpresionCodigoBarras = useRef(null);

  const [datosFormulario, setDatosFormulario] = useState({
    nombre: '',
    apellidos: '',
    usuario: '',
    email: '',
    rol: '',
    codigoBarras: '',
    password: '',
    preguntaSeguridad: '',
    responseSeguridad: ''
  });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const usuarioActual = JSON.parse(localStorage.getItem('usuarioActual') || '{}');

  useEffect(() => {
    if (esModoEdicion) {
      const cargarUsuario = async () => {
        setCargando(true);
        try {
          const datos = await obtenerUsuarioPorId(id);
          setDatosFormulario({
            nombre: datos.nombre.split(' ')[0] || '',
            apellidos: datos.nombre.split(' ').slice(1).join(' ') || '',
            usuario: datos.usuario || '',
            email: datos.email || '',
            rol: datos.rol === 'administrador' ? 'ROLE_ADMIN' : 'ROLE_ORDENANZA',
            codigoBarras: datos.codigoBarras || '',
            password: '',
            preguntaSeguridad: datos.preguntaSeguridad || '',
            responseSeguridad: ''
          });
        } catch (err) {
          console.error('Error al cargar el usuario:', err);
          mostrarNotificacion('Error', 'No se pudo cargar la información del usuario.', 'error');
        } finally {
          setCargando(false);
        }
      };
      cargarUsuario();
    } else {
      // Generar código automático para nuevos usuarios
      if (!datosFormulario.codigoBarras) {
        generarCodigo();
      }
    }
  }, [id, esModoEdicion]);

  const manejarCambio = (e) => {
    const { id, value } = e.target;
    setDatosFormulario(prev => ({
      ...prev,
      [id]: value
    }));
    // Limpiar error general si se está modificando el campo que probablemente lo causó
    if (id === 'email' || id === 'usuario') {
      setError('');
    }
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    try {
      setError('');
      const datosAEnviar = {
        nombre: `${datosFormulario.nombre} ${datosFormulario.apellidos}`.trim(),
        usuario: datosFormulario.usuario,
        email: datosFormulario.email,
        rol: datosFormulario.rol === 'ROLE_ADMIN' ? 'administrador' : 'ordenanza',
        codigoBarras: datosFormulario.codigoBarras,
        password: datosFormulario.password,
        preguntaSeguridad: datosFormulario.preguntaSeguridad,
        responseSeguridad: datosFormulario.responseSeguridad
      };

      if (esModoEdicion) {
        await actualizarUsuario(id, datosAEnviar);
        mostrarNotificacion('¡Actualizado!', 'El usuario ha sido actualizado correctamente.', 'success', () => navegar('/gestion-usuarios'));
      } else {
        await crearUsuario(datosAEnviar);
        mostrarNotificacion(
          '¡Creado!', 
          'El usuario ha sido registrado con éxito.', 
          'success', 
          () => navegar('/gestion-usuarios'),
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
      const mensajeError = err.response?.data?.error || err.response?.data?.errors?.join(', ') || 'Error al conectar con el servidor.';
      setError(mensajeError);
    }
  };

  const imprimirDirectamente = () => {
    const nombreCompleto = `${datosFormulario.nombre} ${datosFormulario.apellidos}`.trim();
    imprimirCodigo(datosFormulario.codigoBarras, nombreCompleto, tamanoCodigoBarras);
  };

  const generarCodigo = () => {
    const aleatorio = Math.floor(1000 + Math.random() * 9000);
    setDatosFormulario(prev => ({ ...prev, codigoBarras: `USUARIO${aleatorio}` }));
  };

  return (
    <LayoutAdministrador titulo={esModoEdicion ? 'Editar Usuario' : 'Registro de Usuario'}>
      <div className="cabecera-pagina">
        <div className="ruta-navegacion">
          Administración &gt; Personal &gt; {esModoEdicion ? 'Edición' : 'Registro'}
        </div>
        <h1>{esModoEdicion ? 'Editar Usuario' : 'Registro de Usuario'}</h1>
        <p>
          {esModoEdicion 
            ? 'Modifique la información del usuario en el sistema.' 
            : 'Complete la información para registrar un nuevo usuario en el sistema.'}
        </p>
      </div>

      <div className="cuadricula-formulario-usuario">
        <div className="tarjeta-usuario">
          <h3 className="titulo-tarjeta-usuario">{esModoEdicion ? 'Modificar Datos' : 'Datos del Usuario'}</h3>
          
          {error && (
            <div className="error-formulario">
              <span className="material-symbols-outlined">error</span>
              {error}
            </div>
          )}

          <form className="formulario-usuario" onSubmit={manejarEnvio}>
            <div className="fila-campo-usuario">
              <div className="grupo-campo-usuario">
                <label htmlFor="nombre">Nombre</label>
                <input 
                  type="text" 
                  id="nombre" 
                  placeholder="Nombre" 
                  value={datosFormulario.nombre}
                  onChange={manejarCambio}
                  required
                />
              </div>
              <div className="grupo-campo-usuario">
                <label htmlFor="apellidos">Apellidos</label>
                <input 
                  type="text" 
                  id="apellidos" 
                  placeholder="Apellidos" 
                  value={datosFormulario.apellidos}
                  onChange={manejarCambio}
                  required
                />
              </div>
            </div>

            <div className="fila-campo-usuario">
              <div className="grupo-campo-usuario">
                <label htmlFor="usuario">Nombre de Usuario (Login)</label>
                <input 
                  type="text" 
                  id="usuario" 
                  placeholder="Ej: j.perez" 
                  value={datosFormulario.usuario}
                  onChange={manejarCambio}
                  required
                />
              </div>
              <div className="grupo-campo-usuario">
                <label htmlFor="password">{esModoEdicion ? 'Nueva Contraseña (opcional)' : 'Contraseña'}</label>
                <input 
                  type="password" 
                  id="password" 
                  placeholder="••••••••" 
                  value={datosFormulario.password}
                  onChange={manejarCambio}
                  required={!esModoEdicion}
                />
              </div>
            </div>
            <div className="grupo-campo-usuario">
              <label htmlFor="email">Email</label>
              <div className="fu-campo-con-icono">
                <input 
                  type="email" 
                  id="email" 
                  placeholder="email@ejemplo.com" 
                  value={datosFormulario.email}
                  onChange={manejarCambio}
                  required
                />
                <span className="material-symbols-outlined icono-estado">check_circle</span>
              </div>
            </div>
            <div className="grupo-campo-usuario">
              <label htmlFor="rol">Rol</label>
              <select id="rol" value={datosFormulario.rol} onChange={manejarCambio} required>
                <option value="">Seleccione un rol</option>
                <option value="ROLE_ADMIN">Administrador</option>
                <option value="ROLE_ORDENANZA">Ordenanza</option>
              </select>
            </div>
            
            <div className="divisor-seccion">Seguridad de la Cuenta</div>
  
            <div className="fila-campo-usuario">
              <div className="grupo-campo-usuario">
                <label htmlFor="preguntaSeguridad">Pregunta de Seguridad (para recuperación)</label>
                <select 
                  id="preguntaSeguridad" 
                  value={datosFormulario.preguntaSeguridad} 
                  onChange={manejarCambio} 
                  required
                >
                  <option value="">Seleccione una pregunta</option>
                  <option value="¿Cuál es el nombre de su primera mascota?">¿Cuál es el nombre de su primera mascota?</option>
                  <option value="¿En qué ciudad nació su madre?">¿En qué ciudad nació su madre?</option>
                  <option value="¿Cuál era el nombre de su primer colegio?">¿Cuál era el nombre de su primer colegio?</option>
                  <option value="¿Cuál es su comida favorita?">¿Cuál es su comida favorita?</option>
                  <option value="¿Cuál es el nombre de su mejor amigo de la infancia?">¿Cuál es el nombre de su mejor amigo de la infancia?</option>
                </select>
              </div>
              <div className="grupo-campo-usuario">
                <label htmlFor="responseSeguridad">Respuesta de Seguridad</label>
                <input 
                  type="password" 
                  id="responseSeguridad" 
                  placeholder={esModoEdicion ? "Dejar vacío para no cambiar" : "Respuesta secreta"}
                  value={datosFormulario.responseSeguridad}
                  onChange={manejarCambio}
                  required={!esModoEdicion}
                />
              </div>
            </div>

            <div className="grupo-campo-usuario">
              <label htmlFor="codigoBarras">Código de Barras de Identificación</label>
              <input 
                type="text" 
                id="codigoBarras" 
                placeholder="Generando código..." 
                value={datosFormulario.codigoBarras}
                onChange={manejarCambio}
                readOnly
                className="campo-solo-lectura"
                required
              />
            </div>

            {!esModoEdicion && (
              <div className="accion-codigo-barras">
                <button type="button" className="btn-contorno" onClick={generarCodigo}>
                  <span className="material-symbols-outlined">barcode_scanner</span>
                  Generar Código de Barras
                </button>
              </div>
            )}

            <div className="acciones-formulario-usuario">
              <button type="button" className="btn-cancelar" onClick={() => navegar('/gestion-usuarios')}>
                Cancelar
              </button>
              <button type="submit" className="btn-guardar">
                {esModoEdicion ? 'Actualizar Usuario' : 'Guardar Usuario'}
              </button>
              {esModoEdicion && (
                id !== usuarioActual.id ? (
                  <button 
                    type="button" 
                    className="btn-eliminar" 
                    onClick={() => {
                      mostrarConfirmacion(
                        '¿Eliminar Usuario?', 
                        'Esta acción borrará permanentemente al usuario del sistema. ¿Desea continuar?',
                        async () => {
                          try {
                            await eliminarUsuario(id);
                            mostrarNotificacion('¡Eliminado!', 'El usuario ha sido borrado del sistema.', 'success', () => navegar('/gestion-usuarios'));
                          } catch (err) {
                            mostrarNotificacion('Error', 'No se pudo eliminar el usuario', 'error');
                          }
                        }
                      );
                    }}
                  >
                    <span className="material-symbols-outlined">delete</span>
                    Eliminar Usuario
                  </button>
                ) : (
                  <div className="flex-1"></div>
                )
              )}
            </div>
          </form>
        </div>

        <div className="tarjeta-usuario tarjeta-vista-previa-usuario">
          <h3 className="titulo-tarjeta-usuario">Vista Previa de Identificación</h3>
          <div className="contenedor-tarjeta-id">
            <div className="tarjeta-identificacion">
              <div className="acento-tarjeta-id"></div>
              <div className="cuerpo-tarjeta-id">
                <div className="fu-id-avatar">
                  <span className="material-symbols-outlined">person</span>
                </div>
                <div className="info-identificacion">
                  <div className="fu-id-name">{datosFormulario.nombre || 'Nombre'} {datosFormulario.apellidos || 'Apellidos'}</div>
                  <div className="fu-id-role">{datosFormulario.rol ? datosFormulario.rol.replace('ROLE_', '') : 'Asignar Rol'}</div>
                </div>
              </div>
              <div className="area-codigo-barras-id">
                <div className="imagen-codigo-barras-id">
                  {datosFormulario.codigoBarras ? (
                    <CodigoBarras 
                      valor={datosFormulario.codigoBarras} 
                      svgRef={referenciaCodigoBarras}
                    />
                  ) : (
                    <div className="placeholder-codigo-usuario">Esperando código...</div>
                  )}
                </div>
                <div className="texto-codigo-id">{datosFormulario.codigoBarras || '---'}</div>
              </div>
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

export default FormularioUsuario;
