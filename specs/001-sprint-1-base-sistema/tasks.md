---

description: "Lista de tareas de la funcionalidad Sprint 1 - Base del sistema, autenticación, usuarios, roles y clientes"
---

# Tareas: Sprint 1 - Base del sistema, autenticación, usuarios, roles y clientes

**Entrada**: Documentos de diseño de `/specs/001-sprint-1-base-sistema/`

**Prerrequisitos**: plan.md (obligatorio), spec.md (obligatorio para las historias de usuario),
research.md, data-model.md, contracts/, quickstart.md

**Tests**: Las tareas de prueba SÍ se incluyen porque la constitución (principio X) exige probar
autenticación, validación de roles, registro y modificación de clientes, y porque spec.md define
escenarios de aceptación verificables.

**Organización**: Las tareas se agrupan por historia de usuario para permitir implementación y
prueba independientes de cada una.

## Formato: `[ID] [P?] [Historia] Descripción`

- **[P]**: Puede ejecutarse en paralelo (archivos distintos, sin dependencias de tareas sin
  completar)
- **[Historia]**: Historia de usuario a la que pertenece la tarea (US1, US2, US3...)
- Todas las descripciones incluyen la ruta exacta del archivo

## Convenciones de ruta

- **Aplicación web**: `backend/`, `frontend/`, `database/` en la raíz del repositorio (FR-028)
- El backend usa ES Modules (`"type": "module"`, sin `require()` ni `module.exports`) (FR-029)
- Los scripts de `database/scripts/` también usan ES Modules (FR-030)

---

## Fase 1: Configuración (infraestructura compartida)

**Propósito**: inicialización del proyecto y estructura básica según `plan.md`.

- [X] T001 Crear la estructura de carpetas `frontend/`, `backend/` y `database/` (con
  `migrations/`, `seeds/`, `scripts/`) en la raíz del repositorio, sin carpetas alternativas
  (`client/`, `server/`, `dataBase/`) según FR-028
- [X] T002 [P] Crear `backend/package.json` con `"type": "module"`, scripts `dev`, `start` y
  `test` (Vitest)
- [X] T003 [P] Crear `frontend/package.json` con scripts `dev`, `build` y `test`
- [X] T004 [P] Crear `frontend/vite.config.js` con el plugin de React y proxy de `/api` hacia
  `http://localhost:3000` (investigación R9)
- [X] T005 [P] Crear `.gitignore` en la raíz que excluya `.env`, `node_modules/`, la carpeta
  `build/` o `dist/` y los archivos físicos de MySQL (FR-026, SC-005)
- [X] T006 [P] Crear `.env.example` en la raíz con `DB_HOST`, `DB_PORT`, `DB_USER`,
  `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, `JWT_EXPIRES_IN=60m`, `SEED_ADMIN_EMAIL` y
  `SEED_ADMIN_PASSWORD` sin valores reales (FR-025, FR-026, SC-005)
- [X] T007 [P] Crear `backend/.env.example` con las mismas variables que consumirá el backend
- [X] T008 [P] Crear `README.md` en la raíz, en español, con propósito del proyecto y enlaces a
  `docs/`
- [X] T009 Instalar en `backend/` las dependencias definidas en `plan.md` y `research.md`:
  `express`, `mysql2`, `bcrypt`, `jsonwebtoken`, `cors`, más las de prueba `vitest` y `supertest`
- [X] T010 Instalar en `frontend/` las dependencias definidas en `plan.md`: `react`,
  `react-dom`, `vite`, `@vitejs/plugin-react`, más las de prueba `vitest`,
  `@testing-library/react` y `@testing-library/jest-dom`
- [X] T011 [P] Crear `frontend/index.html` y el punto de entrada `frontend/src/main.jsx`
- [X] T012 [P] Crear `frontend/src/styles/base.css` con variables CSS de paleta, espaciados y
  tipografía para cumplir el principio XI (consistencia visual)

**Checkpoint**: estructura del proyecto creada e instalaciones completadas.

---

## Fase 2: Fundacional (prerrequisitos bloqueantes)

**Propósito**: infraestructura que DEBE estar lista antes de cualquier historia de usuario.

**CRÍTICO**: Ninguna historia de usuario puede comenzar hasta completar esta fase.

- [X] T013 Crear `database/migrations/001_crear_estructura.sql` con las 5 tablas de
  `data-model.md` (`usuarios`, `clientes`, `tipos_membresia`, `membresias`, `pagos`), motor
  `InnoDB`, codificación `utf8mb4`, llaves primarias, `FOREIGN KEY` con `ON DELETE RESTRICT`,
  índices únicos en `usuarios.correo` y `clientes.correo`, y los `ENUM` de rol y estado
  (`activo`/`inactivo` en usuarios y clientes; `activa`/`vencida`/`suspendida`/`cancelada` en
  `membresias`) según FR-020, FR-021, FR-022, FR-010 y FR-027
- [X] T014 Crear `database/scripts/aplicar-migraciones.js` con ES Modules: aplica los scripts
  numerados de `database/migrations/` en orden, registra los ya aplicados y es reejecutable
  (FR-023, SC-004)
- [X] T015 Crear `database/seeds/semilla-administrador.js` idempotente que crea el usuario
  administrador con `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` (≥ 8 caracteres) usando hash
  `bcrypt` calculado en ejecución; no duplica si ya existe (FR-002, FR-011, investigación R7)
- [X] T016 [P] Crear `backend/src/config/entorno.js` que carga y valida las variables de
  entorno y falla al arrancar si `JWT_SECRET` o las credenciales de MySQL faltan (FR-025,
  SC-005)
- [X] T017 Crear `backend/src/config/baseDatos.js` con pool `mysql2/promise` que usa
  exclusivamente consultas parametrizadas (FR-024)
- [X] T018 [P] Crear `backend/src/utils/errores.js` con la estructura `{ mensaje, codigo }` y
  los códigos de `contracts/formato-errores.md` (FR-034, investigación R10)
- [X] T019 Crear `backend/src/middlewares/manejoErrores.js` con el manejo centralizado de
  errores: traduce excepciones a JSON con códigos HTTP apropiados, registra el detalle solo en
  consola del servidor y nunca expone stack traces ni credenciales (FR-034, principio V)
- [X] T020 [P] Crear `backend/src/validators/validadoresComunes.js` con funciones puras de
  formato de correo y de longitud de contraseña (mínimo 8 caracteres, sin exigir otros
  caracteres) según FR-018 y el clarify del 2026-10-09 (investigación R5)
- [X] T021 Crear `backend/src/middlewares/autenticar.js` que verifica el token JWT
  (`JWT_EXPIRES_IN`, 60 minutos por defecto), devuelve `401` con `{ mensaje, codigo }` si falta,
  expiró o fue manipulado, y adjunta `req.usuario` (FR-003, FR-004)
- [X] T022 Crear `backend/src/middlewares/autorizar.js` que recibe la lista de roles permitidos
  y responde `403` si el rol del token no está incluido (FR-006, SC-002)
- [X] T023 Crear `backend/src/app.js` con Express: JSON, prefijo `/api`, registro de rutas y
  montaje de `manejoErrores.js` al final (FR-031, FR-032)
- [X] T024 Crear `backend/src/server.js` que arranca el servidor en el puerto indicado por
  variables de entorno y comprueba la conexión a MySQL al inicio
- [X] T025 [P] Crear `backend/src/routes/salud.routes.js` con `GET /api/salud` que responde
  `{ estado, baseDatos }` y `503` si MySQL no responde (Casos límite, quickstart §3)
- [X] T026 [P] Crear `frontend/src/services/api.js`: cliente HTTP que adjunta
  `Authorization: Bearer <token>`, centraliza la URL base y redirige al login ante un `401`
  (investigación R4, R6)
- [X] T027 Ejecutar `node database/scripts/aplicar-migraciones.js` y verificar que las 5 tablas
  quedan creadas en MySQL (SC-004)

**Checkpoint**: base de datos creada, middlewares de autenticación/autorización y manejo de
errores listos; las historias de usuario pueden comenzar.

---

## Fase 3: Historia de usuario 1 - Inicio de sesión y acceso por rol (Prioridad: P1) — MVP

**Objetivo**: un usuario registrado inicia sesión con correo y contraseña y ve solo las funciones
de su rol.

**Prueba independiente**: con el administrador sembrado, iniciar sesión con credenciales válidas
y comprobar que se devuelve un token JWT y se muestran únicamente las funciones del rol
administrador (spec.md, HU1).

### Pruebas para la Historia de usuario 1

> **NOTA**: escribir estas pruebas primero y confirmar que fallan antes de la implementación.

- [X] T028 [P] [US1] Crear `backend/tests/integration/auth.test.js`: login con credenciales
  válidas (`200` con token y usuario sin `password`), contraseña incorrecta (`401` con mensaje
  genérico que no revela si el correo existe) y usuario desactivado (`401`) (FR-001, FR-005,
  FR-010)
- [X] T029 [P] [US1] Crear `backend/tests/integration/rutasProtegidas.test.js`: rutas privadas
  sin token, con token manipulado y con token expirado responden `401`, y un rol sin permiso
  responde `403` (FR-004, FR-006, SC-002)

### Implementación para la Historia de usuario 1

- [X] T030 [P] [US1] Crear `backend/src/models/usuario.model.js` con la función de búsqueda de
  usuario por correo (incluye `password` solo para comparación interna) (FR-001, data-model §2.1)
- [X] T031 [US1] Crear `backend/src/services/auth.service.js`: compara la contraseña con
  `bcrypt`, rechaza usuarios `inactivo`, genera el JWT con `JWT_EXPIRES_IN` (60 minutos) y
  devuelve el usuario sin `password` (FR-001, FR-002, FR-003, FR-010)
- [X] T032 [US1] Crear `backend/src/controllers/auth.controller.js` con `login` y `yo`, usando
  las respuestas de `contracts/api-rest.md` §1 (FR-031)
- [X] T033 [US1] Crear `backend/src/routes/auth.routes.js` con `POST /api/auth/login` (pública)
  y `GET /api/auth/me` (protegida con `autenticar.js`) (contracts/api-rest.md §1)
- [X] T034 [P] [US1] Crear `frontend/src/context/SesionContext.jsx` que guarda token, usuario y
  rol, persiste la sesión en `localStorage` y limpia la sesión ante `401` (investigación R4, R6)
- [X] T035 [US1] Crear `frontend/src/pages/Login.jsx` con formulario de correo y contraseña,
  validación espejo, mensajes de error en español y manejo de credenciales incorrectas (FR-005,
  FR-018)
- [X] T036 [US1] Crear `frontend/src/components/MenuPrincipal.jsx` que muestra las opciones
  permitidas según el rol, sin usar esa ocultación como medida de seguridad (FR-006, principio V)
- [X] T037 [US1] Integrar en `frontend/src/App.jsx` la navegación por estado entre páginas según
  la sesión (sin dependencia de enrutador) y el cierre de sesión al expirar el token
- [X] T038 [US1] Ejecutar los escenarios 1 a 4 de `quickstart.md` y confirmar el flujo de
  inicio de sesión, credenciales inválidas y token expirado (SC-001, SC-002)

**Checkpoint**: la HU1 queda funcional y verificable de forma independiente.

---

## Fase 4: Historia de usuario 2 - Registro de clientes (Prioridad: P1)

**Objetivo**: administrador y recepcionista registran clientes con validación en backend.

**Prueba independiente**: un recepcionista autenticado registra un cliente con datos válidos y
el cliente queda almacenado en MySQL y visible en la consulta (spec.md, HU2).

### Pruebas para la Historia de usuario 2

- [X] T039 [P] [US2] Crear `backend/tests/integration/clientesRegistro.test.js`: registro válido
  por administrador y por recepcionista (`201`), campos obligatorios vacíos o correo con formato
  inválido (`400` sin persistir) y correo duplicado (`409` sin duplicar) (FR-014, FR-018, FR-020)
- [X] T040 [P] [US2] Crear `backend/tests/integration/clientesPermisos.test.js`: entrenador y
  cliente intentan registrar un cliente y reciben `403` desde el backend (FR-014, SC-002)

### Implementación para la Historia de usuario 2

- [X] T041 [P] [US2] Crear `backend/src/models/cliente.model.js` con `crearCliente` y
  `buscarClientePorCorreo`, respetando el índice único de `correo` (data-model §2.2, FR-020)
- [X] T042 [US2] Crear `backend/src/validators/cliente.validator.js` que exija `nombre`,
  `apellido` y `correo` obligatorios con formato válido, `telefono` y `direccion` opcionales con
  formato validado si se informan, y `estado` con valores únicamente `activo` o `inactivo`
  (FR-018, FR-020, clarify 2026-10-09)
- [X] T043 [US2] Crear `backend/src/services/cliente.service.js` con `registrarCliente`: valida
  entradas, traduce el duplicado de correo a error `409` y asigna `fecha_registro` y
  `estado = 'activo'` (FR-018, FR-020)
- [X] T044 [US2] Crear `backend/src/controllers/cliente.controller.js` con el controlador de
  registro (éxito `201` con `mensaje` y `cliente`, según `contracts/api-rest.md` §3)
- [X] T045 [US2] Crear `backend/src/routes/cliente.routes.js` con `POST /api/clientes`
  protegido con `autenticar.js` y `autorizar('administrador', 'recepcionista')` (FR-014)
- [X] T046 [P] [US2] Crear `frontend/src/pages/ClientesRegistro.jsx` con formulario, validación
  espejo y mensajes de éxito/error en español (FR-018, principio XI)
- [X] T047 [US2] Registrar la página en `frontend/src/App.jsx` dentro del menú permitido para
  administrador y recepcionista
- [X] T048 [US2] Ejecutar los escenarios 9 a 11 de `quickstart.md` y confirmar registro válido,
  correo duplicado y validación de entrada (SC-006)

**Checkpoint**: la HU2 queda funcional y verificable de forma independiente.

---

## Fase 5: Historia de usuario 3 - Registro de usuarios (Prioridad: P2)

**Objetivo**: el administrador registra usuarios con hash `bcrypt`, correo único y contraseña de
al menos 8 caracteres, y puede restablecer contraseñas.

**Prueba independiente**: el administrador registra un usuario nuevo con un rol válido y ese
usuario puede iniciar sesión con sus credenciales (spec.md, HU3).

### Pruebas para la Historia de usuario 3

- [X] T049 [P] [US3] Crear `backend/tests/integration/usuariosCreacion.test.js`: creación por
  administrador (`201` con `password` hasheado), correo duplicado (`409`), rol inválido o
  contraseña menor a 8 caracteres (`400`) y creación sin rol administrador (`403`) (FR-007,
  FR-011, FR-012, FR-013)
- [X] T050 [P] [US3] Crear `backend/tests/integration/usuariosPassword.test.js`: el
  restablecimiento de contraseña invalida la contraseña anterior y almacena la nueva con hash
  `bcrypt` (FR-011)

### Implementación para la Historia de usuario 3

- [X] T051 [US3] Ampliar `backend/src/models/usuario.model.js` con `crearUsuario`,
  `listarUsuarios`, `buscarUsuarioPorId`, `actualizarUsuario` y `restablecerPassword`,
  siempre sin exponer `password` en las respuestas (FR-007, FR-012)
- [X] T052 [US3] Crear `backend/src/validators/usuario.validator.js` que valide correo
  obligatorio y con formato, `nombre` obligatorio, contraseña de al menos 8 caracteres y `rol`
  dentro de `administrador`, `recepcionista`, `entrenador`, `cliente` (FR-008, FR-018)
- [X] T053 [US3] Ampliar `backend/src/services/usuario.service.js` con la creación de usuarios
  (hash `bcrypt`), la traducción de correo duplicado a `409` y el restablecimiento de contraseña
  con hash nuevo (FR-011, FR-012)
- [X] T054 [US3] Ampliar `backend/src/controllers/usuario.controller.js` con los controladores
  de listado, creación, actualización de datos y restablecimiento de contraseña
- [X] T055 [US3] Ampliar `backend/src/routes/usuario.routes.js` con `GET /api/usuarios`,
  `POST /api/usuarios`, `PATCH /api/usuarios/:id` y `PATCH /api/usuarios/:id/password`, todos
  con `autorizar('administrador')` (contracts/api-rest.md §2, FR-013)
- [X] T056 [P] [US3] Crear `frontend/src/pages/Usuarios.jsx` con listado, formulario de alta,
  edición básica y acción de restablecer contraseña, visible solo para administrador
- [X] T057 [US3] Ejecutar los escenarios 4 a 6 de `quickstart.md` y confirmar alta de usuario,
  correo duplicado y rechazo de contraseña corta (SC-006)

**Checkpoint**: la HU3 queda funcional y verificable de forma independiente.

---

## Fase 6: Historia de usuario 4 - Asignación de roles (Prioridad: P2)

**Objetivo**: el administrador asigna o cambia roles y activa o desactiva usuarios.

**Prueba independiente**: el administrador cambia el rol de un usuario de "entrenador" a
"recepcionista" y las funciones disponibles del usuario cambian en consecuencia (spec.md, HU4).

### Pruebas para la Historia de usuario 4

- [X] T058 [P] [US4] Crear `backend/tests/integration/usuariosRoles.test.js`: cambio de rol
  válido (`200`), rol fuera de los definidos (`400`) y operación sin rol administrador (`403`)
  (FR-008, FR-009, FR-013)
- [X] T059 [P] [US4] Crear `backend/tests/integration/usuariosEstado.test.js`: el usuario
  desactivado no puede iniciar sesión (`401`) y la reactivación lo permite de nuevo (FR-010)

### Implementación para la Historia de usuario 4

- [X] T060 [US4] Ampliar `backend/src/services/usuario.service.js` con `asignarRol` (valida el
  valor del rol) y `cambiarEstado` (solo `activo`/`inactivo`) (FR-008, FR-009, FR-010)
- [X] T061 [US4] Ampliar `backend/src/routes/usuario.routes.js` y
  `backend/src/controllers/usuario.controller.js` con `PATCH /api/usuarios/:id/rol` y
  `PATCH /api/usuarios/:id/estado`, protegidos con `autorizar('administrador')`
  (contracts/api-rest.md §2)
- [X] T062 [P] [US4] Crear `frontend/src/components/ControlesUsuario.jsx` con el selector de
  rol y el botón de activar/desactivar con confirmación obligatoria (principio XI)
- [X] T063 [US4] Integrar `frontend/src/components/ControlesUsuario.jsx` en
  `frontend/src/pages/Usuarios.jsx` y ejecutar los escenarios 7, 8 y 13 de `quickstart.md`
  (SC-002, SC-006)

**Checkpoint**: la HU4 queda funcional y verificable de forma independiente.

---

## Fase 7: Historia de usuario 5 - Modificación de clientes (Prioridad: P2)

**Objetivo**: administrador y recepcionista actualizan la información de un cliente existente.

**Prueba independiente**: un recepcionista modifica el teléfono de un cliente y la consulta
muestra el valor actualizado (spec.md, HU5).

### Pruebas para la Historia de usuario 5

- [X] T064 [P] [US5] Crear `backend/tests/integration/clientesModificacion.test.js`:
  modificación válida por administrador y por recepcionista (`200`), identificador inexistente
  (`404` con mensaje claro sin detalles internos), datos inválidos (`400`) y rol sin permiso
  (`403`) (FR-015, FR-018, Casos límite)

### Implementación para la Historia de usuario 5

- [X] T065 [US5] Ampliar `backend/src/services/cliente.service.js` con `modificarCliente`:
  valida de nuevo las entradas, impide cambiar el `id` y conserva `fecha_registro` (FR-015,
  FR-018)
- [X] T066 [US5] Ampliar `backend/src/routes/cliente.routes.js` y
  `backend/src/controllers/cliente.controller.js` con `PATCH /api/clientes/:id` protegido con
  `autorizar('administrador', 'recepcionista')` (contracts/api-rest.md §3)
- [X] T067 [P] [US5] Crear `frontend/src/pages/ClientesEdicion.jsx` con carga del cliente,
  formulario de edición y mensajes de éxito/error (FR-015, principio XI)
- [X] T068 [US5] Ejecutar los escenarios 12 y 13 de `quickstart.md` y confirmar la modificación
  y el `403` por rol (SC-006)

**Checkpoint**: la HU5 queda funcional y verificable de forma independiente.

---

## Fase 8: Historia de usuario 6 - Consulta de clientes (Prioridad: P3)

**Objetivo**: administrador, recepcionista y entrenador consultan clientes; el entrenador recibe
únicamente `nombre`, `apellido` y `estado`.

**Prueba independiente**: un entrenador autenticado consulta la lista de clientes y ve únicamente
la información permitida para su rol (spec.md, HU6).

### Pruebas para la Historia de usuario 6

- [X] T069 [P] [US6] Crear `backend/tests/integration/clientesConsulta.test.js`: el
  administrador y el recepcionista reciben todos los campos; el entrenador recibe únicamente
  `id`, `nombre`, `apellido` y `estado`, sin `correo`, `telefono`, `direccion` ni
  `fecha_registro`; un cliente no puede listar otros clientes (`403`) (FR-016, FR-017, SC-002)

### Implementación para la Historia de usuario 6

- [X] T070 [US6] Ampliar `backend/src/services/cliente.service.js` con `listarClientes` y
  `obtenerCliente`, proyectando los campos según el rol de `req.usuario` (FR-016, clarify
  2026-10-09)
- [X] T071 [US6] Ampliar `backend/src/routes/cliente.routes.js` y
  `backend/src/controllers/cliente.controller.js` con `GET /api/clientes` (roles:
  administrador, recepcionista, entrenador) y `GET /api/clientes/:id` (roles: administrador,
  recepcionista) (contracts/api-rest.md §3)
- [X] T072 [P] [US6] Crear `frontend/src/pages/ClientesLista.jsx` con listado, estados vacíos y
  de carga, y mensajes de error en español (principio XI)
- [X] T073 [US6] Ejecutar el escenario 14 de `quickstart.md` y confirmar el filtrado de campos
  por rol (SC-002, SC-006)

**Checkpoint**: la HU6 queda funcional y verificable de forma independiente.

---

## Fase 9: Historia de usuario 7 - Consulta de información propia (Prioridad: P3)

**Objetivo**: el cliente consulta únicamente su propia información.

**Prueba independiente**: un usuario con rol cliente inicia sesión y ve sus propios datos, sin
acceder a los datos de ningún otro cliente (spec.md, HU7).

### Pruebas para la Historia de usuario 7

- [X] T074 [P] [US7] Crear `backend/tests/integration/clientesPropio.test.js`:
  `GET /api/clientes/yo` devuelve los datos completos del cliente autenticado (`200`), sin token
  responde `401` y la consulta de otro cliente responde `403` (FR-017, SC-002)

### Implementación para la Historia de usuario 7

- [X] T075 [US7] Ampliar `backend/src/routes/cliente.routes.js` y
  `backend/src/controllers/cliente.controller.js` con `GET /api/clientes/yo` protegido con
  `autorizar('cliente')`, resolviendo el cliente desde el usuario de la sesión
  (contracts/api-rest.md §3, FR-017)
- [X] T076 [P] [US7] Crear `frontend/src/pages/MiPerfil.jsx` que muestra los datos propios del
  cliente sin opción de consultar a otros (FR-017, RN-14)
- [X] T077 [US7] Ejecutar el escenario 15 de `quickstart.md` y confirmar el acceso solo a la
  información propia (SC-006)

**Checkpoint**: las 7 historias quedan funcionales e independientes.

---

## Fase 10: Pulido y preocupaciones transversales

**Propósito**: mejoras que afectan a varias historias y validación final del sprint.

- [X] T078 [P] Verificar en `backend/` la ausencia total de `require()` y `module.exports` y la
  presencia de `"type": "module"` en `backend/package.json` (FR-029, SC-008)
- [X] T079 [P] Verificar que `.env` está en `.gitignore` y que `.env.example` (raíz y
  `backend/`) no contiene secretos reales (FR-026, SC-005)
- [X] T080 [P] Verificar que `frontend/` no contiene credenciales de base de datos ni acceso
  directo a MySQL (FR-033, SC-007)
- [X] T081 Reconstruir la base de datos desde cero: borrarla y reejecutar
  `node database/scripts/aplicar-migraciones.js` para confirmar SC-004
- [X] T082 Ejecutar la suite completa de pruebas (`backend: npm test` y `frontend: npm test`) y
  corregir cualquier fallo antes de dar por terminada la historia correspondiente (principio X)
- [X] T083 Ejecutar el flujo de demostración de `quickstart.md` §5 completo en menos de 5
  minutos con el administrador sembrado (SC-001)
- [X] T084 [P] Revisar que todos los mensajes mostrados al usuario están en español, son claros
  y no revelan información técnica interna (FR-034, principio XI)
- [X] T085 [P] Confirmar que no hay librerías de reconocimiento facial instaladas ni endpoints
  sobre `tipos_membresia`, `membresias` o `pagos` (FR-027, FR-035)
- [X] T086 [P] Actualizar `README.md` y `database/README.md` con los pasos de instalación,
  arranque, migraciones y pruebas

---

## Dependencias y orden de ejecución

### Dependencias entre fases

- **Configuración (Fase 1)**: sin dependencias; puede comenzar de inmediato.
- **Fundacional (Fase 2)**: depende de la Fase 1; **bloquea todas** las historias de usuario.
- **Historias de usuario (Fases 3 a 9)**: todas dependen de la Fase 2. Una vez completada, pueden
  ejecutarse en paralelo o en orden de prioridad (P1 → P2 → P3).
- **Pulido (Fase 10)**: depende de las historias que se deseen dar por terminadas.

### Dependencias entre historias de usuario

- **HU1 (P1)**: comienza tras la Fase 2; sin dependencias de otras historias.
- **HU2 (P1)**: comienza tras la Fase 2; comparte el frontend con HU1 pero es independiente en
  pruebas.
- **HU3 (P2)**: amplía `usuario.model.js` creado en HU1; recomendado después de HU1.
- **HU4 (P2)**: amplía `usuario.service.js` y las rutas de HU3; recomendado después de HU3.
- **HU5 (P2)**: amplía `cliente.service.js` y las rutas de HU2; recomendado después de HU2.
- **HU6 (P3)**: amplía las rutas de clientes de HU2/HU5; recomendado después de HU5.
- **HU7 (P3)**: amplía las rutas de clientes de HU2; recomendado después de HU6.

### Dentro de cada historia de usuario

1. Pruebas primero (deben fallar antes de implementar).
2. Modelos → servicios → rutas/controladores → frontend.
3. Tarea de validación con `quickstart.md` al final de la fase.

### Oportunidades de paralelismo

- Todas las tareas marcadas `[P]` de la Fase 1 y la Fase 2 pueden ejecutarse en paralelo.
- Tras la Fase 2, HU1 y HU2 pueden avanzar en paralelo (archivos distintos).
- Dentro de cada historia, las pruebas y los modelos son paralelizables.
- Con el equipo repartido: desarrollador A en HU1/HU3/HU4 (rama de usuarios) y desarrollador B en
  HU2/HU5/HU6/HU7 (rama de clientes), integrando tras la Fase 2.

---

## Ejemplo de paralelismo: Historia de usuario 1

```text
# Lanzar juntas las pruebas de la HU1:
Tarea: "Crear backend/tests/integration/auth.test.js"
Tarea: "Crear backend/tests/integration/rutasProtegidas.test.js"

# Lanzar juntas las tareas independientes de la HU1:
Tarea: "Crear backend/src/models/usuario.model.js"
Tarea: "Crear frontend/src/context/SesionContext.jsx"
```

---

## Estrategia de implementación

### MVP primero (solo Historia de usuario 1)

1. Completar Fase 1: Configuración.
2. Completar Fase 2: Fundacional (**CRÍTICO**: bloquea todas las historias).
3. Completar Fase 3: Historia de usuario 1.
4. **PARAR Y VALIDAR**: probar la HU1 de forma independiente con `quickstart.md` (escenarios 1 a
   4).
5. Demostrar el inicio de sesión y el menú por rol.

### Entrega incremental

1. Configuración + Fundacional → base lista.
2. + HU1 → probar → demostrar (MVP de autenticación).
3. + HU2 → probar → demostrar (registro de clientes).
4. + HU3 y HU4 → probar → demostrar (usuarios y roles).
5. + HU5, HU6 y HU7 → probar → demostrar (modificación y consultas).
6. Pulido → validación completa de SC-001 a SC-008.

Cada historia añade valor sin romper las anteriores.

---

## Notas

- Las tareas `[P]` usan archivos distintos y no dependen de tareas sin completar.
- La etiqueta `[USn]` vincula la tarea con su historia para la trazabilidad de `spec.md`.
- Cada historia debe poder completarse y probarse de forma independiente.
- Confirmar que las pruebas fallan antes de implementar.
- Hacer commit después de cada tarea o grupo lógico con Conventional Commits en español.
- Detenerse en cada checkpoint para validar la historia de forma independiente.
- Evitar: tareas vagas, conflictos en el mismo archivo y dependencias que rompan la independencia
  entre historias.
