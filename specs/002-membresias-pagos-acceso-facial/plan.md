# Plan de implementación: Sprint 2 - Membresías, pagos, reconocimiento facial y control de acceso

**Rama**: `002-membresias-pagos-acceso-facial` | **Fecha**: 2026-10-15 | **Espec**: [spec.md](./spec.md)

**Entrada**: Especificación de la funcionalidad desde `/specs/002-membresias-pagos-acceso-facial/spec.md`

## Resumen

El Sprint 2 construye sobre la base del Sprint 1 (autenticación JWT, roles y clientes) para
implementar las funciones principales del gimnasio: gestión de tipos de membresía, asignación y
renovación de membresías, registro y consulta de pagos y adeudos, registro de información facial y
control de acceso. El flujo central es: se registra un tipo de membresía, se asigna a un cliente,
se registra el pago, se registra el rostro del cliente; al llegar al acceso, el sistema identifica
al cliente por reconocimiento facial y luego valida su membresía para autorizar o rechazar la
entrada, registrando siempre el intento.

Enfoque técnico: API REST en Node.js + Express con ES Modules, manteniendo las capas del Sprint 1
(`config/`, `routes/`, `controllers/`, `services/`, `models/`, `middlewares/`, `validators/`,
`utils/`) y el acceso a MySQL con `mysql2/promise` y consultas parametrizadas. El reconocimiento
facial se ejecuta en el navegador con una librería compatible con JavaScript que genera un
descriptor facial de 128 dimensiones; el descriptor viaja al backend, que lo almacena y realiza la
comparación (distancia euclídea con umbral) y la decisión de acceso. El frontend en React consume
la API mediante el cliente HTTP existente y accede a la cámara con `getUserMedia`.

## Contexto técnico

**Lenguaje/versión**: JavaScript (ES2022) con ES Modules en todo el código; Node.js 20 LTS para
`backend/` y los scripts de `database/scripts/`; React 18 con Vite para `frontend/`.

**Dependencias principales**: backend sin dependencias nuevas (se reutilizan `express`, `mysql2`,
`bcrypt`, `jsonwebtoken`, `cors`; la comparación facial es aritmética propia). Frontend: se añade
una librería de reconocimiento facial compatible con JavaScript y React (decisión y justificación
en `research.md`); el resto del stack se mantiene. Pruebas: `vitest` + `supertest` (backend) y
`vitest` + React Testing Library (frontend).

**Almacenamiento**: MySQL 8 local, motor InnoDB, codificación `utf8mb4`, usuario dedicado para la
aplicación, credenciales por variables de entorno y consultas parametrizadas. Se añade la migración
`database/migrations/002_...sql` con las tablas `rostros`, `accesos` y `auditoria` y los ajustes
necesarios sobre `tipos_membresia`, `membresias` y `pagos` creadas en el Sprint 1. Los
descriptores faciales se guardan como JSON en `rostros` (sin imágenes) y nunca se devuelven por la
API.

**Pruebas**: `vitest` + `supertest` para la lógica de membresías, pagos y control de acceso (con
descriptores simulados) y `vitest` + React Testing Library para el frontend; la identificación
facial real se valida manualmente con cámara mediante los escenarios de `quickstart.md`.

**Plataforma objetivo**: aplicación web de escritorio en navegador moderno con acceso a cámara
(`getUserMedia`), ejecutándose en local (`localhost`) sobre Windows durante el desarrollo y la
demostración.

**Tipo de proyecto**: aplicación web con tres componentes separados (frontend, backend y base de
datos).

**Metas de rendimiento**: respuestas p95 < 300 ms en los endpoints CRUD locales; identificación
facial (procesamiento en navegador + comparación en backend) en menos de 3 segundos por intento; el
flujo de demostración completo (SC-001) se completa en menos de 5 minutos.

**Restricciones**: ES Modules obligatorios (sin `require()` ni `module.exports`); carpetas
`frontend/`, `backend/` y `database/` sin variantes; el descriptor facial nunca se expone al
frontend ni por endpoints públicos; no se almacenan imágenes faciales; umbral de coincidencia y
máximo de intentos por variable de entorno; sin pagos parciales ni procesamiento de pagos externo;
historial de membresías, pagos y accesos no se elimina de forma ordinaria; sin secretos en el
repositorio.

**Escala/alcance**: 9 historias de usuario, 4 roles, 6 tablas operativas (3 nuevas y 3 ya creadas),
37 requisitos funcionales, aproximadamente 22 endpoints REST y un entorno local de demostración con
decenas de registros.

No hay elementos `NEEDS CLARIFICATION` pendientes: todas las decisiones abiertas del spec
(librería de reconocimiento facial, ubicación del procesamiento, almacenamiento del descriptor,
umbral de coincidencia, métodos de pago, política de renovación, definición de adeudo, auditoría)
quedaron resueltas en `research.md`.

## Revisión de la constitución

*GATE: debe superarse antes de la investigación de la Fase 0. Se vuelve a evaluar tras el diseño de
la Fase 1.*

| Principio | Resultado | Evidencia en el plan |
|-----------|-----------|----------------------|
| I. Alcance, MVP y fuente de verdad | PASS | Solo alcance de Sprint 2 (`docs/sprint-2.md`); no se abordan dashboard ni reportes avanzados (Sprint 3). |
| II. Arquitectura con responsabilidades separadas | PASS | Frontend/backend/BD separados; reconocimiento facial y control de acceso como módulos comunicados; lógica en servicios del backend. |
| III. Stack tecnológico y base de datos local | PASS | React + Express + MySQL local; JWT y bcrypt reutilizados; una única dependencia nueva de reconocimiento facial justificada en `research.md`; conexión por variables de entorno. |
| IV. Base de datos y persistencia | PASS | Tablas `tipos_membresia`, `membresias`, `pagos`, `rostros`, `accesos`, `auditoria`; InnoDB; `utf8mb4`; llaves primarias y foráneas; historiales sin borrado ordinario. |
| V. Seguridad y protección de la información | PASS | Descriptor facial tratado como dato sensible, nunca devuelto por la API; secretos en `.env`; permisos validados en backend; errores sin información interna. |
| VI. Roles y permisos | PASS | Administrador gestiona todo; recepcionista registra membresías, pagos, rostros y consulta accesos; entrenador consulta estado y accesos sin información financiera; cliente solo su información. |
| VII. Integridad de las reglas de negocio | PASS | Membresía ligada a cliente y tipo válidos; estados activa/vencida/suspendida/cancelada; acceso solo con membresía válida; todo intento se registra con motivo. |
| VIII. Reconocimiento facial y control de acceso | PASS | Facial solo para identificar clientes registrados y validar acceso; coincidencia facial no basta sin membresía vigente; sin vigilancia ni seguimiento. |
| IX. API y manejo de errores | PASS | API REST con JSON y códigos HTTP; middlewares de autenticación y autorización reutilizados; validación de entradas; manejo centralizado de errores extendido. |
| X. Pruebas | PASS | Estrategia en `research.md`; cobertura de membresías, pagos, adeudos, reconocimiento (lógica de comparación) y autorización/rechazo de accesos, verificable en `quickstart.md`. |
| XI. UX/UI profesional y sencilla | PASS | Mensajes de éxito y error en español, estados de membresía y acceso visibles, confirmaciones en acciones destructivas y captura facial guiada. |

**Resultado del GATE**: PASS (0 violaciones). Se permite avanzar a la Fase 0.

**Re-evaluación tras el diseño de la Fase 1**: PASS. Los artefactos generados
(`research.md`, `data-model.md`, `contracts/`, `quickstart.md`) no introducen nuevas violaciones:
el modelo de datos respeta InnoDB/`utf8mb4`/integridad referencial y el no-borrado de historiales;
el contrato de API protege el descriptor facial y exige autenticación/autorización en backend; el
contrato de control de acceso garantiza que la identificación facial precede a la validación de
membresía; la guía de validación cubre las pruebas exigidas por el principio X. Ningún
`NEEDS CLARIFICATION` queda sin resolver.

## Estructura del proyecto

### Documentación (esta funcionalidad)

```text
specs/002-membresias-pagos-acceso-facial/
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
│   ├── package.json          # Añade la librería de reconocimiento facial
│   ├── vite.config.js
│   ├── index.html
│   ├── public/               # (NUEVO) pesos del modelo facial servidos localmente
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── context/          # Sesión y rol (Sprint 1)
│   │   ├── components/       # Componentes reutilizables, captura facial
│   │   ├── pages/            # Tipos de membresía, membresías, pagos, accesos, perfil
│   │   ├── services/         # Cliente HTTP contra la API REST, servicio de reconocimiento
│   │   ├── facerecognition/  # (NUEVO) carga del modelo y generación del descriptor facial
│   │   └── styles/           # CSS propio con variables
│   └── tests/
│
├── backend/
│   ├── package.json          # Mantiene "type": "module"; sin dependencias nuevas
│   ├── .env.example
│   ├── src/
│   │   ├── config/           # Variables de entorno y conexión a MySQL
│   │   ├── routes/           # Se añaden rutas de membresías, pagos, rostros, accesos, auditoría
│   │   ├── controllers/
│   │   ├── services/         # Lógica de membresías, pagos, comparación facial, control de acceso
│   │   ├── models/
│   │   ├── middlewares/      # autenticación, autorización, manejo de errores, auditoría
│   │   ├── validators/
│   │   └── utils/            # Comparación de descriptores (distancia euclídea)
│   ├── tests/
│   │   ├── unit/
│   │   └── integration/
│   └── app.js / server.js
│
├── database/
│   ├── README.md
│   ├── migrations/           # 001 (Sprint 1) + 002 (Sprint 2: rostros, accesos, auditoria)
│   ├── seeds/                # Semilla admin (Sprint 1) y datos de demostración
│   └── scripts/              # Aplicador de migraciones (ES Modules)
│
├── .env.example
├── .gitignore
└── README.md
```

**Decisión de estructura**: se mantiene la estructura de aplicación web de tres componentes
(`frontend/`, `backend/`, `database/`) impuesta por los sprints previos. No se crean carpetas
alternativas (`client/`, `server/`, `dataBase/`). Se añade `frontend/public/models/` para servir
localmente los pesos del modelo facial (sin CDN) y `frontend/src/facerecognition/` para aislar la
carga del modelo y la generación del descriptor, manteniendo la lógica de decisión (comparación y
validación de membresía) en el backend.

## Seguimiento de complejidad

> **Rellenar SOLO si la revisión de la constitución detecta violaciones que deban justificarse.**

| Violación | Por qué es necesaria | Alternativa más simple rechazada porque |
|-----------|----------------------|-----------------------------------------|
| No aplica | La revisión de la constitución no detectó violaciones. | — |
