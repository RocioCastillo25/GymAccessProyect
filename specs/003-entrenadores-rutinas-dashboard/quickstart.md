# Guía de validación rápida: Sprint 3

**Rama**: `003-entrenadores-rutinas-dashboard` | **Fecha**: 2026-10-15 | **Plan**: [plan.md](./plan.md)

Ejecución y validación de extremo a extremo. No incluye código de implementación: el contrato de API
está en [contracts/api-rest.md](./contracts/api-rest.md), el formato de errores en
[contracts/formato-errores.md](./contracts/formato-errores.md) y el modelo de datos en
[data-model.md](./data-model.md).

## 1. Requisitos previos

| Requisito | Versión mínima | Comprobación |
|-----------|----------------|--------------|
| Node.js | 20 LTS | `node -v` |
| MySQL Server | 8.0 | `mysql --version` |
| npm | 10 | `npm -v` |
| Navegador de escritorio | Chrome/Edge/Firefox actualizado | — |

Se parte de los Sprints 1 y 2 implementados (autenticación, roles, clientes y membresías). MySQL
debe estar accesible en `127.0.0.1:3307` con el usuario de la aplicación.

## 2. Configuración inicial

```powershell
# 1. Variables de entorno (según .env.example; sin variables nuevas en este sprint)
copy .env.example .env
copy backend\.env.example backend\.env

# 2. Base de datos: aplicar migraciones (001 + 002 + 003) y semilla
node database/scripts/aplicar-migraciones.js

# 3. Dependencias (sin dependencias nuevas en este sprint)
cd backend; npm install; cd ..
cd frontend; npm install; cd ..
```

**Resultado esperado**: las migraciones crean las tablas `entrenadores`, `asignaciones_entrenador`,
`rutinas`, `ejercicios_rutina`, `objetivos_entrenamiento` y `progresos_clientes` (InnoDB/`utf8mb4`) y
reconstruyen la base solo con los scripts de `database/` (SC-007).

## 3. Arranque

```powershell
# Terminal 1: backend (puerto 3000)
cd backend; npm run dev

# Terminal 2: frontend (puerto 5173, proxy /api → localhost:3000)
cd frontend; npm run dev
```

**Resultado esperado**: `GET http://localhost:3000/api/salud` responde
`{ "estado": "ok", "baseDatos": "conectada" }` y el frontend muestra la pantalla de inicio de sesión
en español con las nuevas opciones del Sprint 3.

## 4. Comandos de prueba

```powershell
# Backend: integración de entrenadores, asignaciones, rutinas, objetivos, progresos y dashboard
cd backend; npm test

# Frontend: componentes de las pantallas nuevas (Vitest + React Testing Library)
cd frontend; npm test
```

**Resultado esperado**: pasan las pruebas de la matriz de permisos por rol (SC-002), de la unicidad
del entrenador principal activo (SC-004) y de las consultas del dashboard (SC-006).

## 5. Escenarios de validación de extremo a extremo

Ejecutar en orden sobre el entorno local. Cada escenario corresponde a una historia de usuario del
[spec.md](./spec.md).

| # | Escenario | Acción | Resultado esperado |
|---|-----------|--------|--------------------|
| 1 | Registro de entrenador (HU1) | El administrador registra un entrenador con un usuario rol `entrenador` | `201`; el entrenador queda asociado (FR-001) |
| 2 | Entrenador con usuario inválido (HU1) | Registrar con un usuario inexistente o de otro rol | `404`/`409` sin persistir (FR-003, FR-004) |
| 3 | Permiso de entrenador (HU1) | Un recepcionista intenta crear un entrenador | `403` (FR-002) |
| 4 | Asignación (HU2) | El recepcionista asigna un entrenador a un cliente activo | `201` (FR-005) |
| 5 | Cliente inactivo (HU2) | Asignar un entrenador a un cliente inactivo | `409`/`400` sin persistir (FR-007) |
| 6 | Entrenador principal único (HU2) | Asignar un segundo entrenador principal al mismo cliente | La asignación anterior se finaliza y la nueva queda activa (FR-006, SC-004) |
| 7 | Creación de rutina (HU3) | El entrenador crea una rutina con ejercicios para un cliente a su cargo | `201` con ejercicios (FR-009, FR-011) |
| 8 | Rutina de cliente ajeno (HU3) | El entrenador intenta crear una rutina para un cliente no asignado | `403` (FR-012) |
| 9 | Administrador no crea rutinas (HU3) | El administrador intenta crear una rutina | `403` (FR-012) |
| 10 | Archivado de rutina (HU3) | El entrenador crea una nueva rutina activa para el mismo cliente | La anterior pasa a `archivada` (R16, FR-031) |
| 11 | Registro de objetivo (HU4) | El entrenador registra un objetivo del cliente | `201` (FR-013) |
| 12 | Registro de progreso (HU4) | El entrenador registra un progreso nuevo | `201`; se conserva el anterior (FR-014, FR-015) |
| 13 | Progreso por rol no autorizado (HU4) | El recepcionista o administrador intenta registrar un progreso | `403` (FR-016) |
| 14 | Rutina propia (HU5) | El cliente consulta su rutina | `200` con su rutina vigente (FR-017) |
| 15 | Progreso propio (HU5) | El cliente consulta su progreso | `200` en orden cronológico (FR-017) |
| 16 | Datos ajenos (HU5) | El cliente intenta consultar la rutina de otro cliente | `403` (FR-018) |
| 17 | Dashboard (HU6) | El administrador abre el dashboard | `200` con el resumen agregado (FR-019) |
| 18 | Dashboard por rol (HU6) | El recepcionista consulta `/api/dashboard` (general) | `403`; solo accede a `/api/dashboard/personal` (FR-020) |
| 19 | Sin datos (HU6) | Consultar el dashboard sin datos | Indicadores en cero, sin error (Caso límite) |
| 20 | Personal asignado (HU7) | El recepcionista consulta los clientes de un entrenador | `200` con la lista (FR-008) |
| 21 | Carga propia (HU7) | El entrenador consulta sus clientes asignados | `200` solo con los suyos (FR-008) |
| 22 | Sin permiso (HU7) | El cliente intenta consultar el personal asignado | `403` |
| 23 | Rutas protegidas (FR-022) | Invocar rutas sin token o con rol sin permiso | `401`/`403` en todos los casos (SC-002) |
| 24 | Frontend sin MySQL (SC-009) | Revisar `frontend/` | Sin conexión directa a MySQL ni credenciales |
| 25 | Sin secretos (SC-008) | Revisar el repositorio | `.env` ignorado, `.env.example` sin credenciales reales |
| 26 | Reconstrucción de la base (SC-007) | Reconstruir con los scripts de `database/` | Base reconstruida (001 + 002 + 003) |
| 27 | Auditoría (FR-030) | El administrador consulta `GET /api/auditoria` | Se registran las acciones del sprint |

## 6. Demostración del flujo (SC-001)

Con el administrador sembrado, completar en menos de 5 minutos: registrar un entrenador → asignarlo a
un cliente activo → iniciar sesión como entrenador y crear una rutina con ejercicios → registrar un
objetivo y un progreso → iniciar sesión como cliente y consultar su rutina y evolución → volver como
administrador y abrir el dashboard.

## 7. Criterios de aceptación cubiertos

- Entrenadores: escenarios 1 a 3 (FR-001 a FR-004).
- Asignaciones: escenarios 4 a 6 y 20 (FR-005 a FR-008).
- Rutinas: escenarios 7 a 10 y 14 (FR-009 a FR-012, FR-017).
- Objetivos y progresos: escenarios 11 a 13 y 15 (FR-013 a FR-016).
- Dashboard: escenarios 17 a 19 (FR-019 a FR-021).
- Seguridad, base de datos y arquitectura: escenarios 16, 18, 22 a 27 (FR-022 a FR-031, SC-002,
  SC-007 a SC-009).
- Cobertura total de las 7 historias de usuario: SC-010.
