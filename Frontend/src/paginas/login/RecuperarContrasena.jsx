/*
PARA QUÉ SIRVE: Flujo de recuperación de contraseña en 2 pasos:
  1) El usuario escribe su nombre de usuario y el sistema
     devuelve su pregunta de seguridad.
  2) El usuario responsableonde la pregunta y escribe su nueva clave.
CUÁNDO SE EJECUTA: Al pulsar ¿Olvidó su contraseña? en el login.
FUNCIONES PRINCIPALES:
  · manejarBusquedaUsuario() → pide la pregunta de seguridad al servidor
  · manejarRestablecimiento() → envía la response y la nueva contraseña
*/
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../servicios/api';
import { useConfiguracion } from '../../contexto/contexto_configuracion';
import { useNotificaciones } from '../../contexto/contexto_notificaciones';
import './RecuperarContrasena.scss';

const RecuperarPassword = () => {
  const { nombreCentro } = useConfiguracion();
  const { mostrarNotificacion } = useNotificaciones();
  const navegar = useNavigate();

  const [paso, setPaso] = useState(1);
  const [usuario, setUsuario] = useState('');
  const [pregunta, setPregunta] = useState('');
  const [response, setRespuesta] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [confirmarPassword, setConfirmarPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  // Paso 1: Buscar usuario y obtener su pregunta
  const manejarBusquedaUsuario = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const responseApi = await api.get(`/api/recuperar-contrasena/pregunta/${usuario}`);
      setPregunta(responseApi.data.pregunta);
      setPaso(2);
    } catch (err) {
      setError(err.response?.data?.error || 'No se pudo encontrar el usuario.');
    } finally {
      setCargando(false);
    }
  };

  // Paso 2 y 3: Verificar respuesta y cambiar contraseña
  const manejarRestablecimiento = async (e) => {
    e.preventDefault();
    setError('');

    if (nuevaPassword !== confirmarPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    if (nuevaPassword.length < 4) {
      setError('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    setCargando(true);
    try {
      await api.post('/api/recuperar-contrasena/verificar', {
        usuario,
        response,
        nuevaPassword
      });
      
      mostrarNotificacion(
        '¡Éxito!', 
        'Su contraseña ha sido restablecida correctamente.', 
        'success', 
        () => navegar('/login')
      );
    } catch (err) {
      setError(err.response?.data?.error || 'Error al restablecer la contraseña.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="rp-wrapper">
      <div className="rp-card">
        <div className="rp-header">
          <div className="logo-icono">
            <span className="material-symbols-outlined">lock_reset</span>
          </div>
          <h1 className="titulo">{nombreCentro}</h1>
          <p className="subtitulo">Recuperar Contraseña</p>
        </div>

        {error && (
          <div className="rp-error-message">
            <span className="material-symbols-outlined">error</span>
            {error}
          </div>
        )}

        {paso === 1 && (
          <form onSubmit={manejarBusquedaUsuario} className="rp-form">
            <p className="rp-info-text">
              Ingrese su nombre de usuario para comenzar el proceso de recuperación.
            </p>
            <div className="grupo-formulario">
              <label htmlFor="usuario">Usuario</label>
              <div className="envoltorio-campo">
                <span className="material-symbols-outlined">person</span>
                <input
                  type="text"
                  id="usuario"
                  placeholder="Ej: j.perez"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  required
                />
              </div>
            </div>
            <button type="submit" className="rp-button" disabled={cargando}>
              {cargando ? 'Buscando...' : 'Continuar'}
            </button>
          </form>
        )}

        {paso === 2 && (
          <form onSubmit={manejarRestablecimiento} className="rp-form">
            <div className="rp-question-box">
              <span className="etiqueta-pregunta">Pregunta de Seguridad:</span>
              <p className="texto-pregunta">{pregunta}</p>
            </div>

            <div className="grupo-formulario">
              <label htmlFor="response">Respuesta</label>
              <div className="envoltorio-campo">
                <span className="material-symbols-outlined">quiz</span>
                <input
                  type="password"
                  id="response"
                  placeholder="Escriba su response"
                  value={response}
                  onChange={(e) => setRespuesta(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grupo-formulario">
              <label htmlFor="nuevaPassword">Nueva Contraseña</label>
              <div className="envoltorio-campo">
                <span className="material-symbols-outlined">lock</span>
                <input
                  type="password"
                  id="nuevaPassword"
                  placeholder="Mínimo 4 caracteres"
                  value={nuevaPassword}
                  onChange={(e) => setNuevaPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grupo-formulario">
              <label htmlFor="confirmarPassword">Confirmar Nueva Contraseña</label>
              <div className="envoltorio-campo">
                <span className="material-symbols-outlined">lock_clock</span>
                <input
                  type="password"
                  id="confirmarPassword"
                  placeholder="Repita la contraseña"
                  value={confirmarPassword}
                  onChange={(e) => setConfirmarPassword(e.target.value)}
                  required
                />
              </div>
            </div>

            <button type="submit" className="rp-button" disabled={cargando}>
              {cargando ? 'Procesando...' : 'Restablecer Contraseña'}
            </button>
            <button type="button" className="rp-button-secondary" onClick={() => setPaso(1)}>
              Atrás
            </button>
          </form>
        )}

        <div className="rp-footer">
          <Link to="/login" className="enlace-volver">
            <span className="material-symbols-outlined">arrow_back</span>
            Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RecuperarPassword;
