/*
PARA QUÉ SIRVE: Formulario para que cualquier usuario (admin
  u ordenanza) edite sus propios datos: nombre, usuario, email,
  contraseña y pregunta de seguridad.
CUÁNDO SE EJECUTA: Al pulsar el nombre del usuario en la cabecera.
FUNCIONES PRINCIPALES:
  · cargarDatosUsuarioSesion() → carga los datos actuales del usuario conectado
  · manejarCambio()            → actualiza el estado del formulario al escribir
  · manejarEnvio()             → valida y guarda los cambios en el servidor
*/
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { actualizarUsuario, obtenerUsuarioPorId } from '../../servicios/servicioUsuarios';
import { useConfiguracion } from '../../contexto/contexto_configuracion';
import { useNotificaciones } from '../../contexto/contexto_notificaciones';
import Encabezado from '../../componentes/comunes/encabezado';
import PiePagina from '../../componentes/comunes/pie_pagina';
import './EditarPerfil.scss';

const EditarPerfil = () => {
  const { nombreCentro } = useConfiguracion();
  const { mostrarNotificacion } = useNotificaciones();
  const navegar = useNavigate();
  const [datosFormulario, setDatosFormulario] = useState({
    nombre: '',
    apellidos: '',
    usuario: '',
    email: '',
    currentPassword: '',
    password: '',
    confirmPassword: '',
    preguntaSeguridad: '',
    responseSeguridad: ''
  });
  const [cargando, setCargando] = useState(true);
  const [idUsuario, setIdUsuario] = useState(null);
  const [rolUsuario, setRolUsuario] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const usuarioJson = localStorage.getItem('usuarioActual');
    if (usuarioJson) {
      const usuario = JSON.parse(usuarioJson);
      setIdUsuario(usuario.id);
      setRolUsuario(usuario.rol);
      
      const cargarDatosUsuario = async () => {
        try {
          const datosCompletos = await obtenerUsuarioPorId(usuario.id);
          setDatosFormulario({
            nombre: datosCompletos.nombre.split(' ')[0] || '',
            apellidos: datosCompletos.nombre.split(' ').slice(1).join(' ') || '',
            usuario: datosCompletos.usuario || '',
            email: datosCompletos.email,
            currentPassword: '',
            password: '',
            confirmPassword: '',
            preguntaSeguridad: datosCompletos.preguntaSeguridad || '',
            responseSeguridad: ''
          });
        } catch (err) {
          console.error('Error al cargar datos del usuario:', err);
        } finally {
          setCargando(false);
        }
      };
      cargarDatosUsuario();
    } else {
      navegar('/login');
    }
  }, [navegar]);

  const manejarCambio = (e) => {
    setDatosFormulario({ ...datosFormulario, [e.target.id]: e.target.value });
    if (['currentPassword', 'password', 'confirmPassword'].includes(e.target.id)) {
      setError('');
    }
  };

  const manejarEnvio = async (e) => {
    e.preventDefault();
    if (datosFormulario.password) {
      if (!datosFormulario.currentPassword) {
        mostrarNotificacion('Atención', 'Debe introducir su contraseña actual para cambiarla', 'error');
        return;
      }
      if (datosFormulario.password !== datosFormulario.confirmPassword) {
        mostrarNotificacion('Atención', 'Las nuevas contraseñas no coinciden', 'error');
        return;
      }
      if (datosFormulario.password.length < 4) {
        mostrarNotificacion('Atención', 'La nueva contraseña debe tener al menos 4 caracteres', 'error');
        return;
      }
    }

    try {
      const datosParaEnviar = {
        nombre: `${datosFormulario.nombre} ${datosFormulario.apellidos}`.trim(),
        usuario: datosFormulario.usuario,
        email: datosFormulario.email,
        preguntaSeguridad: datosFormulario.preguntaSeguridad,
        responseSeguridad: datosFormulario.responseSeguridad
      };

      if (datosFormulario.password) {
        datosParaEnviar.currentPassword = datosFormulario.currentPassword;
        datosParaEnviar.newPassword = datosFormulario.password;
      }

      await actualizarUsuario(idUsuario, datosParaEnviar);
      
      // Actualizar localStorage
      const usuarioJson = localStorage.getItem('usuarioActual');
      if (usuarioJson) {
        const usuario = JSON.parse(usuarioJson);
        usuario.nombre = datosParaEnviar.nombre;
        usuario.usuario = datosParaEnviar.usuario;
        usuario.email = datosParaEnviar.email;
        localStorage.setItem('usuarioActual', JSON.stringify(usuario));
      }

      mostrarNotificacion('¡Éxito!', 'Perfil actualizado correctamente', 'success', () => {
        if (rolUsuario === 'administrador') {
          navegar('/panel-administracion');
        } else {
          navegar('/panel-ordenanza');
        }
      });
    } catch (err) {
      console.error('Error al actualizar perfil:', err);
      const mensajeError = err.response?.data?.error || 'No se pudo actualizar el perfil';
      setError(mensajeError);
      
      // Solo mostrar notificación si NO es el error específico de contraseña en uso
      if (!mensajeError.includes('ya está en uso')) {
        mostrarNotificacion('Error', mensajeError, 'error');
      }
    }
  };

  if (cargando) return <div style={{ padding: '2rem', textAlign: 'center' }}>Cargando perfil...</div>;

  return (
    <div className="envoltorio-perfil">
      <Encabezado />

      <main className="ep-main">
        <div className="ep-container">
          <div className="tarjeta-perfil">
            <div className="cabecera-tarjeta-perfil">
              <span className="material-symbols-outlined">person</span>
              <div>
                <h1>Edición de Perfil</h1>
                <p>Actualice su información personal y de seguridad</p>
              </div>
            </div>

            <form className="formulario-perfil" onSubmit={manejarEnvio}>
              <div className="fila-perfil">
                <div className="grupo-campo-perfil">
                  <label htmlFor="nombre">Nombre</label>
                  <input type="text" id="nombre" value={datosFormulario.nombre} onChange={manejarCambio} required />
                </div>
                <div className="grupo-campo-perfil">
                  <label htmlFor="apellidos">Apellidos</label>
                  <input type="text" id="apellidos" value={datosFormulario.apellidos} onChange={manejarCambio} required />
                </div>
              </div>

              <div className="grupo-campo-perfil">
                <label htmlFor="usuario">Nombre de Usuario</label>
                <input type="text" id="usuario" value={datosFormulario.usuario} onChange={manejarCambio} required />
              </div>

              <div className="caja-seguridad">
                <div className="cabecera-caja-perfil">
                  <span className="material-symbols-outlined">lock</span>
                  <h3>Cambio de Contraseña (Opcional)</h3>
                </div>
                <p className="info-caja-perfil">Complete estos campos solo si desea cambiar su clave actual.</p>
                
                <div className="grupo-campo-perfil">
                  <label htmlFor="currentPassword">Contraseña Actual</label>
                  <input 
                    type="password" 
                    id="currentPassword" 
                    value={datosFormulario.currentPassword} 
                    onChange={manejarCambio} 
                    placeholder="Introduzca su clave actual"
                  />
                </div>
                <div className="fila-perfil">
                  <div className="grupo-campo-perfil">
                    <label htmlFor="password">Nueva Contraseña</label>
                    <input 
                      type="password" 
                      id="password" 
                      value={datosFormulario.password} 
                      onChange={manejarCambio} 
                      placeholder="Mínimo 4 caracteres"
                    />
                  </div>
                  <div className="grupo-campo-perfil">
                    <label htmlFor="confirmPassword">Repetir Nueva Contraseña</label>
                    <input 
                      type="password" 
                      id="confirmPassword" 
                      value={datosFormulario.confirmPassword} 
                      onChange={manejarCambio} 
                      placeholder="Repita la nueva clave"
                    />
                  </div>
                </div>

                <div className="texto-divisor">Recuperación de cuenta</div>

                <div className="grupo-campo-perfil">
                  <label htmlFor="preguntaSeguridad">Pregunta de Seguridad</label>
                  <select 
                    id="preguntaSeguridad" 
                    value={datosFormulario.preguntaSeguridad} 
                    onChange={manejarCambio} 
                    className="ep-select"
                  >
                    <option value="">Seleccione una pregunta</option>
                    <option value="¿Cuál es el nombre de su primera mascota?">¿Cuál es el nombre de su primera mascota?</option>
                    <option value="¿En qué ciudad nació su madre?">¿En qué ciudad nació su madre?</option>
                    <option value="¿Cuál era el nombre de su primer colegio?">¿Cuál era el nombre de su primer colegio?</option>
                    <option value="¿Cuál es su comida favorita?">¿Cuál es su comida favorita?</option>
                    <option value="¿Cuál es el nombre de su mejor amigo de la infancia?">¿Cuál es el nombre de su mejor amigo de la infancia?</option>
                  </select>
                </div>

                <div className="grupo-campo-perfil">
                  <label htmlFor="responseSeguridad">Nueva Respuesta (Opcional)</label>
                  <input 
                    type="password" 
                    id="responseSeguridad" 
                    value={datosFormulario.responseSeguridad} 
                    onChange={manejarCambio} 
                    placeholder="Solo rellene si desea cambiar su respuesta"
                  />
                </div>

                {error && (
                  <div className="error-contrasena" style={{ color: '#dc2626', fontSize: '0.85rem', marginTop: '10px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span className="material-symbols-outlined" style={{ fontSize: '1.1rem' }}>error</span>
                    {error}
                  </div>
                )}
              </div>

              <div className="acciones-perfil">
                <button type="submit" className="btn-guardar">
                  <span className="material-symbols-outlined">save</span>
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>

          <div className="acciones-nav-perfil">
            <button 
              className="btn-volver"
              onClick={() => {
                if (rolUsuario === 'administrador') {
                  navegar('/panel-administracion');
                } else {
                  navegar('/panel-ordenanza');
                }
              }} 
            >
              <span className="material-symbols-outlined">arrow_back</span>
              Volver al panel
            </button>
          </div>
        </div>
      </main>
      <PiePagina />
    </div>
  );
};

export default EditarPerfil;
