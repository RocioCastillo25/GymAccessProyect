# Sistema de Gestión para Gimnasio

Plataforma web para administrar clientes, membresías, pagos y accesos mediante reconocimiento
facial. Proyecto académico desarrollado en tres sprints.

**Estado actual**: Sprint 1 (base del sistema, autenticación, usuarios, roles y clientes).

## Estructura del proyecto

```text
├── frontend/    # Aplicación React (JavaScript)
├── backend/     # API REST con Node.js, Express y ES Modules
├── database/    # Migraciones, semillas y scripts SQL de MySQL local
├── docs/        # Contexto maestro, reglas y alcance de cada sprint
└── specs/       # Especificación, plan y tareas de cada funcionalidad
```

## Requisitos previos

- Node.js 20 o superior
- MySQL 8 o superior ejecutándose en local (puerto 3306)

## Instalación

```powershell
# 1. Variables de entorno
copy .env.example .env
copy backend\.env.example backend\.env
# Editar .env y backend\.env con las credenciales reales de MySQL y un JWT_SECRET propio

# 2. Base de datos: crearla, migrar y sembrar el administrador inicial
node database/scripts/aplicar-migraciones.js

# 3. Dependencias
cd backend; npm install; cd ..
cd frontend; npm install; cd ..
```

## Ejecución

```powershell
# Terminal 1: backend (http://localhost:3000)
cd backend; npm run dev

# Terminal 2: frontend (http://localhost:5173)
cd frontend; npm run dev
```

## Pruebas

```powershell
cd backend; npm test
cd frontend; npm test
```

## Validación de extremo a extremo

Siga la guía de `specs/001-sprint-1-base-sistema/quickstart.md`, que incluye 18 escenarios de
validación y el flujo de demostración de menos de 5 minutos.

## Convenciones

- Backend y scripts de `database/scripts/` con ES Modules (`"type": "module"`).
- Frontend sin acceso directo a MySQL: toda consulta pasa por la API REST.
- Comentarios, documentación y mensajes para la persona usuaria en español.
- Commits con Conventional Commits: `tipo(alcance): descripción en español`.
