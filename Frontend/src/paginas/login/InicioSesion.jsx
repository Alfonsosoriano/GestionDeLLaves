/*
PARA QUÉ SIRVE: Formulario de inicio de sesión. Recoge usuario
  y contraseña, los envía al servidor y redirige al panel
  corresponsableondiente según el rol (administrador u ordenanza).
CUÁNDO SE EJECUTA: Al navegar a /login o al abrir la aplicación.
FUNCIONES PRINCIPALES:
  · manejarEnvio()      → valida y envía las credenciales al servidor
*/
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../servicios/api';
import { useConfiguracion } from '../../contexto/contexto_configuracion';
import { useNotificaciones } from '../../contexto/contexto_notificaciones';
import './InicioSesion.scss';

const Login = () => {
  const { nombreCentro } = useConfiguracion();
  const { mostrarNotificacion } = useNotificaciones();
  const [usuario, setUsuario] = useState(localStorage.getItem('usuarioRecordado') || '');
  const [contrasena, setContrasena] = useState('');
  const [recordar, setRecordar] = useState(localStorage.getItem('usuarioRecordado') ? true : false);
  const [mostrarContrasena, setMostrarContrasena] = useState(false);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const navegar = useNavigate();

  // Redirigir si ya hay una sesión activa
  React.useEffect(() => {
    const sesionActiva = localStorage.getItem('usuarioActual');
    if (sesionActiva) {
      const datosUsuario = JSON.parse(sesionActiva);
      if (datosUsuario.rol === 'administrador') {
        navegar('/panel-administracion');
      } else {
        navegar('/panel-ordenanza');
      }
    }
  }, [navegar]);

  const manejarEnvio = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      const response = await api.post('/api/usuarios/login', {
        usuario, 
        password: contrasena 
      });

      if (response.status === 200) {
        const datosUsuario = response.data;
        localStorage.setItem('usuarioActual', JSON.stringify(datosUsuario));
        
        if (recordar) {
          localStorage.setItem('usuarioRecordado', usuario);
        } else {
          localStorage.removeItem('usuarioRecordado');
        }

        if (datosUsuario.rol === 'administrador') {
          navegar('/panel-administracion');
        } else {
          navegar('/panel-ordenanza');
        }
      } else {
        setError('Usuario o contraseña incorrectos');
        mostrarNotificacion('Acceso Denegado', 'Usuario o contraseña incorrectos', 'error');
      }
    } catch (err) {
      console.error('Error al iniciar sesión:', err);
      if (err.response && (err.response.status === 401 || err.response.status === 404)) {
        setError('Usuario o contraseña incorrectos');
      } else {
        setError('No se pudo conectar con el servidor. Inténtelo más tarde.');
      }
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="envoltorio-login">
      <div className="tarjeta-login">
        {/* Encabezado del Centro */}
        <div className="cabecera-login">
          <div className="logo-icono">
            <span 
              className="material-symbols-outlined icono-primario icono-relleno" 
            >
              Key_Vertical
            </span>
          </div>
          <h1 className="titulo-principal">{nombreCentro}</h1>
          <p className="subtitulo-principal">Gestión de Llaves</p>
        </div>

          {/* Formulario de Inicio de Sesión */}
          <form onSubmit={manejarEnvio} className="formulario-login">
            
            {error && (
              <div className="error-login">
                {error}
              </div>
            )}

            {/* Campo de Usuario */}
            <div className="grupo-formulario">
              <label htmlFor="usuario" className="etiqueta-campo">Usuario</label>
              <div className="envoltorio-campo">
                <div className="envoltorio-icono">
                  <span className="material-symbols-outlined icono-superficie">person</span>
                </div>
                <input
                  type="text"
                  id="usuario"
                  name="usuario"
                  className="campo-entrada"
                  placeholder="Ingrese su usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Campo de Contraseña */}
            <div className="grupo-formulario">
              <label htmlFor="contrasena" className="etiqueta-campo">Contraseña</label>
              <div className="envoltorio-campo">
                <div className="envoltorio-icono">
                  <span className="material-symbols-outlined icono-superficie">lock</span>
                </div>
                <input
                  type={mostrarContrasena ? "text" : "password"}
                  id="contrasena"
                  name="contrasena"
                  className="campo-entrada"
                  placeholder="Ingrese su contraseña"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  required
                />
                <div 
                  className="alternar-contrasena" 
                  onClick={() => setMostrarContrasena(!mostrarContrasena)}
                >
                  <span className="material-symbols-outlined icono-superficie">
                    {mostrarContrasena ? 'visibility_off' : 'visibility'}
                  </span>
                </div>
              </div>
            </div>

          {/* Opciones de ayuda */}
          <div className="ayudas-formulario">
            <label className="envoltorio-checkbox">
              <input 
                type="checkbox" 
                className="checkbox-campo" 
                checked={recordar}
                onChange={(e) => setRecordar(e.target.checked)}
              />
              <span className="checkbox-etiqueta-campo">Recordarme</span>
            </label>
            <Link to="/recuperar-contrasena" titulo="Recuperar contraseña mediante pregunta de seguridad" className="enlace-recuperar">
              ¿Olvidó su contraseña?
            </Link>
          </div>

            {/* Botón de envío */}
            <button 
              type="submit" 
              className="boton-principal"
              disabled={cargando}
            >
              {cargando ? (
                <div className="flex-center">
                  <span className="material-symbols-outlined spin icono-medio">sync</span>
                  Iniciando sesión...
                </div>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          {/* Nota del pie */}
          <div className="pie-login">
            <p className="texto-pie-login">
              <span className="material-symbols-outlined icono-pequeno">security</span>
              Acceso restringido a personal autorizado
            </p>
          </div>
        </div>
    </div>
  );
};

export default Login;
