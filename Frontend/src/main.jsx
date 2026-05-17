/*
Punto de arranque de toda la aplicación.
CUÁNDO SE EJECUTA: Una sola vez, al cargar la página por primera vez.
*/

import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import './estilos/global.scss'


ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
