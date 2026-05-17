# Gestión de Llaves - IES Oretania

Sistema web integral para la digitalización y gestión del control de llaves en centros educativos.

## Estructura del Repositorio

- **Backend**: API REST desarrollada con Symfony.
- **Frontend**: Aplicación SPA desarrollada con React + Vite.

## Características Principales

- Control de préstamos y devoluciones de llaves.
- Gestión de inventario de llaves y usuarios.
- Historial detallado de movimientos.
- Generación de códigos de barras para llaves.
- Roles de usuario: Administrador y Ordenanza.
- Sistema de recuperación de contraseñas mediante preguntas de seguridad.

## Requisitos Previos

- Docker y Docker Compose
- Node.js (para desarrollo frontend)
- PHP 8.2+ (para desarrollo backend)

## Cómo empezar

1. Clonar el repositorio.
2. Levantar los servicios con Docker:
   ```bash
   docker-compose up -d
   ```
3. Acceder al frontend en `http://localhost:5173` (o el puerto configurado).
4. Acceder a la API en `http://localhost:8000`.

## Licencia

Este proyecto es de uso interno para el IES Oretania.