---

description: "Tareas, Sprint 3 - Entrenadores, rutinas y dashboard administrativo"
---

# Tareas: Sprint 3 - Entrenadores, rutinas y dashboard administrativo

**Entrada**: Documentos de diseÃ±o en `/specs/003-entrenadores-rutinas-dashboard/`

**Requisitos previos**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Pruebas**: se incluyen tareas de prueba por historia de usuario porque la constituciÃ³n
(principio X) y el equipo lo exigen.

**OrganizaciÃ³n**: las tareas se agrupan por historia de usuario para permitir su implementaciÃ³n y
prueba independientes.

## Formato: `[ID] [P?] [RL#] [Story] DescripciÃ³n`

- **[P]**: se puede ejecutar en paralelo (archivos distintos, sin dependencias).
- **[RL#]**: responsable segÃºn el equipo (ver "Responsables (equipo)").
- **[Story]**: historia de usuario a la que pertenece la tarea (US1, US2, US3...).
- Se incluye la ruta exacta de cada archivo en la descripciÃ³n.

## Responsables (equipo)

| Rol | Responsable |
|-----|-------------|
| RL1 | Product Architect & Builder (liderazgo, modelo MySQL de los sprints, conexiÃ³n Backend-API) |
| RL2 | Product Builder Frontend React (panel de recepciÃ³n y clientes) |
| RL3 | Product Builder Backend Node.js (endpoints de auth, usuarios y pagos) |
| RL4 | Product Builder Frontend React (accesos en tiempo real y mÃ³dulo de rostros) |
| RL5 | Agile Enabler / QA (Jira, historias de usuario EARS y pruebas) |
| RL6 | Product Builder (entrenadores/rutinas del Sprint 3 + estilos UI/UX) |
| RL7 | Agile Enabler (documentaciÃ³n, Specs, interesados, Project Charter) |

## Rutas del proyecto

- **Backend**: `backend/src/` y pruebas en `backend/tests/`
- **Frontend**: `frontend/src/` y pruebas en `frontend/src/tests/`
- **Base de datos**: `database/migrations/` y `database/seeds/`

---

## Fase 1: ConfiguraciÃ³n

**PropÃ³sito**: preparar la base de datos y los insumos del Sprint 3.

- [x] T001 [RL1] Crear la migraciÃ³n `database/migrations/003_sprint3_entrenadores_rutinas.sql` con las tablas `entrenadores` (`id_usuario` `NOT NULL UNIQUE FK â†’ usuarios`), `asignaciones_entrenador` (columna generada `cliente_principal_activo` con Ã­ndice `UNIQUE`), `rutinas`, `ejercicios_rutina`, `objetivos_entrenamiento` y `progresos_clientes`, todas InnoDB/`utf8mb4` con llaves forÃ¡neas `ON DELETE RESTRICT` e Ã­ndices de apoyo segÃºn `data-model.md`.
- [x] T002 [P] [RL1] Crear la semilla opcional `database/seeds/semilla-demo-sprint3.js` (un entrenador, una asignaciÃ³n y una rutina de demostraciÃ³n) y actualizar `database/README.md`.

**Punto de control**: la base se reconstruye con `001` + `002` + `003` aplicando `node database/scripts/aplicar-migraciones.js` (SC-007).

---

## Fase 2: Fundacional (requisitos bloqueantes)

**PropÃ³sito**: crear los modelos, validadores y utilidades compartidas por todas las historias.
**Ninguna historia puede empezar hasta completar esta fase.**

- [x] T003 [P] [RL3] Crear `backend/src/models/entrenador.model.js` (`crear`, `buscarPorId`, `buscarPorUsuario`, `listar`, `actualizar`, `cambiarEstado`).
- [x] T004 [P] [RL3] Crear `backend/src/models/asignacionEntrenador.model.js` (`crear`, `buscarPorId`, `listar` con filtros, `listarPorEntrenador`, `buscarPrincipalActivoPorCliente`, `finalizar`).
- [x] T005 [P] [RL3] Crear `backend/src/models/rutina.model.js` (`crear`, `crearEjercicios`, `buscarPorId`, `listar`, `listarPorCliente`, `buscarActivaPorCliente`, `archivarActivasPorCliente`, `actualizar`, `reemplazarEjercicios`).
- [x] T006 [P] [RL3] Crear `backend/src/models/objetivoEntrenamiento.model.js` (`crear`, `buscarPorId`, `listar`, `listarPorCliente`, `cambiarEstado`).
- [x] T007 [P] [RL3] Crear `backend/src/models/progresoCliente.model.js` (`crear`, `listar`, `listarPorCliente`, `listarPorObjetivo`).
- [x] T008 [P] [RL3] Crear `backend/src/validators/entrenador.validator.js` (`idUsuario` obligatorio entero; `especialidad` â‰¤ 100; `telefono` vÃ¡lido si se informa).
- [x] T009 [P] [RL3] Crear `backend/src/validators/asignacion.validator.js` (`idCliente`/`idEntrenador` obligatorios; `esPrincipal` booleano; estado en `{activa, finalizada}`).
- [x] T010 [P] [RL3] Crear `backend/src/validators/rutina.validator.js` (`idCliente` y `nombre` obligatorios, `nombre` â‰¤ 100; ejercicios con `nombre` obligatorio y `series > 0` si se informa).
- [x] T011 [P] [RL3] Crear `backend/src/validators/objetivo.validator.js` y `backend/src/validators/progreso.validator.js` (`descripcion`/`valor` obligatorios; `valorObjetivo` y `valor` numÃ©ricos; `unidad` â‰¤ 20).
- [x] T012 [RL3] AÃ±adir en `backend/src/utils/codigosError.js` los cÃ³digos `ENTRENADOR_INACTIVO`, `CLIENTE_INACTIVO`, `ENTRENADOR_NO_ASIGNADO`, `SIN_RUTINA` y `SIN_ASIGNACION` segÃºn `contracts/formato-errores.md`.

**Punto de control**: los modelos, validadores y cÃ³digos base estÃ¡n listos; pueden implementarse las historias.

---

## Fase 3: Historia de usuario 1 - Registro de entrenadores (Prioridad: P1) â€” US1

**Objetivo**: el administrador registra, consulta, modifica y activa/desactiva entrenadores
asociados a un usuario con rol `entrenador`.

**Prueba independiente**: registrar un entrenador con un usuario rol `entrenador` y verlo en la
consulta; rechazar usuarios inexistentes o con otro rol.

### Pruebas de la Historia de usuario 1

- [x] T013 [P] [RL5] [US1] Crear `backend/tests/integration/entrenadores.test.js` con casos: registro vÃ¡lido `201`, usuario inexistente `404`, usuario de otro rol `409`, usuario ya asociado `409` y recepcionista `403`.

### ImplementaciÃ³n de la Historia de usuario 1

- [x] T014 [RL3] [US1] Crear `backend/src/presenters/entrenador.presentador.js` (camelCase, sin datos sensibles del usuario).
- [x] T015 [RL3] [US1] Crear `backend/src/services/entrenador.service.js` (valida que el usuario exista, estÃ© activo y tenga rol `entrenador`; auditorÃ­a con `registrarAccion`, mÃ³dulo `entrenadores`).
- [x] T016 [RL3] [US1] Crear `backend/src/controllers/entrenador.controller.js`.
- [x] T017 [RL3] [US1] Crear `backend/src/routes/entrenador.routes.js` (`GET /entrenadores`, `GET /entrenadores/:id`, `GET /entrenadores/yo`, `POST /entrenadores`, `PATCH /entrenadores/:id`, `PATCH /entrenadores/:id/estado`) y registrar el router en `backend/src/routes/index.js`.
- [x] T018 [RL6] [US1] Crear `frontend/src/pages/Entrenadores.jsx` (listar, registrar, modificar y cambiar estado).
- [x] T019 [RL6] [US1] Registrar la vista y la opciÃ³n de menÃº de entrenadores en `frontend/src/App.jsx` y `frontend/src/components/MenuPrincipal.jsx`.
- [x] T020 [RL5] [US1] Crear `frontend/src/tests/Entrenadores.test.jsx`.

**Punto de control**: US1 funcional y verificable de forma independiente.

---

## Fase 4: Historia de usuario 2 - AsignaciÃ³n de entrenador a cliente (Prioridad: P1) â€” US2

**Objetivo**: el administrador o recepcionista asigna un entrenador a un cliente activo, con como
mÃ¡ximo un entrenador principal activo por cliente.

**Prueba independiente**: asignar un entrenador a un cliente activo y verlo en la consulta; un
segundo entrenador principal finaliza la asignaciÃ³n anterior.

### Pruebas de la Historia de usuario 2

- [x] T021 [P] [RL5] [US2] Crear `backend/tests/integration/asignaciones.test.js` con casos: asignaciÃ³n vÃ¡lida `201`, cliente inactivo `409`, entrenador inactivo `409`, entrenador principal Ãºnico (la anterior se finaliza), recepcionista autorizado y entrenador `403`.

### ImplementaciÃ³n de la Historia de usuario 2

- [x] T022 [RL3] [US2] Crear `backend/src/presenters/asignacion.presentador.js`.
- [x] T023 [RL3] [US2] Crear `backend/src/services/asignacion.service.js` (transacciÃ³n que finaliza la principal anterior y crea la nueva; valida cliente activo y entrenador activo; auditorÃ­a mÃ³dulo `asignaciones`).
- [x] T024 [RL3] [US2] Crear `backend/src/controllers/asignacion.controller.js`.
- [x] T025 [RL3] [US2] Crear `backend/src/routes/asignacion.routes.js` (`GET /asignaciones`, `GET /asignaciones/:id`, `GET /asignaciones/entrenador/:idEntrenador`, `GET /asignaciones/yo`, `POST /asignaciones`, `PATCH /asignaciones/:id/estado`) y registrar el router en `backend/src/routes/index.js`.
- [x] T026 [RL6] [US2] Crear `frontend/src/pages/Asignaciones.jsx` (asignar cliente a entrenador y finalizar asignaciones).
- [x] T027 [RL6] [US2] Registrar la vista y la opciÃ³n de menÃº de asignaciones en `frontend/src/App.jsx` y `frontend/src/components/MenuPrincipal.jsx`.
- [x] T028 [RL5] [US2] Crear `frontend/src/tests/Asignaciones.test.jsx`.

**Punto de control**: US1 y US2 funcionan de forma independiente.

---

## Fase 5: Historia de usuario 3 - CreaciÃ³n de rutinas (Prioridad: P1) â€” US3

**Objetivo**: el entrenador crea y administra la rutina de los clientes a su cargo, con sus
ejercicios.

**Prueba independiente**: el entrenador crea una rutina con ejercicios para un cliente asignado; un
intento sobre un cliente ajeno se rechaza.

### Pruebas de la Historia de usuario 3

- [x] T029 [P] [RL5] [US3] Crear `backend/tests/integration/rutinas.test.js` con casos: creaciÃ³n con ejercicios, cliente ajeno `403`, administrador `403`, archivado de la rutina anterior y reemplazo de ejercicios.

### ImplementaciÃ³n de la Historia de usuario 3

- [x] T030 [RL3] [US3] Crear `backend/src/presenters/rutina.presentador.js`.
- [x] T031 [RL3] [US3] Crear `backend/src/services/rutina.service.js` (valida la asignaciÃ³n del cliente al entrenador; archiva la rutina activa anterior; auditorÃ­a mÃ³dulo `rutinas`).
- [x] T032 [RL3] [US3] Crear `backend/src/controllers/rutina.controller.js`.
- [x] T033 [RL3] [US3] Crear `backend/src/routes/rutina.routes.js` (`GET /rutinas`, `GET /rutinas/:id`, `GET /rutinas/cliente/:idCliente`, `POST /rutinas`, `PATCH /rutinas/:id`, `PUT /rutinas/:id/ejercicios`) y registrar el router en `backend/src/routes/index.js`.
- [x] T034 [RL6] [US3] Crear `frontend/src/pages/Rutinas.jsx` (crear rutina con ejercicios y editar la lista).
- [x] T035 [RL6] [US3] Registrar la vista y la opciÃ³n de menÃº de rutinas en `frontend/src/App.jsx` y `frontend/src/components/MenuPrincipal.jsx`.
- [x] T036 [RL5] [US3] Crear `frontend/src/tests/Rutinas.test.jsx`.

**Punto de control**: US1, US2 y US3 funcionan de forma independiente.

---

## Fase 6: Historia de usuario 4 - Objetivos y progresos (Prioridad: P2) â€” US4

**Objetivo**: el entrenador registra objetivos y progresos de los clientes a su cargo, conservando
el historial.

**Prueba independiente**: registrar un objetivo y dos progresos para un cliente a cargo y ver el
historial completo en orden.

### Pruebas de la Historia de usuario 4

- [x] T037 [P] [RL5] [US4] Crear `backend/tests/integration/objetivosProgresos.test.js` con casos: registro de objetivo y progreso, historial en orden, cliente ajeno `403`, recepcionista/administrador `403` y objetivo de otro cliente `404`.

### ImplementaciÃ³n de la Historia de usuario 4

- [x] T038 [P] [RL3] [US4] Crear `backend/src/presenters/objetivo.presentador.js` y `backend/src/presenters/progreso.presentador.js`.
- [x] T039 [RL3] [US4] Crear `backend/src/services/objetivo.service.js` (valida la asignaciÃ³n del cliente al entrenador; auditorÃ­a mÃ³dulo `objetivos`).
- [x] T040 [RL3] [US4] Crear `backend/src/services/progreso.service.js` (valida la asignaciÃ³n y que `idObjetivo` pertenezca al mismo cliente; auditorÃ­a mÃ³dulo `progresos`).
- [x] T041 [RL3] [US4] Crear `backend/src/controllers/objetivo.controller.js` y `backend/src/controllers/progreso.controller.js`.
- [x] T042 [RL3] [US4] Crear `backend/src/routes/objetivo.routes.js` (`GET /objetivos`, `GET /objetivos/cliente/:idCliente`, `POST /objetivos`, `PATCH /objetivos/:id/estado`) y `backend/src/routes/progreso.routes.js` (`GET /progresos`, `GET /progresos/cliente/:idCliente`, `POST /progresos`) y registrar ambos routers en `backend/src/routes/index.js`.
- [x] T043 [RL6] [US4] Crear `frontend/src/pages/Progreso.jsx` (registrar objetivos y progresos y ver el historial).
- [x] T044 [RL6] [US4] Registrar la vista y la opciÃ³n de menÃº de progreso en `frontend/src/App.jsx` y `frontend/src/components/MenuPrincipal.jsx`.
- [x] T045 [RL5] [US4] Crear `frontend/src/tests/Progreso.test.jsx`.

**Punto de control**: las historias P1 y US4 funcionan de forma independiente.

---

## Fase 7: Historia de usuario 5 - Consulta de rutina y progreso (Prioridad: P2) â€” US5

**Objetivo**: el cliente consulta Ãºnicamente su propia rutina y su propio progreso.

**Prueba independiente**: un cliente autenticado ve su rutina vigente y su historial de progreso, y
no puede ver los de otro cliente.

### Pruebas de la Historia de usuario 5

- [x] T046 [P] [RL5] [US5] Crear `backend/tests/integration/miEntrenamiento.test.js` con casos: rutina propia `200`, progreso propio `200` en orden, acceso a datos ajenos `403` y rutas protegidas por rol.

### ImplementaciÃ³n de la Historia de usuario 5

- [x] T047 [RL3] [US5] Implementar en los controladores/servicios existentes los endpoints `GET /api/rutinas/yo`, `GET /api/objetivos/yo` y `GET /api/progresos/yo` con presentadores filtrados para el rol `cliente`.
- [x] T048 [RL6] [US5] Crear `frontend/src/pages/MiEntrenamiento.jsx` (rutina y evoluciÃ³n del cliente).
- [x] T049 [RL6] [US5] Registrar la vista y la opciÃ³n de menÃº "Mi entrenamiento" en `frontend/src/App.jsx` y `frontend/src/components/MenuPrincipal.jsx`.
- [x] T050 [RL5] [US5] Crear `frontend/src/tests/MiEntrenamiento.test.jsx`.

**Punto de control**: el cliente consulta su informaciÃ³n sin exponer la de otros.

---

## Fase 8: Historia de usuario 6 - Dashboard administrativo (Prioridad: P2) â€” US6

**Objetivo**: el administrador supervisa indicadores resumidos; el recepcionista accede solo al
resumen operativo del personal.

**Prueba independiente**: el administrador ve los indicadores; el recepcionista solo accede a
`/api/dashboard/personal`.

### Pruebas de la Historia de usuario 6

- [x] T051 [P] [RL5] [US6] Crear `backend/tests/integration/dashboard.test.js` con casos: resumen del administrador `200`, recepcionista en `/dashboard` `403`, recepcionista en `/dashboard/personal` `200` y dashboard sin datos con indicadores en cero.

### ImplementaciÃ³n de la Historia de usuario 6

- [x] T052 [RL3] [US6] Crear `backend/src/services/dashboard.service.js` (consultas agregadas sobre `clientes`, `entrenadores`, `asignaciones_entrenador`, `rutinas`, `objetivos_entrenamiento`, `membresias` y `accesos`; R18).
- [x] T053 [RL3] [US6] Crear `backend/src/presenters/dashboard.presentador.js` (omite indicadores reservados al administrador cuando el rol es `recepcionista`).
- [x] T054 [RL3] [US6] Crear `backend/src/controllers/dashboard.controller.js`.
- [x] T055 [RL3] [US6] Crear `backend/src/routes/dashboard.routes.js` (`GET /dashboard`, `GET /dashboard/personal`) y registrar el router en `backend/src/routes/index.js`.
- [x] T056 [RL6] [US6] Crear `frontend/src/pages/Dashboard.jsx` (indicadores del administrador y vista operativa del recepcionista).
- [x] T057 [RL6] [US6] Registrar la vista y la opciÃ³n de menÃº del dashboard en `frontend/src/App.jsx` y `frontend/src/components/MenuPrincipal.jsx`.
- [x] T058 [RL5] [US6] Crear `frontend/src/tests/Dashboard.test.jsx`.

**Punto de control**: cada rol ve los indicadores que le corresponden.

---

## Fase 9: Historia de usuario 7 - Consulta del personal asignado (Prioridad: P3) â€” US7

**Objetivo**: el administrador o recepcionista consulta los clientes asignados a cada entrenador.

**Prueba independiente**: se listan los clientes de un entrenador y el cliente no accede a la
consulta.

### Pruebas de la Historia de usuario 7

- [x] T059 [P] [RL5] [US7] Crear `backend/tests/integration/personalAsignado.test.js` con casos: listado por entrenador `200`, entrenador consultando su propia carga `200` y cliente `403`.

### ImplementaciÃ³n de la Historia de usuario 7

- [x] T060 [RL3] [US7] Asegurar los endpoints `GET /asignaciones/entrenador/:idEntrenador` y `GET /asignaciones/yo` (creados en la Fase 4) con los permisos de esta historia.
- [x] T061 [RL6] [US7] Crear `frontend/src/pages/PersonalAsignado.jsx` (clientes asignados por entrenador).
- [x] T062 [RL6] [US7] Registrar la vista y la opciÃ³n de menÃº del personal asignado en `frontend/src/App.jsx` y `frontend/src/components/MenuPrincipal.jsx`.
- [x] T063 [RL5] [US7] Crear `frontend/src/tests/PersonalAsignado.test.jsx`.

**Punto de control**: las 7 historias de usuario funcionan de forma independiente.

---

## Fase 10: Pulido y asuntos transversales

**PropÃ³sito**: mejoras que afectan a varias historias.

- [x] T064 [RL3] Verificar que los servicios del sprint registran auditorÃ­a (`registrarAccion`) en los mÃ³dulos `entrenadores`, `asignaciones`, `rutinas`, `objetivos` y `progresos` (FR-030).
- [ ] T065 [RL6] Revisar estilos y consistencia visual de las pantallas nuevas en `frontend/src/styles/` y los mensajes de Ã©xito/error en espaÃ±ol (FR-024).
- [ ] T066 [RL5] Ejecutar y registrar la validaciÃ³n de `quickstart.md` (escenarios 1 a 27) y confirmar la matriz de permisos por rol (SC-002).
- [ ] T067 [RL7] Actualizar `README.md` y la documentaciÃ³n del proyecto con el alcance del Sprint 3.
- [x] T068 [RL1] Verificar `node --check` en los archivos nuevos, la carga de `backend/src/app.js` y `npm run build` en el frontend.

**Punto de control**: el sprint queda listo para la demostraciÃ³n (SC-010).

---

## Dependencias y orden de ejecuciÃ³n

### Dependencias por fase

- **ConfiguraciÃ³n (Fase 1)**: sin dependencias; puede empezar de inmediato.
- **Fundacional (Fase 2)**: depende de la Fase 1 y **bloquea** todas las historias.
- **Historias (Fases 3 a 9)**: dependen de la Fase 2; pueden ejecutarse en paralelo (si hay equipo)
  o en orden de prioridad.
- **Pulido (Fase 10)**: depende de que las historias deseadas estÃ©n completas.

### Dependencias entre historias de usuario

- **US1 (P1)**: sin dependencias tras la Fase 2.
- **US2 (P1)**: depende de US1 (usa `entrenadores`).
- **US3 (P1)**: depende de US2 (valida la asignaciÃ³n activa).
- **US4 (P2)**: depende de US3 (registra progreso sobre clientes a cargo).
- **US5 (P2)**: depende de US3 y US4.
- **US6 (P2)**: depende de US1, US2, US3 y US4 (consume sus datos agregados).
- **US7 (P3)**: depende de US2.

### Dentro de cada historia

- Las pruebas se escriben primero y deben fallar antes de implementar (si se adopta TDD).
- Modelos antes que servicios; servicios antes que controladores; controladores antes que rutas.
- Completar una historia antes de pasar a la siguiente prioridad.

### Oportunidades de paralelizaciÃ³n

- Todas las tareas [P] de la Fase 2 pueden ejecutarse en paralelo.
- Las pruebas [P] de cada historia pueden escribirse en paralelo.
- Distintas historias pueden abordarse en paralelo por miembros del equipo una vez completada la
  Fase 2.

---

## Ejemplo de paralelizaciÃ³n: Fase 2

```bash
# Lanzar en paralelo los modelos y validadores de la Fase 2:
Task: "Crear backend/src/models/entrenador.model.js"
Task: "Crear backend/src/models/asignacionEntrenador.model.js"
Task: "Crear backend/src/validators/entrenador.validator.js"
Task: "Crear backend/src/validators/rutina.validator.js"
```

---

## Estrategia de implementaciÃ³n

### MVP primero

1. Completar la Fase 1 y la Fase 2.
2. Completar la Fase 3 (US1) y la Fase 4 (US2): ya existe valor demostrable (entrenadores
   registrados y asignados).
3. Detenerse y validar con `quickstart.md` (escenarios 1 a 6).

### Entrega incremental

1. **Fase 1â€“2**: base de datos, modelos y utilidades.
2. **Fase 3 (US1)** y **Fase 4 (US2)**: gestiÃ³n y asignaciÃ³n de entrenadores.
3. **Fase 5 (US3)**: rutinas del entrenador.
4. **Fase 6 (US4)** y **Fase 7 (US5)**: objetivos, progresos y consulta del cliente.
5. **Fase 8 (US6)** y **Fase 9 (US7)**: dashboard y personal asignado.
6. **Fase 10**: pulido, auditorÃ­a y validaciÃ³n final.

### Trabajo en paralelo por rol

- **RL3 (backend)** y **RL6 (frontend/UI)** avanzan en paralelo una vez completada la Fase 2.
- **RL5 (QA)** prepara las pruebas de cada historia en paralelo con la implementaciÃ³n.
- **RL1 (arquitectura)** lidera la Fase 1 y la Fase 2; **RL7 (docs)** mantiene la documentaciÃ³n.

## Notas

- Ninguna historia se considera terminada sin sus pruebas y el escenario correspondiente de
  `quickstart.md`.
- El historial de asignaciones, rutinas, objetivos y progresos no se elimina de forma ordinaria.
- Los permisos se validan siempre en el backend, aunque el frontend oculte opciones.

