# Plan de implementación: Consulta de pagos y adeudos

**Rama**: `005-consulta-pagos-adeudos` | **Fecha**: 2026-11-20 | **Espec**:
[spec.md](./spec.md)

**Entrada**: Especificación de la funcionalidad desde
`/specs/005-consulta-pagos-adeudos/spec.md`

## Resumen

Esta funcionalidad cierra los requisitos pendientes `US-G11` y `US-S2-05` del MVP: consultar el
historial de pagos y los adeudos. No es un Sprint 5 ni una ampliación de alcance; agrega solo
operaciones de lectura sobre la tabla `pagos`, que ya existe y ya registra pagos mediante
`POST /api/pagos`.

El flujo central es: administrador y recepcionista consultan el historial general con filtros y
paginación, y consultan los adeudos agrupados por cliente; el cliente consulta únicamente sus pagos y
sus adeudos; entrenador y roles no autorizados reciben `403`, y las peticiones sin token reciben
`401`. El backend resuelve al cliente a partir del `correo` del JWT, igual que los endpoints `/yo`
existentes, y calcula el adeudo como la suma de pagos con estado `pendiente`.

La implementación reutiliza `pago.model.js`, `pago.presentador.js`, los middlewares `autenticar` y
`autorizar`, el validador común de estados de pago y el cliente HTTP del frontend. No se crean
tablas, columnas, migraciones ni dependencias nuevas; no se modifica el historial financiero, no se
agregan pasarelas de pago, facturación, cobranza, notificaciones ni consulta de auditoría.

## Contexto técnico

**Lenguaje/Versión**: JavaScript (ES2022) con ES Modules en `backend/`, `database/scripts/` y
`frontend/`; Node.js 20 LTS; React 18 con Vite en `frontend/`.

**Dependencias principales**: sin dependencias nuevas. Backend: `express`, `mysql2`, `bcrypt`,
`jsonwebtoken`, `cors` y `dotenv`. Frontend: React, React DOM, React Router y
`@vladmandic/face-api` (este último no se usa en esta funcionalidad). Pruebas: `vitest` +
`supertest` en backend y `vitest` + React Testing Library en frontend.

**Almacenamiento**: MySQL 8 local, InnoDB y `utf8mb4`. Se reutilizan `pagos`, `clientes`,
`membresias`, `tipos_membresia` y `usuarios`. Los índices existentes
`ix_pagos_cliente`, `idx_fecha_pago`, `idx_pagos_estado_fecha` y
`idx_pagos_estado_fecha_metodo` cubren los filtros previstos; no se agrega ninguna migración SQL.

**Pruebas**: pruebas de integración con `vitest` + `supertest` para los cuatro endpoints, permisos,
filtros, paginación y cálculo de adeudos; prueba unitaria del validador de consulta; pruebas de
componentes con React Testing Library para las vistas. La verificación manual y de rendimiento está
en [quickstart.md](./quickstart.md).

**Plataforma objetivo**: aplicación web de escritorio en navegador moderno, ejecutada en local
(`localhost`) durante el desarrollo y la demostración académica.

**Tipo de proyecto**: aplicación web con tres componentes separados (`frontend/`, `backend/` y
`database/`).

**Metas de rendimiento**: consultas de pagos y adeudos por debajo de 500 ms con 10,000 pagos en el
entorno local; consultas apoyadas por índices verificables con `EXPLAIN`; respuestas paginadas para
evitar transferencias extensas.

**Restricciones**: ES Modules obligatorios; sin ORM ni dependencias nuevas; el frontend nunca accede
a MySQL; los roles se validan siempre en el backend; el cliente se resuelve por el `correo` del
token JWT, nunca por parámetros de la petición; `limite` por defecto 50 y máximo 200; las consultas
son de solo lectura; ninguna respuesta contiene credenciales, secretos ni descriptores faciales;
`POST /api/pagos` y los reportes del Sprint 4 permanecen intactos.

**Escala/alcance**: 3 historias de usuario, 19 requisitos funcionales, 8 criterios de éxito, 4
endpoints de solo lectura, 4 vistas de frontend, 2 módulos de navegación y ninguna migración nueva.

No quedan elementos `NEEDS CLARIFICATION`. Las decisiones de la especificación quedaron resueltas en
la sesión de `/speckit.clarify` del 2026-11-19 y se detallan en [research.md](./research.md).

## Revisión de la constitución

*GATE: debe superarse antes de la investigación de la Fase 0. Se vuelve a evaluar tras el diseño de
la Fase 1.*

| Principio | Resultado | Evidencia en el plan |
|-----------|-----------|----------------------|
| I. Alcance, MVP y fuente de verdad | PASS | Cierra `US-G11` y `US-S2-05` documentados; no crea un Sprint 5 ni agrega módulos de negocio, pasarelas, facturación, cobranza, notificaciones ni auditoría. |
| II. Arquitectura con responsabilidades separadas | PASS | Se mantiene `frontend/`, `backend/` y `database/`; la consulta se organiza en `routes/` → `controllers/` → `services/` → `models/` con `presenters/` y `validators/`. |
| III. Stack tecnológico y base de datos local | PASS | React, Node.js/Express, MySQL local, JWT y ES Modules se mantienen; no se incorpora tecnología ni dependencia nueva. |
| IV. Base de datos y persistencia | PASS | No se crean tablas ni columnas; no se eliminan ni modifican pagos; la integridad referencial de `pagos` queda intacta. |
| V. Seguridad y protección de información | PASS | Autenticación JWT y validación de filtros en backend; mensajes claros sin detalles técnicos; no se devuelven secretos, credenciales ni datos biométricos. |
| VI. Roles y permisos | PASS | Historial y adeudos generales: administrador y recepcionista; historial y adeudos propios: cliente; entrenador y otros roles: `403`. |
| VII. Integridad de las reglas de negocio | PASS | El adeudo suma solo pagos `pendientes`; los pagos sin membresía aparecen en el historial y cuentan si están pendientes; la consulta no altera el historial financiero. |
| VIII. Reconocimiento facial y control de acceso | PASS | No se toca el flujo facial ni el control de acceso; no se exponen descriptores ni datos biométricos. |
| IX. API y manejo de errores | PASS | Cuatro rutas REST JSON, middlewares existentes, validación centralizada de parámetros y errores con códigos HTTP coherentes. |
| X. Pruebas | PASS | Pruebas de integración para los tres escenarios y de componentes para la interfaz, además de verificación de índices y rendimiento en [quickstart.md](./quickstart.md). |
| XI. UX/UI profesional y sencilla | PASS | Vistas en español, filtros visibles, mensajes de estado vacío, totales claros y navegación por módulos coherente con el resto del sistema. |

**Resultado del GATE**: PASS (0 violaciones). Se permite avanzar a la Fase 0.

**Re-evaluación tras el diseño de la Fase 1**: PASS. Los artefactos de diseño no introducen
violaciones: `data-model.md` no propone cambios de esquema, los contratos exigen autenticación y
autorización en backend y la guía de validación cubre permisos, estados vacíos, adeudos y
rendimiento. No queda ningún `NEEDS CLARIFICATION` abierto.

## Estado de partida y brechas

| Capacidad | Estado actual en el repositorio | Trabajo de este plan |
|-----------|---------------------------------|----------------------|
| Registro de pagos | `POST /api/pagos` implementado en `pago.routes.js` | Sin cambios |
| Modelo de pagos | `listar()` y `listarPorCliente()` existen, pero no están expuestos ni paginados | Ampliar con consulta filtrada, paginada y agregación de adeudos |
| Servicio de pagos | Solo expone `registrar` | Agregar funciones de lectura y resolución del cliente por correo |
| Validación de consulta | No existe validador de filtros ni de paginación | Crear `pagoConsulta.validator.js` sobre validadores comunes |
| Presentación | `presentarPago` ya define el formato de salida | Reutilizarlo; agregar un resumen de cliente para adeudos |
| Endpoints de consulta | No existen `GET` de pagos | Agregar cuatro rutas `GET` |
| Frontend | Solo existe `PagosRegistro.jsx` | Agregar vistas de historial, adeudos, mis pagos y mis adeudos |
| Índices | `ix_pagos_cliente`, `idx_fecha_pago` e índices compuestos ya aplicados | Verificar con `EXPLAIN`; sin migración nueva |

## Estructura del proyecto

### Documentación (esta funcionalidad)

```text
specs/005-consulta-pagos-adeudos/
├── plan.md              # Este archivo (/speckit.plan)
├── research.md          # Salida de la Fase 0
├── data-model.md        # Salida de la Fase 1
├── quickstart.md        # Salida de la Fase 1
├── contracts/           # Salida de la Fase 1
│   ├── api-rest.md
│   └── formato-errores.md
└── tasks.md             # Salida de la Fase 2 (/speckit.tasks, NO lo crea /speckit.plan)
```

### Código fuente (raíz del repositorio)

```text
gymaccess/
├── frontend/
│   └── src/
│       ├── App.jsx                      # Módulos /payments y /me/payments
│       ├── components/Navbar.jsx        # Enlaces de navegación por rol
│       ├── pages/
│       │   ├── PagosRegistro.jsx        # Existente, sin cambios funcionales
│       │   ├── PagosHistorial.jsx       # Nuevo: historial general
│       │   ├── Adeudos.jsx              # Nuevo: adeudos generales
│       │   ├── MisPagos.jsx             # Nuevo: historial del cliente
│       │   └── MisAdeudos.jsx           # Nuevo: adeudos del cliente
│       ├── services/api.js              # Cliente HTTP existente, sin cambios
│       └── tests/                       # Pruebas de componentes nuevas
│
├── backend/
│   └── src/
│       ├── routes/
│       │   ├── index.js                 # Sin cambios: ya monta pagoRouter
│       │   └── pago.routes.js           # Cuatro rutas GET nuevas
│       ├── controllers/pago.controller.js
│       ├── services/pago.service.js     # Funciones de solo lectura nuevas
│       ├── models/pago.model.js         # Consultas filtradas y agregadas nuevas
│       ├── presenters/
│       │   ├── pago.presentador.js      # Se reutiliza
│       │   └── cliente.presentador.js   # Resumen de cliente nuevo
│       ├── validators/
│       │   ├── comunes.validator.js     # Sin cambios
│       │   └── pagoConsulta.validator.js# Nuevo: filtros y paginación
│       ├── middlewares/                 # autenticar/autorizar reutilizados
│       └── utils/                       # errores.js y fechas.js reutilizados
│   └── tests/
│       ├── unit/pagoConsulta.validator.test.js
│       └── integration/pagosConsulta.test.js
│
└── database/
    └── migrations/                       # Sin archivos nuevos
```

**Decisión de estructura**: se mantiene la aplicación web de tres componentes de los sprints
previos. El backend conserva la separación `routes/` → `controllers/` → `services/` → `models/` y
coloca las reglas de validación de la consulta en `validators/`. Las cuatro rutas nuevas viven en el
módulo `pagos` existente, sin crear un módulo paralelo. El frontend agrega vistas a los módulos
`/payments` y `/me/payments` de `App.jsx`, reutilizando `services/api.js` y el patrón de submenú ya
usado por Clientes, Membresías y Entrenamiento. No se agrega ninguna migración SQL.

## Seguimiento de la complejidad

> **Completar SOLO si la revisión de la constitución tiene violaciones que deban justificarse.**

| Violación | Por qué es necesaria | Alternativa más simple rechazada porque |
|-----------|----------------------|------------------------------------------|
| (ninguna) | — | — |

## Fases de diseño

- **Fase 0 — Investigación**: resuelta en [research.md](./research.md) con las decisiones R36 a
  R43.
- **Fase 1 — Diseño**: resuelta en [data-model.md](./data-model.md),
  [contracts/api-rest.md](./contracts/api-rest.md),
  [contracts/formato-errores.md](./contracts/formato-errores.md) y
  [quickstart.md](./quickstart.md).
- **Fase 2 — Tareas**: se genera con `/speckit.tasks`; no forma parte de este comando.
