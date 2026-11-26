# Plan de implementación: Sprint 4 - Reportes avanzados, alertas y despliegue

**Rama**: `004-reportes-notificaciones-despliegue` | **Fecha**: 2026-11-05 | **Espec**:
[spec.md](./spec.md)

**Entrada**: Especificación de la funcionalidad desde
`/specs/004-reportes-notificaciones-despliegue/spec.md`

## Resumen

El Sprint 4 cierra el MVP de GymAccess con tres bloques de valor: reportes analíticos exportables
(financiero, de accesos y de clientes vencidos), alertas visuales de membresías próximas a vencer y
la preparación del sistema para una demostración reproducible y sin secretos en el repositorio.

El flujo central es: el administrador consulta el reporte financiero de un periodo y lo exporta; el
administrador revisa la concurrencia de accesos por hora y también la exporta; el administrador o
recepcionista consultan el reporte de clientes vencidos; el personal ve las alertas de vencimiento
próximo en el dashboard y en membresías; y el equipo verifica que la base se reconstruye solo con
migraciones versionadas, que las consultas usan índices y que el frontend y el backend arrancan con
variables de entorno documentadas.

El enfoque técnico reutiliza la arquitectura y el stack de los Sprints 1 a 3: backend Node.js +
Express con ES Modules, `mysql2/promise` con consultas parametrizadas, frontend React 18 con Vite,
MySQL 8 local (InnoDB/`utf8mb4`) y migraciones SQL numeradas. No se agregan dependencias de terceros:
el CSV se genera en el navegador y el PDF se obtiene con la impresión del navegador y estilos
`@media print`. Los reportes solo leen datos; no crean entidades de negocio nuevas.

El repositorio ya contiene una base parcial del sprint (reporte financiero, reporte de accesos,
alertas de vencimiento, migración 004 de índices, pantalla de reportes y exportación CSV/PDF por
impresión). Este plan describe el estado objetivo completo y las brechas que faltan cerrar: filtro
por método de pago y por resultado, motivos de rechazo, reporte de clientes vencidos, auditoría de
exportaciones, índices compuestos, datos de rendimiento y validación de despliegue.

## Contexto técnico

**Lenguaje/Versión**: JavaScript (ES2022) con ES Modules en `backend/` y `database/scripts/`; Node.js
20 LTS; React 18 con Vite en `frontend/`.

**Dependencias principales**: sin dependencias nuevas. Backend: `express`, `mysql2`, `bcrypt`,
`jsonwebtoken`, `cors` y `dotenv`. Frontend: React, React DOM, React Router y la librería de
reconocimiento facial ya aprobada. Pruebas: `vitest` + `supertest` (backend) y `vitest` + React
Testing Library (frontend).

**Almacenamiento**: MySQL 8 local, InnoDB y `utf8mb4`. Se reutilizan `pagos`, `accesos`,
`membresias`, `clientes`, `tipos_membresia`, `rostros` y `auditoria`. La migración
`004_sprint4_optimizacion_reportes.sql` ya existe; este plan agrega una migración numerada nueva
(`006_sprint4_indices_compuestos.sql`) para los índices compuestos que faltan, sin modificar scripts
ya aplicados. No se crean tablas de negocio nuevas.

**Pruebas**: `vitest` + `supertest` para reportes, permisos, filtros, exportaciones (formato de datos)
y alertas; `vitest` + React Testing Library para la pantalla de reportes y las alertas; validación
manual de rendimiento con `EXPLAIN` y un script de datos de demostración. La guía está en
[quickstart.md](./quickstart.md).

**Plataforma objetivo**: aplicación web de escritorio en navegador moderno, ejecutada en local
(`localhost`) durante el desarrollo y la demostración académica.

**Tipo de proyecto**: aplicación web con tres componentes separados (`frontend/`, `backend/` y
`database/`).

**Metas de rendimiento**: validación de acceso facial < 200 ms en al menos el 95 % de las solicitudes
locales con volumen representativo; reportes de un mes con 10,000 pagos y 50,000 accesos en < 3 s;
consultas de reportes y accesos apoyadas por índices verificables con `EXPLAIN`.

**Restricciones**: ES Modules obligatorios; sin ORM ni dependencias nuevas; el frontend nunca accede
a MySQL; los reportes financieros y de accesos son exclusivos del administrador; el reporte de
clientes vencidos y las alertas admiten administrador y recepcionista; ningún reporte expone
credenciales ni descriptores faciales; no se guardan archivos temporales permanentes; `.env` no se
versiona y `.env.example` no contiene secretos reales.

**Escala/alcance**: 7 historias de usuario, 39 requisitos funcionales, 15 criterios de éxito, 3
reportes consultables, 2 formatos de exportación, 1 panel de alertas, 1 migración nueva de índices y
un entorno local de demostración con al menos 10,000 pagos y 50,000 accesos para la prueba de
rendimiento.

No quedan elementos `NEEDS CLARIFICATION`. Las decisiones abiertas del spec (generación de PDF,
franjas horarias, pagos que suman al total, definición de cliente vencido y filtro por documento)
quedaron resueltas en [research.md](./research.md).

## Revisión de la constitución

*GATE: debe superarse antes de la investigación de la Fase 0. Se vuelve a evaluar tras el diseño de
la Fase 1.*

| Principio | Resultado | Evidencia en el plan |
|-----------|-----------|----------------------|
| I. Alcance, MVP y fuente de verdad | PASS | Solo se implementa lo definido en `docs/sprint-4.md` y `spec.md`: reportes, alertas, índices y despliegue; no se agregan módulos de negocio ni notificaciones externas. |
| II. Arquitectura con responsabilidades separadas | PASS | `frontend/`, `backend/` y `database/` separados; las consultas agregadas viven en `models/`, la validación y las reglas en `services/`, y la interfaz solo consume la API REST. |
| III. Stack tecnológico y base de datos local | PASS | React, Node.js/Express, MySQL local, JWT y bcrypt se mantienen; no se agregan dependencias; el PDF usa la impresión del navegador y el CSV usa APIs nativas del navegador. |
| IV. Base de datos y persistencia | PASS | Se conservan las tablas existentes; la migración nueva solo agrega índices; InnoDB, `utf8mb4`, llaves foráneas e integridad referencial se mantienen; no se elimina historial. |
| V. Seguridad y protección de información | PASS | Roles validados en backend; reportes sin credenciales ni descriptores faciales; exportaciones sin secretos; `.env` ignorado y `.env.example` sin valores reales. |
| VI. Roles y permisos | PASS | Reportes financiero y de accesos: solo administrador. Alertas y clientes vencidos: administrador y recepcionista. Entrenador y cliente reciben `403`; el cliente no ve datos de otros. |
| VII. Integridad de las reglas de negocio | PASS | Los reportes son de solo lectura; solo suman pagos completados; las alertas solo incluyen membresías activas con vencimiento entre hoy y 5 días; la auditoría conserva trazabilidad. |
| VIII. Reconocimiento facial y control de acceso | PASS | No se altera el flujo de acceso; solo se agregan índices y medición de rendimiento; los descriptores faciales nunca salen del backend. |
| IX. API y manejo de errores | PASS | API REST en JSON, códigos HTTP consistentes, middlewares `autenticar`/`autorizar` reutilizados, validación de filtros y manejo centralizado de errores sin datos internos. |
| X. Pruebas | PASS | Pruebas de integración y componentes para los 7 escenarios, más verificación de índices, rendimiento y despliegue en [quickstart.md](./quickstart.md). |
| XI. UX/UI profesional y sencilla | PASS | Reportes en español, estados vacíos claros, alertas con color de advertencia, botones deshabilitados durante la exportación y diseño de impresión legible. |

**Resultado del GATE**: PASS (0 violaciones). Se permite avanzar a la Fase 0.

**Re-evaluación tras el diseño de la Fase 1**: PASS. Los artefactos de diseño no introducen
violaciones: `data-model.md` solo reutiliza tablas y agrega índices; `contracts/api-rest.md` exige
autenticación y autorización en backend; `contracts/exportacion-reportes.md` prohíbe secretos y datos
biométricos; `quickstart.md` cubre permisos, rendimiento, reconstrucción de base y ausencia de
secretos. No queda ningún `NEEDS CLARIFICATION` abierto.

## Estado de partida y brechas

| Capacidad | Estado actual en el repositorio | Trabajo de este plan |
|-----------|---------------------------------|----------------------|
| Reporte financiero | Implementado con total y desgloses; sin filtro por método de pago | Agregar filtro `metodoPago` y mostrarlo en pantalla y exportaciones |
| Reporte de accesos | Implementado con totales, por hora y por tipo; sin filtro por resultado ni motivos de rechazo | Agregar filtro `resultado` y desglose `porMotivoRechazo` |
| Alertas de vencimiento | Implementadas en Dashboard y Membresías | Completar pruebas y mensajes de estado vacío |
| Exportación CSV/PDF | CSV y PDF por impresión ya funcionan | Formalizar contrato, auditoría de exportación y prevención de duplicados |
| Reporte de clientes vencidos | No existe | Implementar consulta, endpoint, pantalla y exportación |
| Índices | Migración 004 con índices simples | Agregar índices compuestos en migración 006 y verificar con `EXPLAIN` |
| Rendimiento facial | Comparación en JavaScript sin medición formal | Medir con volumen representativo y documentar resultado |
| Despliegue | `.env.example`, `.gitignore` y build de Vite existentes | Verificar build, arranque con variables de entorno y ausencia de secretos |

## Estructura del proyecto

### Documentación (esta funcionalidad)

```text
specs/004-reportes-notificaciones-despliegue/
├── plan.md              # Este archivo (/speckit.plan)
├── research.md          # Salida de la Fase 0
├── data-model.md        # Salida de la Fase 1
├── quickstart.md        # Salida de la Fase 1
├── contracts/           # Salida de la Fase 1
│   ├── api-rest.md
│   ├── formato-errores.md
│   └── exportacion-reportes.md
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
│   ├── sprint-3.md
│   └── sprint-4.md
│
├── frontend/
│   ├── package.json
│   ├── vite.config.js
│   ├── index.html
│   └── src/
│       ├── main.jsx
│       ├── App.jsx                    # Ruta /reports (administrador)
│       ├── components/Navbar.jsx      # Enlace Reportes solo para administrador
│       ├── context/SesionContext.jsx
│       ├── pages/
│       │   ├── Reportes.jsx           # Reportes financiero, accesos y clientes vencidos
│       │   ├── Dashboard.jsx          # Panel de alertas de vencimiento
│       │   └── Membresias.jsx         # Filas resaltadas por vencimiento próximo
│       ├── services/api.js
│       ├── styles/styles.css          # Estilos de reportes, alertas e impresión
│       └── tests/                     # Pruebas de componentes
│
├── backend/
│   ├── package.json                   # Mantiene "type": "module"; sin dependencias nuevas
│   ├── .env.example
│   └── src/
│       ├── config/                    # entorno.js, baseDatos.js
│       ├── routes/
│       │   ├── index.js
│       │   └── reports.routes.js      # Endpoints de reportes y alertas
│       ├── controllers/reporte.controller.js
│       ├── services/
│       │   ├── reporte.service.js     # Reglas y validación de reportes
│       │   ├── auditoria.service.js   # Registro de generación/exportación
│       │   └── acceso.service.js      # Validación facial (solo medición)
│       ├── models/reporte.model.js    # Consultas agregadas de solo lectura
│       ├── presenters/reporte.presentador.js
│       ├── middlewares/
│       ├── validators/
│       └── utils/
│
├── database/
│   ├── migrations/
│   │   ├── 001_crear_estructura.sql
│   │   ├── 002_sprint2_facial_accesos.sql
│   │   ├── 003_sprint3_entrenadores_rutinas.sql
│   │   ├── 004_sprint4_optimizacion_reportes.sql
│   │   ├── 005_tipos_membresia_iniciales.sql
│   │   └── 006_sprint4_indices_compuestos.sql   # Nuevo: índices compuestos
│   ├── seeds/
│   │   ├── semilla-administrador.js
│   │   ├── semilla-demo-sprint3.js
│   │   └── semilla-rendimiento-sprint4.js       # Nuevo: volumen de prueba
│   └── scripts/aplicar-migraciones.js
│
├── .env.example
├── .gitignore
└── README.md
```

**Decisión de estructura**: se mantiene la estructura de aplicación web de tres componentes
(`frontend/`, `backend/`, `database/`) de los sprints previos. No se crean carpetas alternativas. El
backend sigue la separación `routes/` → `controllers/` → `services/` → `models/` con `presenters/`
para el contrato de salida; el frontend reutiliza la navegación por módulos de `App.jsx` y el cliente
HTTP `services/api.js`. Los reportes no crean módulos de negocio nuevos: viven en el módulo
`reportes` ya existente.

## Seguimiento de la complejidad

> **Completar SOLO si la revisión de la constitución tiene violaciones que deban justificarse.**

| Violación | Por qué es necesaria | Alternativa más simple rechazada porque |
|-----------|----------------------|------------------------------------------|
| (ninguna) | — | — |

## Fases de diseño

- **Fase 0 — Investigación**: resuelta en [research.md](./research.md) con las decisiones R25 a R35.
- **Fase 1 — Diseño**: resuelta en [data-model.md](./data-model.md),
  [contracts/api-rest.md](./contracts/api-rest.md),
  [contracts/formato-errores.md](./contracts/formato-errores.md),
  [contracts/exportacion-reportes.md](./contracts/exportacion-reportes.md) y
  [quickstart.md](./quickstart.md).
- **Fase 2 — Tareas**: se genera con `/speckit.tasks`; no forma parte de este comando.
