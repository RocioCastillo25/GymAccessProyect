---

description: "Lista de tareas para la funcionalidad Consulta de pagos y adeudos"
---

# Tareas: Consulta de pagos y adeudos

**Entrada**: documentos de diseño de `/specs/005-consulta-pagos-adeudos/`

**Requisitos previos**: `plan.md` y `spec.md` (obligatorios), `research.md`, `data-model.md` y
`contracts/`

**Pruebas**: se incluyen tareas de prueba porque la especificación exige verificación de extremo a
extremo (SC-008) y la constitución exige probar las funciones principales. Las pruebas se escriben
primero y deben fallar antes de la implementación.

**Organización**: las tareas se agrupan por historia de usuario para permitir implementación, prueba
y entrega independientes.

## Formato: `[ID] [P?] [Historia] Descripción`

- **[P]**: se puede ejecutar en paralelo (archivos distintos, sin depender de tareas incompletas).
- **[Historia]**: etiqueta `US1`, `US2` o `US3` en las fases de historias de usuario.
- Incluye la ruta exacta del archivo en cada descripción.

## Convenciones de rutas

- **Aplicación web**: `backend/src/`, `frontend/src/` y `database/`.
- Las rutas relativas se resolven desde la raíz del repositorio `C:\gymaccess`.

---

## Fase 1: Configuración (infraestructura compartida)

**Propósito**: confirmar el entorno existente sin crear un proyecto nuevo ni agregar dependencias.

- [X] T001 [P] Verificar en `backend/package.json` que `vitest` y `supertest` están disponibles y en `frontend/package.json` que `vitest`, `@testing-library/react` y `jsdom` están disponibles, sin instalar dependencias nuevas.
- [X] T002 [P] Confirmar en `backend/src/routes/index.js` que `pagoRouter` ya está montado bajo `/api` y en `backend/src/app.js` que el manejo centralizado de errores está activo, sin crear un módulo nuevo.

---

## Fase 2: Fundamentos (requisitos previos bloqueantes)

**Propósito**: infraestructura compartida que DEBE estar lista antes de iniciar cualquier historia.

**IMPORTANTE**: ninguna historia de usuario puede comenzar hasta terminar esta fase.

- [X] T003 [P] Crear `backend/tests/unit/pagoConsulta.validator.test.js` con casos para `limite` de 1 a 200 con valor por defecto 50, `offset` entero ≥ 0 con valor por defecto 0, `fechaInicio` posterior a `fechaFin`, estados `pendiente|completado|cancelado`, `idCliente` entero positivo y errores con `{ campo, error }` y `codigo: VALIDACION`.
- [X] T004 Crear `backend/src/validators/pagoConsulta.validator.js` con `validarConsultaPagos(query)` que reutilice `validarId`, `validarFecha`, `validarEstadoPago`, `validarEnteroPositivo` y `validarEnteroNoNegativo` de `backend/src/validators/comunes.validator.js` y aplique literalmente: "`limite`: entero de 1 a 200" y "`offset`: entero ≥ 0".
- [X] T005 [P] Extender `backend/src/models/pago.model.js` con `listarFiltrados(filtros)` y `contarFiltrados(filtros)` usando `COLUMNAS_PAGO`, filtros opcionales de `id_cliente`, `estado` y rango `[fechaInicio 00:00:00, fechaFin + 1 día 00:00:00)`, orden "`fecha_pago DESC, id_pago DESC`" y `LIMIT ? OFFSET ?`, apoyándose en `ix_pagos_cliente` e `idx_fecha_pago`.
- [X] T006 [P] Agregar `obtenerClientePorCorreo(correo)` en `backend/src/services/cliente.service.js` usando `clienteModelo.buscarPorCorreo` y lanzando `errorNoEncontrado('No se encontró el cliente asociado a la sesión.')` cuando no exista el cliente.

**Punto de control**: fundamentos listos; las historias pueden iniciar.

---

## Fase 3: Historia de usuario 1 - Consulta del historial de pagos (Prioridad: P1) — MVP

**Objetivo**: administrador y recepcionista consultan el historial general de pagos con filtros y
paginación.

**Prueba independiente**: con token de administrador, `GET /api/pagos` devuelve pagos con cliente,
membresía, monto, fecha, método y estado; devuelve 50 registros por defecto, respeta `offset`,
muestra "No hay pagos para los filtros seleccionados." cuando está vacío, responde `400` si
`fechaInicio` es posterior a `fechaFin`, `401` sin token y `403` a entrenador o cliente.

### Pruebas de la historia de usuario 1

> **Nota**: escribir primero estas pruebas y comprobar que fallan antes de la implementación.

- [X] T007 [P] [US1] Crear `backend/tests/integration/pagosHistorial.test.js` con `supertest` para cubrir administrador y recepcionista, filtros combinados, paginación por defecto y con `offset`, estado vacío, rango invertido (`400`), sin token (`401`), entrenador y cliente (`403`) y permanencia de `POST /api/pagos`.
- [X] T008 [P] [US1] Crear `frontend/src/tests/PagosHistorial.test.jsx` con React Testing Library y `frontend/src/tests/servidorFalso.js` para verificar la tabla, los filtros, la paginación y el mensaje "No hay pagos para los filtros seleccionados.".

### Implementación de la historia de usuario 1

- [X] T009 [US1] Implementar `listarPagos(filtros)` en `backend/src/services/pago.service.js`: validar con `validarConsultaPagos`, combinar `pagoModelo.contarFiltrados` y `pagoModelo.listarFiltrados`, sumar `montoTotal` de la página, devolver `{ pagos, total, montoTotal, limite, offset }` y agregar `mensaje` cuando no haya resultados.
- [X] T010 [US1] Implementar `listar` en `backend/src/controllers/pago.controller.js`: responder `200` con `pagos: presentarListaPagos(...)` y los campos devueltos por `listarPagos`, propagando errores con `next(error)`.
- [X] T011 [US1] Registrar `GET /api/pagos` en `backend/src/routes/pago.routes.js` con `autorizar('administrador', 'recepcionista')`, conservando intacta la ruta `POST /api/pagos`.
- [X] T012 [US1] Crear `frontend/src/pages/PagosHistorial.jsx` con filtros `fechaInicio`, `fechaFin`, `idCliente` y `estado`, tabla de pagos, controles de `limite`/`offset`, totales y mensajes en español, usando `pedir` de `frontend/src/services/api.js`.
- [X] T013 [US1] Registrar la vista `PagosHistorial` en `/payments/historial` para `administrador` y `recepcionista` en `frontend/src/App.jsx`, conservando `PagosRegistro` como vista principal del módulo.

**Punto de control**: la historia 1 funciona y se puede validar de forma independiente.

---

## Fase 4: Historia de usuario 2 - Consulta de mis pagos (Prioridad: P1)

**Objetivo**: el cliente consulta únicamente su historial financiero sin ver datos de otros
clientes.

**Prueba independiente**: con token de cliente, `GET /api/pagos/mios` devuelve solo los pagos del
cliente resuelto por el `correo` del JWT; un `idCliente` ajeno se ignora; el mismo token recibe `403`
al intentar `GET /api/pagos`.

### Pruebas de la historia de usuario 2

> **Nota**: escribir primero estas pruebas y comprobar que fallan antes de la implementación.

- [X] T014 [P] [US2] Crear `backend/tests/integration/pagosPropios.test.js` con `supertest` para cubrir pagos propios, filtros de fecha y estado, `idCliente` ajeno ignorado, estado vacío, `403` al historial general, `403` para entrenador, `401` sin token y `404` cuando el correo del token no tenga cliente asociado.
- [X] T015 [P] [US2] Crear `frontend/src/tests/MisPagos.test.jsx` con React Testing Library y `frontend/src/tests/servidorFalso.js` para verificar que solo se muestran los pagos del cliente y que no aparece selector de cliente.

### Implementación de la historia de usuario 2

- [X] T016 [US2] Implementar `listarPagosPropios(correo, query)` en `backend/src/services/pago.service.js`: resolver el cliente con `obtenerClientePorCorreo`, forzar su `id_cliente`, ignorar cualquier `idCliente` de la petición, reutilizar `listarFiltrados`/`contarFiltrados` y devolver la misma forma que `listarPagos`.
- [X] T017 [US2] Implementar `listarPropios` en `backend/src/controllers/pago.controller.js` usando `req.usuario.correo` y `req.query`, con presentación mediante `presentarListaPagos`.
- [X] T018 [US2] Registrar `GET /api/pagos/mios` en `backend/src/routes/pago.routes.js` con `autorizar('cliente')`, declarándolo antes de cualquier ruta con parámetros.
- [X] T019 [US2] Crear `frontend/src/pages/MisPagos.jsx` con filtros `fechaInicio`, `fechaFin` y `estado`, tabla, paginación y mensajes en español, sin campo de cliente, usando `pedir` de `frontend/src/services/api.js`.
- [X] T020 [US2] Registrar el módulo `/me/payments` con la vista `MisPagos` para rol `cliente` en `frontend/src/App.jsx` y agregar el enlace "Mis pagos" en `frontend/src/components/Navbar.jsx`.

**Punto de control**: las historias 1 y 2 funcionan de forma independiente.

---

## Fase 5: Historia de usuario 3 - Consulta de adeudos (Prioridad: P2)

**Objetivo**: administrador, recepcionista y cliente consulten los pagos pendientes y su total.

**Prueba independiente**: con datos en los tres estados, `GET /api/pagos/adeudos` muestra un total
por cliente calculado solo con pagos `pendiente` y su detalle; `GET /api/pagos/adeudos/mios` muestra
solo el adeudo del cliente; sin adeudos aparece "No hay adeudos registrados." y un entrenador
recibe `403`.

### Pruebas de la historia de usuario 3

> **Nota**: escribir primero estas pruebas y comprobar que fallan antes de la implementación.

- [X] T021 [P] [US3] Crear `backend/tests/integration/adeudos.test.js` con `supertest` para cubrir suma de pagos `pendiente`, exclusión de `completado` y `cancelado`, agrupación por cliente, filtro `idCliente`, paginación de grupos, mensaje "No hay adeudos registrados.", permisos de administrador, recepcionista, cliente y entrenador, `401` sin token y `404` para cliente sin cliente asociado.
- [X] T022 [P] [US3] Crear `frontend/src/tests/Adeudos.test.jsx` con React Testing Library y `frontend/src/tests/servidorFalso.js` para verificar agrupación por cliente, total adeudado, detalle de pagos y estado vacío.
- [X] T023 [P] [US3] Crear `frontend/src/tests/MisAdeudos.test.jsx` con React Testing Library y `frontend/src/tests/servidorFalso.js` para verificar el total propio, el detalle de pagos pendientes y el estado vacío.

### Implementación de la historia de usuario 3

- [X] T024 [P] [US3] Ampliar `backend/src/validators/pagoConsulta.validator.js` con `validarConsultaAdeudos(query)` para `idCliente` entero positivo, "`limite`: entero de 1 a 200" y "`offset`: entero ≥ 0".
- [X] T025 [P] [US3] Agregar `presentarClienteResumen(cliente)` en `backend/src/presenters/cliente.presentador.js` devolviendo solo `{ id, nombre, apellido, correo }`, sin teléfono, dirección ni fecha de registro.
- [X] T026 [P] [US3] Ampliar `backend/src/models/pago.model.js` con `contarClientesConAdeudos(filtros)`, `listarClientesConAdeudos(filtros)` y `listarPendientesPorClientes(idsClientes)`, filtrando `estado = 'pendiente'` y ordenando "`fecha_pago DESC, id_pago DESC`".
- [X] T027 [US3] Implementar `obtenerAdeudos(query)` y `obtenerAdeudosPropios(correo)` en `backend/src/services/pago.service.js`: validar con `validarConsultaAdeudos`, aplicar FR-011 con `COALESCE(SUM(monto), 0)` solo sobre pagos `pendiente`, resolver el cliente propio con `obtenerClientePorCorreo`, devolver `{ adeudos, total, limite, offset }` o `{ cliente, totalAdeudado, pagos }` y agregar "No hay adeudos registrados." cuando corresponda.
- [X] T028 [US3] Implementar `listarAdeudos` y `listarAdeudosPropios` en `backend/src/controllers/pago.controller.js`, presentando los pagos con `presentarListaPagos` y el cliente con `presentarClienteResumen`.
- [X] T029 [US3] Registrar `GET /api/pagos/adeudos` con `autorizar('administrador', 'recepcionista')` y `GET /api/pagos/adeudos/mios` con `autorizar('cliente')` en `backend/src/routes/pago.routes.js`, declarando `/adeudos/mios` antes de `/adeudos`.
- [X] T030 [P] [US3] Crear `frontend/src/pages/Adeudos.jsx` con filtro por cliente, tabla agrupada, total adeudado, detalle de pagos, paginación y mensaje vacío, usando `pedir` de `frontend/src/services/api.js`.
- [X] T031 [P] [US3] Crear `frontend/src/pages/MisAdeudos.jsx` con total adeudado, detalle de pagos pendientes y mensaje vacío, usando `pedir` de `frontend/src/services/api.js`.
- [X] T032 [US3] Registrar las vistas `Adeudos` en `/payments/adeudos` para `administrador` y `recepcionista`, y `MisAdeudos` en `/me/payments/adeudos` para `cliente`, en `frontend/src/App.jsx`.

**Punto de control**: las tres historias funcionan de forma independiente y están integradas.

---

## Fase 6: Pulido y cuestiones transversales

**Propósito**: verificación final, rendimiento, documentación y seguridad.

- [X] T033 [P] Ejecutar `npm test` en `backend/` y `frontend/`, corregir fallos y confirmar que no hay regresiones en `pagosRegistro.test.js` ni en las pruebas del Sprint 4. Ejecutar solo después de completar T003-T032.
- [X] T034 [P] Verificar con `EXPLAIN` y la semilla de `database/seeds/semilla-rendimiento-sprint4.js` que las consultas usan `ix_pagos_cliente`, `idx_fecha_pago` o `idx_pagos_estado_fecha`, siguiendo `specs/005-consulta-pagos-adeudos/quickstart.md`.
- [X] T035 [P] Confirmar que no se modificaron `backend/package.json`, `frontend/package.json` ni `database/migrations/`, y que no hay secretos en `backend/.env.example` ni en el código nuevo.

  > Nota T035: no se agregaron dependencias ni migraciones, y los ejemplos de entorno solo contienen marcadores. La única modificación aprobada en los `package.json` es el metadato `engines.node: ">=20"`, coherente con los requisitos previos; no cambia dependencias ni scripts. Las contraseñas presentes en pruebas son datos ficticios, no secretos.
- [X] T036 Revisar en `backend/src/utils/errores.js` y en `frontend/src/pages/PagosHistorial.jsx`, `MisPagos.jsx`, `Adeudos.jsx` y `MisAdeudos.jsx` que todos los mensajes de usuario están en español y no exponen información interna.
- [X] T037 Actualizar `README.md` para documentar los endpoints de consulta, las vistas `/payments/*` y `/me/payments/*` y los roles autorizados.
- [X] T038 [P] Ejecutar la validación completa de `specs/005-consulta-pagos-adeudos/quickstart.md` y verificar los criterios SC-001 a SC-008.

  > Validación T038: 35 archivos y 210 pruebas del backend y 18 archivos y 59 pruebas del frontend en verde; `EXPLAIN` con 10,000 pagos confirmó `idx_pagos_estado_fecha`, `idx_fecha_pago` e `ix_pagos_cliente`, con respuestas de 2 ms a 15 ms (SC-006). SC-001 a SC-005 y SC-007 quedan cubiertos por `pagosHistorial.test.js`, `pagosPropios.test.js`, `adeudos.test.js` y las pruebas de componentes; SC-008 por la ejecución conjunta de backend y frontend. La guía rápida citaba `pagosConsulta.test.js`; tras la aprobación del 2026-11-26 se ajustó a los tres archivos reales y a sus pruebas de componentes.

---

## Dependencias y orden de ejecución

### Dependencias entre fases

- **Fase 1 (Configuración)**: sin dependencias; puede iniciar de inmediato.
- **Fase 2 (Fundamentos)**: depende de la Fase 1 y BLOQUEA todas las historias.
- **Historias de usuario (Fases 3 a 5)**: dependen de los fundamentos.
  - US1 y US2 son P1 y pueden ejecutarse en paralelo si hay capacidad.
  - US3 es P2 y depende de US1 y US2 porque reutiliza el historial y la resolución del cliente.
- **Fase 6 (Pulido)**: depende de que estén completas T003-T032; T033 no puede marcarse antes.

### Dependencias entre historias

- **Historia de usuario 1 (P1)**: comienza tras la Fase 2; no depende de otras historias.
- **Historia de usuario 2 (P1)**: comienza tras la Fase 2; comparte el modelo y el validador de US1 sin modificar su contrato.
- **Historia de usuario 3 (P2)**: comienza tras US1 y US2; agrega agregación de adeudos sobre el historial ya disponible.

### Dentro de cada historia

- Las pruebas se escriben primero y deben fallar antes de la implementación.
- Modelo → servicio → controlador → ruta → integración en el frontend.
- La historia se completa y valida antes de avanzar a la siguiente prioridad.

### Oportunidades de paralelismo

- T001 y T002 pueden ejecutarse en paralelo.
- T003, T005 y T006 pueden ejecutarse en paralelo dentro de los fundamentos; T004 espera a T003.
- Las pruebas de cada historia marcadas `[P]` pueden escribirse en paralelo.
- US1 y US2 pueden avanzar en paralelo tras los fundamentos.
- T030 y T031 pueden ejecutarse en paralelo dentro de US3.
- T033, T034, T035 y T038 pueden ejecutarse en paralelo al final.

---

## Ejemplo de ejecución paralela: Historia de usuario 1

```text
# Escribir primero las pruebas de US1 en paralelo:
T007 backend/tests/integration/pagosHistorial.test.js
T008 frontend/src/tests/PagosHistorial.test.jsx

# Después de los fundamentos, implementar el backend de US1 en orden:
T009 backend/src/services/pago.service.js
T010 backend/src/controllers/pago.controller.js
T011 backend/src/routes/pago.routes.js

# Implementar la vista de US1 y registrarla en el frontend:
T012 frontend/src/pages/PagosHistorial.jsx
T013 frontend/src/App.jsx
```

---

## Estrategia de implementación

### MVP primero (solo historia de usuario 1)

1. Completar la Fase 1 (Configuración).
2. Completar la Fase 2 (Fundamentos), requisito bloqueante.
3. Completar la Fase 3 (US1).
4. **DETENER Y VALIDAR**: ejecutar de forma independiente las pruebas de US1 y la sección 5.1 de `quickstart.md`.
5. Mostrar el historial general como primer incremento entregable.

### Entrega incremental

1. Configuración + fundamentos → base lista.
2. US1 → validar → entregar historial general.
3. US2 → validar → entregar historial del cliente.
4. US3 → validar → entregar adeudos generales y propios.
5. Cada historia añade valor sin romper las anteriores.

### Estrategia con equipo paralelo

1. El equipo completa juntos la Configuración y los Fundamentos.
2. Tras los fundamentos:
   - Desarrollador A: US1.
   - Desarrollador B: US2.
   - Desarrollador C: US3 una vez cerradas US1 y US2.
3. Cada historia se integra y valida de forma independiente.

---

## Notas

- `[P]` indica archivos distintos y sin dependencias de tareas incompletas.
- `[US1]`, `[US2]` y `[US3]` garantizan la trazabilidad con `spec.md`.
- Cada historia se puede completar y probar por separado.
- Verificar que las pruebas fallan antes de implementar.
- Hacer commit después de cada tarea o grupo lógico de tareas, con Conventional Commits en español.
- Detenerse en cada punto de control para validar la historia correspondiente.
- Evitar tareas vagas, conflictos sobre el mismo archivo y dependencias cruzadas que rompan la independencia.
