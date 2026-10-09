# Plan de implementación: Sprint 1 - Base del sistema, autenticación, usuarios, roles y clientes

**Rama**: `001-sprint-1-base-sistema` | **Fecha**: 2026-10-09 | **Espec**: [spec.md](./spec.md)

**Entrada**: Especificación de la funcionalidad desde `/specs/001-sprint-1-base-sistema/spec.md`

## Resumen

El Sprint 1 establece la base del sistema de gestión del gimnasio: estructura de proyecto
(`frontend/`, `backend/`, `database/`), autenticación con correo y contraseña (hash `bcrypt` +
token JWT de 60 minutos), gestión exclusiva de usuarios y roles por parte del administrador, y
registro, modificación y consulta de clientes con permisos validados en el backend para los cuatro
roles. La base de datos MySQL local se crea íntegramente con scripts SQL versionados, incluida la
estructura inicial de `tipos_membresia`, `membresias` y `pagos` sin operaciones funcionales, para
dejar listo el Sprint 2 (membresías, pagos y reconocimiento facial).

Enfoque técnico: API REST en Node.js + Express con ES Modules, capas separadas
(`config/`, `routes/`, `controllers/`, `services/`, `models/`, `middlewares/`, `validators/`,
`utils/`), acceso a MySQL con driver directo `mysql2/promise` y consultas parametrizadas, y
frontend en React con JavaScript que consumirá la API mediante proxy en desarrollo.

## Contexto técnico

**Lenguaje/versión**: JavaScript (ES2022) con ES Modules en todo el código; Node.js 20 LTS para
`backend/` y los scripts de `database/scripts/`; React 18 con Vite para `frontend/`.

**Dependencias principales**: `express`, `mysql2`, `bcrypt`, `jsonwebtoken` (backend); `react`,
`react-dom`, `vite`, `@vitejs/plugin-react` (frontend). Pruebas: `vitest`, `supertest`,
`@testing-library/react` y `@testing-library/jest-dom`. Sin ORM, sin librería de componentes ni
librerías de reconocimiento facial en este sprint.

**Almacenamiento**: MySQL 8 ejecutado localmente, motor InnoDB, codificación `utf8mb4`, usuario
dedicado para la aplicación (nunca `root`), credenciales en variables de entorno
(`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`) y consultas parametrizadas.

**Pruebas**: `vitest` + `supertest` en el backend (unidad e integración de API) y `vitest` +
React Testing Library en el frontend; la validación de extremo a extremo se ejecuta con los
escenarios guiados de `quickstart.md`.

**Plataforma objetivo**: Aplicación web de escritorio en navegador moderno, ejecutándose en
local (`localhost`) sobre Windows durante el desarrollo y la demostración.

**Tipo de proyecto**: Aplicación web con tres componentes separados (frontend, backend y base de
datos).

**Metas de rendimiento**: respuestas p95 < 300 ms en los endpoints CRUD locales; el flujo de
demostración completo (SC-001) se completa en menos de 5 minutos.

**Restricciones**: ES Modules obligatorios (sin `require()` ni `module.exports`); carpetas
`frontend/`, `backend/` y `database/` sin variantes; token JWT con expiración de 60 minutos
configurable por variable de entorno y sin renovación automática; contraseñas de al menos 8
caracteres almacenadas con hash `bcrypt`; sin secretos en el repositorio (`.env` ignorado y
`.env.example` presente); sin eliminaciones físicas de usuarios ni clientes; Sprint 1 sin librerías,
capturas ni validaciones de reconocimiento facial.

**Escala/alcance**: 7 historias de usuario, 4 roles fijos, 5 tablas creadas en el Sprint 1 (3 de
ellas solo estructura), 36 requisitos funcionales, aproximadamente 12 endpoints REST y un entorno
local de demostración con decenas de registros.

No hay elementos `NEEDS CLARIFICATION` pendientes: todas las decisiones abiertas del spec fueron
resueltas en `research.md` (driver de MySQL, estrategia de pruebas, librería de componentes,
manejo de estado en React y validación de formularios).

## Revisión de la constitución

*GATE: debe superarse antes de la investigación de la Fase 0. Se vuelve a evaluar tras el diseño de
la Fase 1.*

| Principio | Resultado | Evidencia en el plan |
|-----------|-----------|----------------------|
| I. Alcance, MVP y fuente de verdad | PASS | Solo alcance de Sprint 1; nada fuera de `docs/sprint-1.md`; sin funcionalidades nuevas. |
| II. Arquitectura con responsabilidades separadas | PASS | Frontend/backend/BD separados; backend modular por capas; facial fuera de este sprint. |
| III. Stack tecnológico y base de datos local | PASS | React + Express + MySQL local; JWT; bcrypt; scripts SQL versionados; conexión por variables de entorno; sin dependencias innecesarias. |
| IV. Base de datos y persistencia | PASS | Tablas `usuarios`, `clientes`, `tipos_membresia`, `membresias`, `pagos`; InnoDB; `utf8mb4`; llaves primarias y foráneas; sin borrado ordinario de historiales. |
| V. Seguridad y protección de la información | PASS | Hash `bcrypt`; secretos en `.env` con `.env.example`; permisos validados en backend; sin stack traces al usuario. |
| VI. Roles y permisos | PASS | Los 4 roles con el alcance definido; entrenador sin información financiera ni de contacto; cliente únicamente sus propios datos. |
| VII. Integridad de las reglas de negocio | PASS | Cliente previo a cualquier relación; estados `activo`/`inactivo`; sin eliminaciones físicas en el Sprint 1. |
| VIII. Reconocimiento facial y control de acceso | PASS | Sin instalación ni procesamiento facial en el Sprint 1; estructura preparatoria para relacionar datos con un cliente (FR-035, FR-036). |
| IX. API y manejo de errores | PASS | API REST con JSON y códigos HTTP; middleware de autenticación y de autorización; validación de entradas; manejo de errores centralizado. |
| X. Pruebas | PASS | Estrategia definida en `research.md`; cobertura mínima de autenticación, roles, usuarios y clientes verificable en `quickstart.md`. |
| XI. UX/UI profesional y sencilla | PASS | Mensajes de éxito y error en español, confirmaciones en operaciones destructivas (desactivación) y estados visibles con claridad. |

**Resultado del GATE**: PASS (0 violaciones). Se permite avanzar a la Fase 0.

**Re-evaluación tras el diseño de la Fase 1**: PASS. Los artefactos generados
(`research.md`, `data-model.md`, `contracts/`, `quickstart.md`) no introducen nuevas violaciones:
el modelo de datos respeta InnoDB/`utf8mb4`/integridad referencial y el borrado lógico, el contrato
de API exige autenticación y autorización en backend, los errores no filtran información interna y
la guía de validación cubre las pruebas mínimas exigidas por el principio X. Ningún
`NEEDS CLARIFICATION` queda sin resolver.

## Estructura del proyecto

### Documentación (esta funcionalidad)

```text
specs/001-sprint-1-base-sistema/
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
│   └── sprint-2.md
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── context/          # Contexto de sesión y rol
│   │   ├── components/       # Componentes reutilizables
│   │   ├── pages/            # Login, usuarios, clientes, perfil propio
│   │   ├── services/         # Cliente HTTP contra la API REST
│   │   └── styles/           # CSS propio con variables
│   └── tests/
│
├── backend/
│   ├── package.json          # Incluye "type": "module"
│   ├── .env.example
│   ├── src/
│   │   ├── config/           # Variables de entorno y conexión a MySQL
│   │   ├── routes/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── middlewares/      # autenticación, autorización y manejo de errores
│   │   ├── validators/
│   │   └── utils/
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   └── app.js / server.js
│
├── database/
│   ├── README.md
│   ├── migrations/           # Scripts SQL numerados
│   ├── seeds/                # Semilla del usuario administrador y datos de demostración
│   └── scripts/              # Aplicador de migraciones (ES Modules)
│
├── .env.example
├── .gitignore
└── README.md
```

**Decisión de estructura**: se adopta la estructura de aplicación web de tres componentes
(`frontend/`, `backend/`, `database/`) impuesta por `docs/sprint-1.md` y FR-028. No se crean
carpetas alternativas (`client/`, `server/`, `dataBase/`). Los directorios internos de `backend/`
responden a FR-032 y los directorios de pruebas separan `unit/` e `integration/` para la estrategia
definida en `research.md`.

## Seguimiento de complejidad

> **Rellenar SOLO si la revisión de la constitución detecta violaciones que deban justificarse.**

| Violación | Por qué es necesaria | Alternativa más simple rechazada porque |
|-----------|----------------------|-----------------------------------------|
| No aplica | La revisión de la constitución no detectó violaciones. | — |
