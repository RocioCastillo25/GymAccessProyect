---

description: Tareas, Sprint 2 - Membresías, pagos, reconocimiento facial y control de acceso
---

# Tareas: Sprint 2 - Membresías, pagos, reconocimiento facial y control de acceso

**Entrada**: Documentos de diseño de `/specs/002-membresias-pagos-acceso-facial/`

**Prerrequisitos**: plan.md (obligatorio), spec.md (obligatorio para las historias de usuario),
research.md, data-model.md, contracts/, quickstart.md

**Pruebas**: Las tareas de prueba SÍ se incluyen porque la constitución (principio X) exige probar
membresías, pagos, adeudos, autorización/rechazo de accesos y autorización por rol, y porque spec.md
define escenarios de aceptación verificables.

**Organización**: Las tareas se agrupan por historia de usuario. Las fases siguen el **orden de
prioridad** de spec.md (P1 primero), de modo que las Fases 3 a 7 cubren los seis objetivos P1 y
constituyen el MVP del sprint.

## Formato: `[ID] [P?] [Historia] Descripción`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin depender de tareas sin completar)
- **[Historia]**: Historia de usuario a la que pertenece la tarea (US1...US9)
- **[RL#]**: Responsable de la tarea según la tabla siguiente
- Todas las descripciones incluyen la ruta exacta del archivo

## Responsables (equipo)

| Etiqueta | Rol | Ámbito |
|----------|-----|--------|
| RL1 | Product Architect & Builder | Liderazgo técnico, diseño del modelo MySQL (Sprints 1, 2 y 3) y conexión Backend-API |
| RL2 | Product Builder | Frontend React: panel de recepción y gestión de clientes |
| RL3 | Product Builder | Backend Node.js: endpoints de autenticación, usuarios y pagos |
| RL4 | Product Builder | Frontend React: vista de accesos en tiempo real y módulo de rostros |
| RL5 | Agile Enabler / QA | Tablero de Jira, historias de usuario con EARS y pruebas |
| RL6 | Product Builder | Módulo de entrenadores y rutinas (Sprint 3) e integración de estilos UI/UX |
| RL7 | Agile Enabler | Documentación de la especificación (Specs), registro de interesados y Project Charter |

## Correspondencia de historias

| Etiqueta | Historia de spec.md | Título | Prioridad |
|----------|---------------------|--------|-----------|
| US1 | HU1 (US-S2-01) | Registro de tipos de membresía | P1 |
| US2 | HU2 (US-S2-02) | Asignación de membresía | P1 |
| US3 | HU3 (US-S2-03) | Renovación de membresía | P2 |
| US4 | HU4 (US-S2-04) | Registro de pagos | P1 |
| US5 | HU5 (US-S2-05) | Consulta de pagos y adeudos | P2 |
| US6 | HU6 (US-S2-06) | Registro de información facial | P1 |
| US7 | HU7 (US-S2-07) | Identificación mediante reconocimiento facial | P1 |
| US8 | HU8 (US-S2-08) | Validación de acceso | P1 |
| US9 | HU9 (US-S2-09) | Consulta de accesos | P3 |

## Convenciones de ruta

- **Aplicación web**: `backend/`, `frontend/`, `database/` en la raíz del repositorio (FR-031, FR-035)
- El backend usa ES Modules (`"type": "module"`, sin `require()` ni `module.exports`) (FR-034)
- Formato de errores y códigos: `contracts/formato-errores.md`; flujo facial:
  `contracts/control-acceso.md`
- Los descriptores faciales nunca se devuelven por la API (FR-020, SC-004)

---

## Fase 1: Configuración (infraestructura compartida)

**Propósito**: dependencias y assets necesarios para el sprint.

- [X] T001 Añadir la dependencia `@vladmandic/face-api` (licencia MIT) a `frontend/package.json` e
  instalarla en `frontend/` con `npm install` (research R1) [RL4]
- [X] T002 [P] Añadir `FACIAL_UMBRAL=0.6` y `FACIAL_MAX_INTENTOS=3` a `.env.example` y
  `backend/.env.example`, y leerlas con esos valores por defecto en
  `backend/src/config/entorno.js` (research R4) [RL1]
- [X] T003 [P] Descargar y colocar los pesos del modelo facial (detección, puntos faciales y
  reconocimiento) en `frontend/public/models/` y documentar los archivos requeridos en
  `frontend/public/models/LEEME.md` (research R13) [RL4]

**Checkpoint**: dependencias y modelos disponibles para el trabajo facial.

---

## Fase 2: Fundacional (prerrequisitos bloqueantes)

**Propósito**: infraestructura que DEBE estar lista antes de las historias de usuario.

**CRÍTICO**: ninguna historia de usuario puede depender de esta fase sin completarla.

- [X] T004 Crear `database/migrations/002_sprint2_facial_accesos.sql` con las tablas `rostros`
  (`descriptor_facial` `JSON` `NOT NULL`, `UNIQUE(id_cliente)`), `accesos` (`id_cliente` `NULL`,
  `tipo` `ENUM('entrada','salida')`, `resultado` `ENUM('autorizado','rechazado')`,
  `motivo_rechazo` `VARCHAR(255)` `NULL`) y `auditoria` (`id_usuario` `NULL`, `accion`, `modulo`,
  `fecha`, `resultado` `ENUM('exito','error')`, `descripcion`), motor `InnoDB`, codificación
  `utf8mb4`, `FOREIGN KEY` con `ON DELETE RESTRICT` e índices según `data-model.md` §1
  (FR-031, FR-032, FR-033) [RL1]
- [X] T005 [P] Crear `backend/src/utils/codigosError.js` con los nuevos códigos de
  `contracts/formato-errores.md` (`VALIDACION`, `DESCRIPTOR_INVALIDO`, `SIN_MEMBRESIA`,
  `ROSTRO_YA_REGISTRADO`, `DUPLICADO`) (FR-030) [RL3]
- [X] T006 [P] Crear `backend/src/validators/comunes.validator.js` con helpers reutilizables:
  fecha válida, `monto > 0`, `metodoPago` dentro de `{efectivo, tarjeta, transferencia}` y
  `descriptorFacial` como arreglo numérico de exactamente 128 posiciones (FR-029, research R4/R8)
  [RL3]
- [X] T007 Crear `backend/src/models/auditoria.model.js` y
  `backend/src/services/auditoria.service.js` con `registrarAccion({ idUsuario, accion, modulo,
  resultado, descripcion })` (FR-036, research R10) [RL3]
- [X] T008 [P] Ampliar `backend/src/middlewares/manejoErrores.js` para mapear a HTTP los nuevos
  códigos (`DESCRIPTOR_INVALIDO` → `400`, `SIN_MEMBRESIA` → `404`, `ROSTRO_YA_REGISTRADO` → `409`)
  sin exponer detalles internos (FR-030) [RL3]
- [ ] T009 Ejecutar `node database/scripts/aplicar-migraciones.js` y verificar que `rostros`,
  `accesos` y `auditoria` existen (FR-031, SC-007) [RL1]

**Checkpoint**: infraestructura base del sprint lista. Si la migración de T004 no está aplicada, la
Fase 3 no puede probarse.

---

## Fase 3: Historia de usuario 1 - Registro de tipos de membresía (Prioridad: P1)

**Objetivo**: administrador y recepcionista gestionan los tipos de membresía (crear, editar y
consultar); el entrenador solo ve los datos operativos.

**Prueba independiente**: un administrador crea un tipo de membresía y queda disponible para
asignarlo a un cliente (spec.md, HU1).

### Pruebas para la Historia de usuario 1

- [X] T010 [P] [US1] Crear `backend/tests/integration/tiposMembresia.test.js`: creación válida
  (`201`), nombre duplicado (`409`), datos inválidos (`400`), entrenador ve solo campos operativos
  y recepcionista/entrenador reciben `403` (FR-001 a FR-004, SC-002) [RL5]

### Implementación para la Historia de usuario 1

- [X] T011 [P] [US1] Crear `backend/src/models/tipoMembresia.model.js` con `crear`, `buscarPorId`,
  `buscarPorNombre`, `listar` y `actualizar`, con `nombre` único y `estado` `activo`/`inactivo`
  (FR-001, FR-002, research R12) [RL1]
- [X] T012 [US1] Crear `backend/src/validators/tipoMembresia.validator.js` que exija `nombre`
  obligatorio, `descripcion` opcional, `duracion` entero `> 0` y `precio >= 0` (FR-004, FR-029) [RL3]
- [X] T013 [US1] Crear `backend/src/services/tipoMembresia.service.js` con `crear`, `modificar` y
  `listar`, filtrando campos por rol (entrenador sin precio) y registrando auditoría
  (FR-001 a FR-004, FR-036) [RL3]
- [X] T014 [US1] Crear `backend/src/controllers/tipoMembresia.controller.js` (éxito `201`/`200` con
  `mensaje` y `tipoMembresia`, `contracts/api-rest.md` §1) [RL3]
- [X] T015 [US1] Crear `backend/src/routes/tipoMembresia.routes.js` con `GET`, `GET /:id`,
  `POST`, `PATCH /:id` y `PATCH /:id/estado`, usando `autorizar('administrador')` en las escrituras,
  y registrarlo en `backend/src/routes/index.js` (FR-001, FR-002, FR-003) [RL3]
- [X] T016 [P] [US1] Crear `frontend/src/pages/TiposMembresia.jsx` con listado, alta, edición y
  activación/desactivación, con mensajes de éxito y error en español (principio XI) [RL2]
- [X] T017 [US1] Registrar la página en `frontend/src/App.jsx` y `MenuPrincipal.jsx` y validar los
  escenarios 1 a 4 de `quickstart.md` (FR-001 a FR-004) [RL2]

**Checkpoint**: Los tipos de membresía se crean, listan y editan; base para asignar y renovar
membresías (US2).

---

## Fase 4: Historia de usuario 2 - Asignación de membresía (Prioridad: P1)

**Objetivo**: administrador y recepcionista asignan una membresía a un cliente existente con un tipo
válido y el sistema calcula las fechas.

**Prueba independiente**: un recepcionista asigna una membresía a un cliente existente y el sistema
registra la fecha de inicio y calcula la de finalización (spec.md, HU2).

### Pruebas para la Historia de usuario 2

- [X] T018 [P] [US2] Crear `backend/tests/integration/membresiasAsignacion.test.js`: asignación
  válida (`201` con `fechaFin = fechaInicio + duracion`), cliente inexistente o tipo `inactivo`
  (`400`/`404` sin persistir), entrenador y cliente reciben `403`, y se reporta `vencida` cuando
  `fechaFin < hoy` (FR-005 a FR-007, FR-010, SC-002) [RL5]

**Implementación de la asignación**

- [X] T019 [US2] Crear `backend/src/models/membresia.model.js` con `crear`, `buscarPorId`,
  `listar`, `listarPorCliente`, `buscarVigentePorCliente` y `buscarUltimaPorCliente`, con el cálculo
  del estado de vigencia en lectura (FR-006, FR-007, research R5) [RL1]
- [X] T020 [US2] Crear `backend/src/validators/membresia.validator.js` que exija `idCliente` e
  `idTipoMembresia` y valide `fecha_fin >= fecha_inicio` (FR-006, FR-029) [RL3]
- [X] T021 [US2] Crear `backend/src/services/membresia.service.js` con `asignar` (verifica cliente
  existente y tipo `activo`, calcula `fecha_fin` y registra auditoría) (FR-005, FR-006, FR-036) [RL3]
- [X] T022 [US2] Crear `backend/src/controllers/membresia.controller.js` con el controlador de
  asignación (`contracts/api-rest.md` §2) [RL3]
- [X] T023 [US2] Crear `backend/src/routes/membresia.routes.js` con `POST /api/membresias`,
  `GET /api/membresias`, `GET /api/membresias/:id`, `GET /api/membresias/yo` (FR-009) y
  `PATCH /api/membresias/:id/estado`, usando `autorizar('administrador','recepcionista')` en las
  escrituras, y registrarlo en `backend/src/routes/index.js` (FR-005, FR-009, FR-010) [RL3]
- [X] T024 [US2] Crear `frontend/src/pages/Membresias.jsx` con selección de cliente y tipo y la
  lista de membresías con su estado (FR-005, FR-009, principio XI) [RL2]
- [X] T025 [US2] Registrar la página en `frontend/src/App.jsx` y `MenuPrincipal.jsx` y validar los
  escenarios 5 y 6 de `quickstart.md` (FR-005, FR-006) [RL2]

**Checkpoint**: se asignan membresías y el cliente consulta la suya; base para renovación (US3),
pagos (US4) y validación de acceso (US8).

---

## Fase 5: Historia de usuario 4 - Registro de pagos (Prioridad: P1)

**Objetivo**: administrador y recepcionista registran pagos asociados a un cliente y, opcionalmente,
a su membresía.

**Prueba independiente**: un recepcionista registra un pago válido y aparece en el historial.

- [X] T026 [P] [US4] Crear `backend/tests/integration/pagosRegistro.test.js`: registro válido
  (`201`), `monto <= 0` o ausente (`400` sin persistir), `metodoPago` fuera del catálogo (`400`),
  membresía de otro cliente (`400`), entrenador y cliente reciben `403`, y el pago duplicado
  no corrompe el historial (FR-011, FR-014, FR-029, SC-002) [RL5]
- [X] T027 [P] [US4] Crear `backend/src/models/pago.model.js` con `crear`, `buscarPorId`, `listar`,
  `listarPorCliente` y `existePagoCompletado`, respetando los `ENUM` de `data-model.md`
  (FR-011, FR-014) [RL1]
- [X] T028 [US4] Crear `backend/src/validators/pago.validator.js` que exija `idCliente`, `monto`
  `> 0` y `metodoPago` del catálogo, con `estado` en `pendiente`/`completado`/`cancelado`
  (FR-011, FR-029, research R8) [RL3]
- [X] T029 [US4] Crear `backend/src/services/pago.service.js` con `registrar` (verifica cliente y
  que la membresía sea del mismo cliente, evita duplicados y registra auditoría)
  (FR-011, FR-014, FR-036) [RL3]
- [X] T030 [US4] Crear `backend/src/controllers/pago.controller.js` con el controlador de registro
  (`contracts/api-rest.md` §3) [RL3]
- [X] T031 [US4] Crear `backend/src/routes/pago.routes.js` con `POST /api/pagos` protegido con
  `autorizar('administrador','recepcionista')` y registrarlo en `backend/src/routes/index.js`
  (FR-011) [RL3]
- [X] T032 [P] [US4] Crear `frontend/src/pages/PagosRegistro.jsx` con formulario de pago y mensajes
  en español (principio XI) [RL2]
- [X] T033 [US4] Registrar la página en `frontend/src/App.jsx` y validar los escenarios 9 a 11 de
  `quickstart.md` (FR-011) [RL2]

**Checkpoint**: la HU4 queda funcional y verificable de forma independiente.

---

## Fase 6: Historia de usuario 6 - Registro de información facial (Prioridad: P1)

**Objetivo**: administrador y recepcionista registran el descriptor facial de un cliente existente
con la cámara, asociándolo sin duplicar y sin exponer el dato biométrico.

**Prueba independiente**: un recepcionista registra la información facial de un cliente existente y
el sistema la asocia correctamente a ese cliente (spec.md, HU6).

### Pruebas para la Historia de usuario 6

- [ ] T034 [P] [US6] Crear `backend/tests/integration/rostros.test.js`: registro válido (`201`),
  cliente inexistente (`404` sin persistir), segundo registro actualiza sin duplicar (una sola fila),
  `descriptorFacial` con longitud distinta de 128 o no numérico (`400`), entrenador y cliente reciben
  `403`, y ninguna respuesta incluye `descriptorFacial` (FR-016, FR-017, FR-020, SC-002, SC-004) [RL5]

### Implementación para la Historia de usuario 6

- [ ] T035 [US6] Crear `frontend/src/facerecognition/modelo.js` que carga los modelos desde
  `/models` con `@vladmandic/face-api` y expone una promesa lista para usarse (research R1, R13) [RL4]
- [ ] T036 [US6] Crear `frontend/src/facerecognition/descriptor.js` que abre la cámara con
  `navigator.mediaDevices.getUserMedia` y genera el descriptor facial de 128 números (research R2,
  R11) [RL4]
- [ ] T037 [US6] Crear `frontend/src/components/CapturaFacial.jsx` (video + canvas) reutilizable,
  con guía de encuadre, reintentos hasta `FACIAL_MAX_INTENTOS` y mensajes en español (research R4,
  principio XI) [RL4]
- [ ] T038 [P] [US6] Crear `backend/src/models/rostro.model.js` con `registrarOActualizar`,
  `buscarPorCliente` y `listarDescriptoresActivos` (este último solo devuelve datos internos)
  (FR-016, FR-017, research R3) [RL1]
- [ ] T039 [US6] Crear `backend/src/validators/rostro.validator.js` que exija `idCliente` y
  `descriptorFacial` de 128 números (FR-029, research R4) [RL1]
- [ ] T040 [US6] Crear `backend/src/services/rostro.service.js` con `registrar` (verifica cliente,
  hace *upsert* sin duplicar, nunca devuelve el descriptor y registra auditoría)
  (FR-016, FR-017, FR-020, FR-036) [RL1]
- [ ] T041 [US6] Crear `backend/src/controllers/rostro.controller.js` que devuelva solo metadatos
  (`idCliente`, `fechaRegistro`, `estado`, `tieneRostro`) sin `descriptorFacial`
  (`contracts/api-rest.md` §4, FR-020) [RL1]
- [ ] T042 [US6] Crear `backend/src/routes/rostro.routes.js` con `POST /api/rostros`,
  `PUT /api/rostros/:idCliente` y `GET /api/rostros/:idCliente` (estado), protegido con
  `autorizar('administrador','recepcionista')`, y registrarlo en `backend/src/routes/index.js`
  (FR-016) [RL1]
- [ ] T043 [P] [US6] Crear `frontend/src/pages/RegistroFacial.jsx` que use `CapturaFacial` para
  registrar/actualizar el rostro del cliente (FR-016, FR-017) [RL4]
- [ ] T044 [US6] Registrar la página en `frontend/src/App.jsx` y validar los escenarios 14 a 16 de
  `quickstart.md` (FR-016, FR-017, FR-020) [RL4]

**Checkpoint**: la HU6 queda funcional y verificable de forma independiente.

---

## Fase 7: Historia de usuario 7 - Identificación mediante reconocimiento facial (Prioridad: P1)

**Objetivo**: el backend compara el descriptor capturado con los almacenados (distancia euclídea,
umbral) y devuelve el cliente correcto o "no reconocido".

**Prueba independiente**: un cliente con información facial registrada se identifica ante la cámara
y el sistema lo reconoce como el cliente correcto; un rostro sin coincidencia no se identifica
(spec.md, HU7).

### Pruebas para la Historia de usuario 7

- [ ] T045 [P] [US7] Crear `backend/tests/unit/distanciaFacial.test.js`: distancia euclídea correcta,
  coincidencia dentro del umbral, rechazo por encima del umbral y selección del mejor candidato
  cuando hay varios rostros similares (FR-018, FR-019, research R14) [RL5]
- [ ] T046 [P] [US7] Crear `backend/tests/integration/reconocimiento.test.js`: identificación de un
  descriptor conocido (cliente correcto) y de un descriptor sin coincidencia (`null`) contra filas
  reales de `rostros` (FR-018, FR-019, SC-005) [RL5]

### Implementación para la Historia de usuario 7

- [ ] T047 [US7] Crear `backend/src/utils/distanciaFacial.js` con `distanciaEuclidea(a, b)` y
  `mejorCoincidencia(descriptor, candidatos, umbral)` (FR-018, FR-019, research R4) [RL1]
- [ ] T048 [US7] Crear `backend/src/services/reconocimiento.service.js` con `identificarCliente`
  (carga descriptores activos, calcula la mejor coincidencia y aplica el umbral `FACIAL_UMBRAL`)
  (FR-018, FR-019, research R2) [RL1]
- [ ] T049 [US7] Validar la identificación ejecutando `backend/tests` y confirmar los escenarios 17
  y 18 de `quickstart.md` en su parte de identificación (FR-018, FR-019) [RL5]

**Checkpoint**: la HU7 queda funcional y verificable de forma independiente a nivel de servicio.

---

## Fase 8: Historia de usuario 8 - Validación de acceso (Prioridad: P1)

**Objetivo**: tras identificar al cliente, el sistema valida su membresía, autoriza o rechaza el
acceso y registra siempre el intento con su motivo.

**Prueba independiente**: tras identificar a un cliente, el sistema autoriza el acceso con membresía
vigente y lo rechaza si está vencida, suspendida, cancelada o no existe (spec.md, HU8).

### Pruebas para la Historia de usuario 8

- [ ] T050 [P] [US8] Crear `backend/tests/integration/accesosValidacion.test.js`: acceso autorizado
  con membresía vigente (`resultado: autorizado` y fila en `accesos`), rechazo con membresía vencida,
  suspendida y cancelada, rechazo sin membresía, rechazo por rostro no reconocido (con `id_cliente`
  `NULL`) y `descriptorFacial` malformado (`400`); todos los casos registran el acceso con motivo
  (FR-021 a FR-024, SC-003, SC-006) [RL5]

### Implementación para la Historia de usuario 8

- [ ] T051 [P] [US8] Crear `backend/src/models/acceso.model.js` con `registrar` y `buscarPorId`
  (FR-024, FR-025) [RL1]
- [ ] T052 [US8] Crear `backend/src/validators/acceso.validator.js` que exija `descriptorFacial` de
  128 números y `tipo` en `entrada`/`salida` (FR-029) [RL1]
- [ ] T053 [US8] Crear `backend/src/services/acceso.service.js` con `validar`: identifica al cliente
  (`reconocimiento.service`), valida la membresía vigente, determina el resultado y el motivo,
  registra el acceso y la auditoría, y devuelve el resultado (FR-021 a FR-024, FR-036, research R9) [RL1]
- [ ] T054 [US8] Crear `backend/src/controllers/acceso.controller.js` con el controlador de
  validación (respuesta `200` con `resultado`, `cliente`, `membresia`/`motivo` y `acceso`) [RL1]
- [ ] T055 [US8] Crear `backend/src/routes/acceso.routes.js` con `POST /api/accesos/validar`
  protegido con `autorizar('administrador','recepcionista')` y registrarlo en
  `backend/src/routes/index.js` (FR-021, FR-028) [RL1]
- [ ] T056 [P] [US8] Crear `frontend/src/pages/ControlAcceso.jsx` que usa `CapturaFacial` para
  capturar y muestra de forma clara el resultado (autorizado/rechazado) y el motivo (principio XI) [RL4]
- [ ] T057 [US8] Registrar la página en `frontend/src/App.jsx` y validar los escenarios 19 a 22 y
  25 de `quickstart.md` (FR-021 a FR-024, SC-003, SC-006) [RL4]

**Checkpoint**: las seis historias P1 quedan funcionales; MVP ampliado del sprint completo.

---

## Fase 9: Historia de usuario 3 - Renovación de membresía (Prioridad: P2)

**Objetivo**: administrador y recepcionista renuevan la membresía de un cliente conservando el
historial.

**Prueba independiente**: un recepcionista renueva la membresía de un cliente y el nuevo periodo
queda reflejado en la consulta sin perder la anterior (spec.md, HU3).

### Pruebas para la Historia de usuario 3

- [ ] T058 [P] [US3] Crear `backend/tests/integration/membresiasRenovacion.test.js`: renovación con
  membresía vigente extiende desde la `fechaFin` anterior (`201`), renovación con membresía vencida
  inicia hoy, cliente sin membresía previa devuelve `404`, y entrenador/cliente reciben `403`
  (FR-008, FR-009, FR-037, SC-002) [RL5]

### Implementación para la Historia de usuario 3

- [ ] T059 [US3] Ampliar `backend/src/services/membresia.service.js` con `renovar`
  (`fecha_inicio = max(fecha_fin anterior, hoy)`, conserva la fila anterior, registra auditoría)
  (FR-008, FR-037, research R6) [RL3]
- [ ] T060 [US3] Ampliar `backend/src/controllers/membresia.controller.js` con el controlador de
  renovación (`contracts/api-rest.md` §2) [RL3]
- [ ] T061 [US3] Ampliar `backend/src/routes/membresia.routes.js` con
  `POST /api/membresias/:id/renovar` protegido con `autorizar('administrador','recepcionista')`
  (FR-008) [RL3]
- [ ] T062 [P] [US3] Ampliar `frontend/src/pages/Membresias.jsx` con la acción de renovación y la
  confirmación correspondiente (FR-008, principio XI) [RL2]
- [ ] T063 [US3] Validar los escenarios 7 y 8 de `quickstart.md` (FR-008) [RL5]

**Checkpoint**: la HU3 queda funcional y verificable de forma independiente.

---

## Fase 10: Historia de usuario 5 - Consulta de pagos y adeudos (Prioridad: P2)

**Objetivo**: el administrador consulta el historial de pagos y los adeudos; el cliente consulta
solo lo propio.

**Prueba independiente**: el administrador consulta el historial de pagos y visualiza los adeudos; el
cliente ve únicamente su información (spec.md, HU5).

### Pruebas para la Historia de usuario 5

- [ ] T064 [P] [US5] Crear `backend/tests/integration/pagosConsulta.test.js`: el administrador lista
  pagos y adeudos (membresía activa sin pago `completado`), el recepcionista/entrenador reciben `403`
  en la consulta administrativa, y el cliente solo ve sus propios pagos y adeudos
  (FR-012, FR-013, FR-015, SC-002) [RL5]

### Implementación para la Historia de usuario 5

- [ ] T065 [P] [US5] Ampliar `backend/src/models/pago.model.js` con `listarHistorial` y
  `listarAdeudos` (consulta de membresías activas sin pago `completado`) (FR-012, FR-015,
  research R7) [RL1]
- [ ] T066 [US5] Ampliar `backend/src/services/pago.service.js` con `historial`, `adeudos` y
  `propios` (FR-012, FR-013, FR-015) [RL3]
- [ ] T067 [US5] Ampliar `backend/src/controllers/pago.controller.js` con los controladores de
  consulta (historial, adeudos y propios) [RL3]

### Implementación de la consulta (rutas y frontend)

- [ ] T068 [US5] Ampliar `backend/src/routes/pago.routes.js` con `GET /api/pagos`,
  `GET /api/pagos/adeudos` (`autorizar('administrador')`) y `GET /api/pagos/yo`
  (`autorizar('cliente')`) (FR-012, FR-013) [RL3]
- [ ] T069 [P] [US5] Crear `frontend/src/pages/PagosConsulta.jsx` (historial y adeudos para
  administrador) y `frontend/src/pages/MisPagos.jsx` (pagos propios del cliente) (principio XI) [RL2]
- [ ] T070 [US5] Registrar las páginas en `frontend/src/App.jsx` y validar los escenarios 12 y 13
  de `quickstart.md` (FR-012, FR-013, FR-015) [RL2]

**Checkpoint**: la HU5 queda funcional y verificable de forma independiente.

---

## Fase 11: Historia de usuario 9 - Consulta de accesos (Prioridad: P3)

**Objetivo**: administrador, recepcionista y entrenador consultan los registros de acceso; el
cliente solo ve los propios.

**Prueba independiente**: un recepcionista consulta el historial de accesos y ve entradas
autorizadas y rechazadas con su motivo (spec.md, HU9).

### Pruebas para la Historia de usuario 9

- [ ] T071 [P] [US9] Crear `backend/tests/integration/accesosConsulta.test.js`: administrador y
  recepcionista listan accesos con resultado y motivo, el entrenador recibe solo campos operativos de
  asistencia, el cliente solo ve sus accesos, y otro rol distinto de `cliente` recibe `403`
  (FR-025 a FR-027, SC-006) [RL5]

### Implementación para la Historia de usuario 9

- [ ] T072 [US9] Ampliar `backend/src/services/acceso.service.js` con `consultar` y `propios`
  (filtros por fecha, resultado y cliente, y filtrado por rol) (FR-025 a FR-027) [RL1]
- [ ] T073 [US9] Crear `backend/src/controllers/accesoConsulta.controller.js` con los controladores
  de consulta (listado con filtros, propios del cliente) (FR-025 a FR-027) [RL1]
- [ ] T074 [US9] Ampliar `backend/src/routes/acceso.routes.js` con `GET /api/accesos`,
  `GET /api/accesos/:id` y `GET /api/accesos/yo` (`autorizar(...)`) y registrarlo en
  `backend/src/routes/index.js` (FR-025, FR-027) [RL1]
- [ ] T075 [P] [US9] Crear `frontend/src/pages/Accesos.jsx` (administrador/recepcionista/entrenador)
  y `frontend/src/pages/MisAccesos.jsx` (cliente) con filtros y estados en español (principio XI) [RL4]
- [ ] T076 [US9] Registrar las páginas en `frontend/src/App.jsx` y validar los escenarios 23 y 24
  de `quickstart.md` (FR-026, FR-027) [RL4]

**Checkpoint**: las 9 historias quedan funcionales e independientes.

---

## Fase 12: Pulido y preocupaciones transversales

**Propósito**: auditoría, verificaciones de cumplimiento y validación final del sprint.

- [ ] T077 [P] Crear `backend/src/controllers/auditoria.controller.js` y
  `backend/src/routes/auditoria.routes.js` con `GET /api/auditoria` protegido con
  `autorizar('administrador')`, registrándolo en `backend/src/routes/index.js`
  (FR-036, contracts/api-rest.md §5) [RL1]
- [ ] T078 [P] Crear `frontend/src/pages/Auditoria.jsx` con filtros por módulo y fecha, y
  registrarla en `frontend/src/App.jsx` solo para administrador (FR-036) [RL2]
- [ ] T079 [P] Verificar en `backend/` la ausencia total de `require()` y `module.exports` y la
  presencia de `"type": "module"` en `backend/package.json` (FR-034, SC-009) [RL5]
- [ ] T080 [P] Verificar que `.env` está en `.gitignore` y que `.env.example` (raíz y `backend/`) no
  contiene secretos reales (SC-008) [RL1]
- [ ] T081 [P] Verificar que `frontend/` no contiene credenciales de base de datos ni acceso
  directo a MySQL (FR-035, SC-009) [RL5]
- [ ] T082 [P] Verificar que ningún endpoint devuelve `descriptorFacial` revisando controladores y
  presentadores del backend (FR-020, SC-004) [RL5]
- [ ] T083 Reconstruir la base de datos desde cero: borrarla y reejecutar
  `node database/scripts/aplicar-migraciones.js` para confirmar SC-007 [RL1]
- [ ] T084 Ejecutar la suite completa de pruebas (`backend: npm test` y `frontend: npm test`) y
  corregir cualquier fallo antes de cerrar el sprint (principio X) [RL5]
- [ ] T085 Ejecutar el flujo de demostración completo de `quickstart.md` §6 en menos de 5 minutos
  con el administrador sembrado (SC-001, SC-010) [RL5]
- [ ] T086 [P] Revisar que todos los mensajes mostrados al usuario están en español, son claros y no
  revelan información técnica interna (FR-030, principio XI) [RL6]
- [ ] T087 [P] Actualizar `README.md` y `database/README.md` con los pasos nuevos (dependencias
  faciales, migración 002, variables `FACIAL_*`) (FR-033) [RL7]

---

## Dependencias y orden de ejecución

### Dependencias entre fases

- **Configuración (Fase 1)**: sin dependencias; puede comenzar de inmediato.
- **Fundacional (Fase 2)**: depende de la Fase 1; **bloquea todas** las historias de usuario.
- **Historias de usuario (Fases 3 a 11)**: todas dependen de la Fase 2. Una vez completada, pueden
  ejecutarse en paralelo o en el orden de prioridad mostrado.
- **Pulido (Fase 12)**: depende de las historias que se den por terminadas.

### Dependencias entre historias de usuario

- **US1 (P1)**: comienza tras la Fase 2; sin dependencias de otras historias.
- **US2 (P1)**: depende de que existan tipos de membresía (US1) para asignar; reutiliza `clientes`.
- **US4 (P1)**: depende de US2 (la membresía del pago) y de `clientes`.
- **US6 (P1)**: depende de que existan `clientes`; es la base del reconocimiento.
- **US7 (P1)**: depende de US6 (necesita descriptores registrados).
- **US8 (P1)**: depende de US7 (identificación) y de US2 (membresía vigente).
- **US3 (P2)**: amplía US2 (renovación); recomendada después de US2.
- **US5 (P2)**: amplía US4 (consulta de pagos y adeudos).
- **US9 (P3)**: amplía US8 (consulta de accesos generados por la validación).

### Dentro de cada historia de usuario

1. Pruebas primero (deben fallar antes de implementar).
2. Modelos → validadores → servicios → controladores → rutas → frontend.
3. Tarea de validación con `quickstart.md` al final de la fase.

### Oportunidades de paralelismo

- Todas las tareas `[P]` de las Fases 1 y 2 pueden ejecutarse en paralelo.
- Tras la Fase 2, US1 y US6 pueden avanzar en paralelo (archivos distintos).
- Dentro de una historia, las pruebas y los modelos son paralelizables.
- Con el equipo repartido: RL1 y RL3 en la rama de membresías/pagos (US1, US2, US3, US4, US5) y RL4
  en la rama facial/accesos (US6, US7, US8, US9), integrando tras la Fase 2.

---

## Reparto sugerido por rol

| Rol | Tareas principales |
|-----|--------------------|
| RL1 (Arquitectura/Modelo) | T002, T004, T009, T011, T019, T027, T038-T042, T047, T048, T051-T055, T065, T072-T074, T077, T080, T083 |
| RL2 (Frontend recepción/clientes) | T016, T017, T024, T025, T032, T033, T062, T069, T070, T078 |
| RL3 (Backend auth/usuarios/pagos) | T005-T008, T012-T015, T020-T023, T028-T031, T059-T061, T066-T068 |
| RL4 (Frontend accesos/facial) | T001, T003, T035-T037, T043, T044, T056, T057, T075, T076 |
| RL5 (QA/Pruebas) | T010, T018, T026, T034, T045, T046, T049, T050, T058, T063, T064, T071, T079, T081, T082, T084, T085 |
| RL6 (Entrenadores/Rutinas + UI/UX) | T086 (Sprint 3: módulo de entrenadores y rutinas) |
| RL7 (Docs/Specs) | T087 |

---

## Ejemplo de paralelismo: Historia de usuario 6

- La prueba `backend/tests/integration/rostros.test.js` (RL5), el modelo
  `backend/src/models/rostro.model.js` (RL1) y el cargador `frontend/src/facerecognition/modelo.js`
  (RL4) pueden ejecutarse en paralelo (archivos distintos).

---

## Notas

- Las tareas `[P]` usan archivos distintos y no dependen de tareas sin completar.
- La etiqueta `[USn]` vincula la tarea con su historia para la trazabilidad de `spec.md`.
- La etiqueta `[RL#]` vincula la tarea con su responsable (columna del tablero en Jira).
- Cada historia debe poder completarse y probarse de forma independiente.
- Confirmar que las pruebas fallan antes de implementar.
- Hacer commit después de cada tarea o grupo lógico con Conventional Commits en español.
- Detenerse en cada checkpoint para validar la historia de forma independiente.
