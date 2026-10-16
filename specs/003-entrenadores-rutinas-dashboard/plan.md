# Plan de implementación: Sprint 3 - Entrenadores, rutinas y dashboard administrativo

**Rama**: `003-entrenadores-rutinas-dashboard` | **Fecha**: 2026-10-15 | **Espec**: [spec.md](./spec.md)

**Entrada**: Especificación de la funcionalidad desde `/specs/003-entrenadores-rutinas-dashboard/spec.md`

## Resumen

El Sprint 3 construye sobre los Sprints 1 y 2 (autenticación JWT, roles, clientes, membresías,
pagos y control de acceso) para implementar la capa de coaching y supervisión del gimnasio: gestión
de entrenadores, asignación de clientes a entrenadores, rutinas de entrenamiento con sus ejercicios,
objetivos y progresos, consulta del cliente y un dashboard administrativo. El flujo central es: el
administrador registra entrenadores; el administrador o recepcionista asigna un entrenador a un
cliente activo; el entrenador crea la rutina del cliente asignado y registra objetivos y progresos;
el cliente consulta su rutina y evolución; el administrador supervisa el conjunto mediante el
dashboard.

El enfoque técnico mantiene la arquitectura de tres componentes (`frontend/`, `backend/`,
`database/`) y las decisiones de los sprints previos: backend Node.js + Express con **ES Modules**,
driver directo `mysql2/promise` con consultas parametrizadas (sin ORM), frontend React 18 con Vite
sin acceso directo a MySQL, MySQL 8 local (InnoDB/`utf8mb4`) y migraciones SQL numeradas. El único
componente nuevo relevante es el modelo de datos del entrenamiento y las consultas agregadas del
dashboard; no se añaden dependencias de terceros.

## Contexto técnico

**Lenguaje/Versión**: JavaScript (ES2022) con ES Modules en todo el código; Node.js 20 LTS para
`backend/` y los scripts de `database/scripts/`; React 18 con Vite para `frontend/`.

**Dependencias principales**: sin dependencias nuevas. Se reutilizan `express`, `mysql2`, `bcrypt`,
`jsonwebtoken` y `cors` en el backend, y React, React DOM y Vite en el frontend. Pruebas: `vitest` +
`supertest` (backend) y `vitest` + React Testing Library (frontend), ya presentes.

**Almacenamiento**: MySQL 8 local, motor InnoDB, codificación `utf8mb4`, usuario dedicado y
credenciales por variables de entorno. Se añade la migración
`database/migrations/003_sprint3_entrenadores_rutinas.sql` con las tablas `entrenadores`,
`asignaciones_entrenador`, `rutinas`, `ejercicios_rutina`, `objetivos_entrenamiento` y
`progresos_clientes`. Las tablas `usuarios` y `clientes` se reutilizan; el dashboard no requiere
tabla propia (se calcula con consultas agregadas, ver `research.md` R18).

**Pruebas**: `vitest` + `supertest` para la lógica de entrenadores, asignaciones, rutinas, objetivos,
progresos y dashboard; `vitest` + React Testing Library para los componentes del frontend. La
validación de extremo a extremo se documenta en `quickstart.md`.

**Plataforma objetivo**: aplicación web de escritorio en navegador moderno, ejecutándose en local
(`localhost`) sobre Windows durante el desarrollo y la demostración.

**Tipo de proyecto**: aplicación web con tres componentes separados (frontend, backend y base de
datos).

**Metas de rendimiento**: respuestas p95 < 300 ms en los endpoints CRUD locales y < 500 ms en las
consultas agregadas del dashboard; el flujo de demostración completo (SC-001) se completa en menos
de 5 minutos.

**Restricciones**: ES Modules obligatorios (sin `require()` ni `module.exports`); carpetas
`frontend/`, `backend/` y `database/` sin variantes; un cliente tiene como máximo un entrenador
principal activo; un entrenador solo gestiona clientes asignados a su carga; el recepcionista no
edita rutinas ni progresos; el cliente solo ve su propia información; se conserva el historial de
asignaciones, rutinas, objetivos y progresos; sin secretos en el repositorio.

**Escala/alcance**: 7 historias de usuario, 4 roles, 6 tablas nuevas (más `usuarios` y `clientes`
reutilizadas), 31 requisitos funcionales, aproximadamente 24 endpoints REST y un entorno local de
demostración con decenas de registros.

No hay elementos `NEEDS CLARIFICATION` pendientes: las decisiones abiertas del spec (indicadores del
dashboard, definición de "entrenador principal", detalle de ejercicios, unidades de progreso,
permisos de modificación del recepcionista y reglas de auditoría) quedaron resueltas en
`research.md`.

## Revisión de la constitución

*GATE: debe superarse antes de la investigación de la Fase 0. Se vuelve a evaluar tras el diseño de
la Fase 1.*

| Principio | Resultado | Evidencia en el plan |
|-----------|-----------|----------------------|
| I. Alcance, MVP y fuente de verdad | PASS | Solo alcance de Sprint 3 (`docs/sprint-3.md`): entrenadores, rutinas, objetivos, progresos y dashboard; sin clases grupales ni reportes avanzados. |
| II. Arquitectura con responsabilidades separadas | PASS | `frontend/`, `backend/` y `database/` separados; la lógica de asignación, rutinas y progreso vive en los servicios del backend. |
| III. Stack tecnológico y base de datos local | PASS | Se mantienen React, Node.js/Express, MySQL local, JWT y bcrypt; sin dependencias nuevas. |
| IV. Base de datos y persistencia | PASS | Tablas `entrenadores`, `asignaciones_entrenador`, `rutinas`, `ejercicios_rutina`, `objetivos_entrenamiento` y `progresos_clientes`; InnoDB; `utf8mb4`; llaves foráneas; historial conservado. |
| V. Seguridad y permisos (roles) | PASS | Administrador gestiona todo; recepcionista asigna y consulta sin editar rutinas/progresos; entrenador gestiona solo sus clientes; cliente solo su información. Validación en backend. |
| VI. Integridad de las reglas de negocio | PASS | Entrenador ligado a usuario válido; máximo un entrenador principal activo por cliente; rutina ligada a cliente y entrenador válidos; historial de progreso conservado. |
| VII. API y manejo de errores | PASS | API REST con JSON y códigos HTTP; middlewares `autenticar`/`autorizar` reutilizados; validación de entradas y manejo centralizado de errores. |
| VIII. Pruebas | PASS | Estrategia en `research.md`; cobertura de entrenadores, asignaciones, rutinas, objetivos, progresos y dashboard, verificable en `quickstart.md`. |
| IX. UX/UI profesional y sencilla | PASS | Pantallas en español con estados claros, mensajes de éxito/error y dashboard legible con indicadores resumidos. |
| X. Auditoría y trazabilidad | PASS | Se registra en `auditoria` el registro/modificación de entrenadores, la asignación de entrenador y la creación de rutinas y progresos; consulta exclusiva del administrador. |

**Resultado del GATE**: PASS (0 violaciones). Se permite avanzar a la Fase 0.

**Re-evaluación tras el diseño de la Fase 1**: PASS. Los artefactos generados (`research.md`,
`data-model.md`, `contracts/`, `quickstart.md`) no introducen nuevas violaciones: el modelo respeta
InnoDB/`utf8mb4`/integridad referencial, la unicidad del entrenador principal activo se refuerza a
nivel de base de datos y de servicio, el contrato de API exige autenticación/autorización en
backend y limita los datos por rol, y la guía de validación cubre las pruebas exigidas por el
principio VIII. Ningún `NEEDS CLARIFICATION` queda sin resolver.

## Estructura del proyecto

### Documentación (esta funcionalidad)

```text
specs/003-entrenadores-rutinas-dashboard/
├── plan.md              # Este archivo (comando /speckit.plan)
├── research.md          # Salida de la Fase 0
├── data-model.md        # Salida de la Fase 1
├── quickstart.md        # Salida de la Fase 1
├── contracts/           # Salida de la Fase 1
└── tasks.md             # Salida de la Fase 2 (/speckit.tasks, NO lo crea /speckit.plan)
```

### Código fuente (raíz del repositorio)

```text
gymaccess/
├── docs/
│   ├── project-context.md
│   ├── reglas.md
│   ├── sprint-1.md
│   ├── sprint-2.md
│   └── sprint-3.md
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx               # Añade las vistas del Sprint 3
│   │   ├── context/              # Sesión y rol (Sprint 1)
│   │   ├── components/           # MenuPrincipal (añade opciones del Sprint 3)
│   │   ├── pages/                # Entrenadores, asignaciones, rutinas, progresos, dashboard, mi entrenamiento
│   │   ├── services/             # Cliente HTTP contra la API REST
│   │   └── styles/               # CSS propio con variables
│   └── tests/
│
├── backend/
│   ├── package.json              # Mantiene "type": "module"; sin dependencias nuevas
│   ├── .env.example
│   ├── src/
│   │   ├── config/               # Variables de entorno y conexión a MySQL
│   │   ├── routes/               # Se añaden rutas de entrenadores, asignaciones, rutinas, objetivos, progresos, dashboard
│   │   ├── controllers/
│   │   ├── services/             # Lógica de entrenadores, asignación, rutinas, progreso y dashboard
│   │   ├── models/               # Acceso a datos de las tablas nuevas
│   │   ├── middlewares/          # autenticación, autorización, manejo de errores (reutilizados)
│   │   ├── validators/
│   │   ├── presenters/           # Presentadores en camelCase y filtrado por rol
│   │   └── utils/
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   └── app.js / server.js
│
├── database/
│   ├── README.md
│   ├── migrations/               # 001 (Sprint 1) + 002 (Sprint 2) + 003 (Sprint 3: entrenamiento)
│   ├── seeds/                    # Semilla admin y datos de demostración
│   └── scripts/                  # Aplicador de migraciones (ES Modules)
│
├── .env.example
├── .gitignore
└── README.md
```

**Decisión de estructura**: se mantiene la estructura de aplicación web de tres componentes
(`frontend/`, `backend/`, `database/`) impuesta por los sprints previos. No se crean carpetas
alternativas. La lógica de negocio del entrenamiento se distribuye en `models/`, `services/`,
`controllers/`, `validators/` y `presenters/` del backend; el frontend añade páginas por historia de
usuario y reutiliza la navegación por estado (`App.jsx` + `MenuPrincipal.jsx`).

## Seguimiento de la complejidad

> **Completar SOLO si la revisión de la constitución tiene violaciones que deban justificarse.**

| Violación | Por qué es necesaria | Alternativa más simple rechazada porque |
|-----------|----------------------|------------------------------------------|
| (ninguna) | — | — |
