
import { Routes, Route, Navigate } from 'react-router-dom';

import InicioSesion from './paginas/login/InicioSesion';
import RecuperarContrasena from './paginas/login/RecuperarContrasena';
import PanelOrdenanza from './paginas/ordenanza/PanelOrdenanza';
import RegistroLlave from './paginas/ordenanza/RegistroLlave';
import DevolucionLlave from './paginas/ordenanza/DevolucionLlave';
import HistorialMovimientos from './paginas/historial/HistorialMovimientos';
import EditarPerfil from './paginas/perfil/EditarPerfil';
import PanelAdministracion from './paginas/administracion/PanelAdministracion';
import GestionUsuarios from './paginas/administracion/gestionUsuario/GestionUsuarios';
import FormularioUsuario from './paginas/administracion/gestionUsuario/FormularioUsuario';
import GestionLlaves from './paginas/administracion/gestionLlave/GestionLlaves';
import FormularioLlave from './paginas/administracion/gestionLlave/FormularioLlave';
import RegistrarPerdida from './paginas/ordenanza/RegistrarPerdida';
import ListadoLlaves from './paginas/llaves/ListadoLlaves';
import Configuracion from './paginas/administracion/Configuracion';

import { ProveedorConfiguracion } from './contexto/contexto_configuracion';
import { ProveedorNotificaciones } from './contexto/contexto_notificaciones';

// Componente raíz que define las rutas de cada página
export default function App() {
  return (
    
    <ProveedorConfiguracion>
      {/* ProveedorNotificaciones: permite mostrar modales de aviso desde cualquier página */}
      <ProveedorNotificaciones>
        <Routes>
          {/* Redirigir la raíz al login automáticamente */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Páginas públicas*/}
          <Route path="/login"                element={<InicioSesion />} />
          <Route path="/recuperar-contrasena" element={<RecuperarContrasena />} />

          {/* Páginas del ordenanza */}
          <Route path="/panel-ordenanza"  element={<PanelOrdenanza />} />
          <Route path="/registro-llave"   element={<RegistroLlave />} />
          <Route path="/devolucion-llave" element={<DevolucionLlave />} />
          <Route path="/registrar-perdida" element={<RegistrarPerdida />} />

          {/* Páginas del administrador */}
          <Route path="/panel-administracion" element={<PanelAdministracion />} />
          <Route path="/gestion-usuarios"              element={<GestionUsuarios />} />
          <Route path="/gestion-usuarios/nuevo"        element={<FormularioUsuario />} />
          <Route path="/gestion-usuarios/editar/:id"   element={<FormularioUsuario />} />
          <Route path="/gestion-llaves"                element={<GestionLlaves />} />
          <Route path="/gestion-llaves/nueva"          element={<FormularioLlave />} />
          <Route path="/gestion-llaves/editar/:id"     element={<FormularioLlave />} />
          <Route path="/configuracion"                 element={<Configuracion />} />

          {/* Páginas compartidas entre roles */}
          <Route path="/historial"          element={<HistorialMovimientos />} />
          <Route path="/inventario-llaves"  element={<ListadoLlaves />} />
          <Route path="/editar-perfil"      element={<EditarPerfil />} />

          {/* Cualquier ruta desconocida redirige al login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </ProveedorNotificaciones>
    </ProveedorConfiguracion>
  );
}
