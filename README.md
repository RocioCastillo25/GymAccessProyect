# Sistema de Gestión para Gimnasio

Plataforma web para administrar clientes, membresías, pagos y accesos mediante reconocimiento
facial. Proyecto académico desarrollado en tres sprints.

**Estado actual**: Sprint 3 completado (entrenadores, asignación de entrenadores, rutinas,
objetivos y progresos, consulta del cliente, dashboard administrativo y personal asignado), sobre
la base de los Sprints 1 y 2.

## Estructura del proyecto

```text
├── frontend/    # Aplicación React (JavaScript)
├── backend/     # API REST con Node.js, Express y ES Modules
├── database/    # Migraciones, semillas y scripts SQL de MySQL local
├── docs/        # Contexto maestro, reglas y alcance de cada sprint
└── specs/       # Especificación, plan y tareas de cada funcionalidad
```

## Alcance por sprint

- **Sprint 1**: autenticación con JWT, usuarios, roles, clientes y estructura base.
- **Sprint 2**: membresías, pagos y control de acceso con reconocimiento facial.
- **Sprint 3**: entrenadores, asignación de entrenador a cliente, rutinas con ejercicios,
  objetivos y progresos, consulta del cliente, dashboard administrativo y personal asignado.

El detalle de cada sprint está en `docs/sprint-1.md`, `docs/sprint-2.md` y `docs/sprint-3.md`.

### Módulos del Sprint 3

| Módulo | Pantalla | Endpoints principales | Roles |
|--------|----------|-----------------------|-------|
| Entrenadores | `Entrenadores.jsx` | `/api/entrenadores` | administrador (gestión), recepcionista (consulta) |
| Asignaciones | `Asignaciones.jsx` | `/api/asignaciones` | administrador, recepcionista |
| Rutinas | `Rutinas.jsx` | `/api/rutinas` | entrenador |
| Objetivos y progresos | `Progreso.jsx` | `/api/objetivos`, `/api/progresos` | entrenador (gestión), administrador y recepcionista (consulta) |
| Mi entrenamiento | `MiEntrenamiento.jsx` | `/api/rutinas/yo`, `/api/objetivos/yo`, `/api/progresos/yo` | cliente |
| Dashboard | `Dashboard.jsx` | `/api/dashboard`, `/api/dashboard/personal` | administrador, recepcionista (resumen operativo) |
| Personal asignado | `PersonalAsignado.jsx` | `/api/asignaciones/entrenador/:idEntrenador` | administrador, recepcionista, entrenador (carga propia) |

La migración del sprint es `database/migrations/003_sprint3_entrenadores_rutinas.sql` y crea las
tablas `entrenadores`, `asignaciones_entrenador`, `rutinas`, `ejercicios_rutina`,
`objetivos_entrenamiento` y `progresos_clientes` en InnoDB con `utf8mb4`.

## Requisitos previos

- Node.js 20 o superior
- MySQL 8 o superior ejecutándose en local (host y puerto configurados en `backend/.env` mediante
  `DB_HOST` y `DB_PORT`)

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

La validación del alcance vigente está en `specs/003-entrenadores-rutinas-dashboard/quickstart.md`,
con 27 escenarios que cubren las 7 historias del Sprint 3, la matriz de permisos por rol y el flujo
de demostración de menos de 5 minutos. Las guías de los sprints anteriores siguen disponibles en
`specs/001-sprint-1-base-sistema/quickstart.md` y
`specs/002-membresias-pagos-acceso-facial/quickstart.md`.

## Convenciones

- Backend y scripts de `database/scripts/` con ES Modules (`"type": "module"`).
- Frontend sin acceso directo a MySQL: toda consulta pasa por la API REST.
- Comentarios, documentación y mensajes para la persona usuaria en español.
- Commits con Conventional Commits: `tipo(alcance): descripción en español`.
