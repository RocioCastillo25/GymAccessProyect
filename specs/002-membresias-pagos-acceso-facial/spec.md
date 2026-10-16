# Especificación de la Funcionalidad: Sprint 2 - Membresías, pagos, reconocimiento facial y control de acceso

**Rama de la funcionalidad**: `002-membresias-pagos-acceso-facial`

**Creada**: 2026-10-15

**Estado**: Borrador

**Entrada**: Descripción del usuario: "Genera la especificación para Sprint 2. Usa
docs/project-context.md, docs/reglas.md y docs/sprint-2.md como fuentes de verdad. Sprint 2 debe
cubrir la gestión de tipos de membresía, la asignación y renovación de membresías, el registro y
consulta de pagos y adeudos, el registro de información facial, la identificación mediante
reconocimiento facial, la validación de acceso y la consulta de accesos. Debe mantener la
arquitectura frontend/, backend/, database/ y ES Modules en backend y scripts JavaScript de
database. El reconocimiento facial se usa únicamente para identificar clientes registrados y
controlar su acceso.".

**Fuentes de verdad**: `docs/project-context.md`, `docs/reglas.md`, `docs/sprint-2.md`, y la
especificación aprobada del Sprint 1 (`specs/001-sprint-1-base-sistema/spec.md`).

**Dependencia**: este sprint reutiliza usuarios y clientes creados en el Sprint 1. No redefine
autenticación, roles ni el registro y consulta de clientes.

## Escenarios de usuario y pruebas *(obligatorio)*

### Historia de usuario 1 - Registro de tipos de membresía (Prioridad: P1) — US-S2-01

Como administrador, quiero registrar los diferentes tipos de membresía para definir sus
características, duración y precio.

**Por qué esta prioridad**: los tipos de membresía son el catálogo base del sprint; sin ellos no se
puede asignar ni renovar una membresía. Bloquea a las historias de membresías y pagos.

**Prueba independiente**: el administrador registra un tipo de membresía con nombre, duración y
precio válidos, y el tipo queda disponible para asignarse a un cliente.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado, **Cuando** registra un tipo de membresía con nombre,
   duración y precio válidos, **Entonces** el sistema almacena el tipo y lo muestra en la consulta.
2. **Dado** un administrador autenticado, **Cuando** modifica un tipo de membresía existente,
   **Entonces** el sistema actualiza sus datos sin alterar las membresías ya generadas.
3. **Dado** un recepcionista o un entrenador autenticado, **Cuando** intenta registrar o modificar
   un tipo de membresía, **Entonces** el sistema deniega la operación.

---

### Historia de usuario 2 - Asignación de membresía (Prioridad: P1) — US-S2-02

Como administrador o recepcionista, quiero asignar una membresía a un cliente para registrar su
periodo de acceso al gimnasio.

**Por qué esta prioridad**: es la relación central entre cliente y vigencia; sin asignación no hay
validación de acceso ni control de vencimientos.

**Prueba independiente**: un recepcionista autenticado asigna una membresía a un cliente existente y
el sistema registra las fechas de inicio y finalización según el tipo elegido.

**Escenarios de aceptación**:

1. **Dado** un administrador o recepcionista autenticado y un cliente existente, **Cuando** asigna
   una membresía con un tipo válido, **Entonces** el sistema registra la fecha de inicio y calcula
   la fecha de finalización según la duración del tipo.
2. **Dado** un cliente inexistente o un tipo de membresía inválido, **Cuando** se intenta asignar
   una membresía, **Entonces** el sistema rechaza la operación sin persistir nada.
3. **Dado** un entrenador o un cliente autenticado, **Cuando** intenta asignar una membresía,
   **Entonces** el sistema deniega la operación.

---

### Historia de usuario 3 - Renovación de membresía (Prioridad: P2) — US-S2-03

Como administrador o recepcionista, quiero renovar la membresía de un cliente para mantener
actualizado su periodo de acceso al gimnasio.

**Por qué esta prioridad**: prolonga la vigencia de clientes ya activos; aporta valor continuo pero
depende de que exista una membresía asignada.

**Prueba independiente**: un recepcionista autenticado renueva la membresía de un cliente y el nuevo
periodo queda reflejado en la consulta.

**Escenarios de aceptación**:

1. **Dado** un cliente con una membresía existente, **Cuando** el administrador o recepcionista
   renueva con un tipo válido, **Entonces** el sistema extiende la vigencia a partir de la fecha
   correspondiente y conserva el historial anterior.
2. **Dado** un cliente sin membresía previa, **Cuando** se intenta renovar, **Entonces** el sistema
   rechaza la operación con un mensaje claro.
3. **Dado** un usuario sin permiso de gestión de membresías, **Cuando** intenta renovar,
   **Entonces** el sistema deniega la operación.

---

### Historia de usuario 4 - Registro de pagos (Prioridad: P1) — US-S2-04

Como administrador o recepcionista, quiero registrar los pagos realizados por los clientes para
mantener un historial financiero.

**Por qué esta prioridad**: el pago es parte central del control financiero del gimnasio y se
relaciona con la membresía del cliente.

**Prueba independiente**: un recepcionista autenticado registra un pago asociado a un cliente y su
membresía, y el pago aparece en el historial del cliente.

**Escenarios de aceptación**:

1. **Dado** un administrador o recepcionista autenticado y un cliente con membresía, **Cuando**
   registra un pago con monto y método válidos, **Entonces** el sistema almacena el pago asociado al
   cliente y a la membresía.
2. **Dado** un pago con monto inválido o faltante, **Cuando** se intenta registrar, **Entonces** el
   sistema rechaza la operación sin persistir nada.
3. **Dado** un entrenador o un cliente autenticado, **Cuando** intenta registrar un pago,
   **Entonces** el sistema deniega la operación.

---

### Historia de usuario 5 - Consulta de pagos y adeudos (Prioridad: P2) — US-S2-05

Como administrador, quiero consultar los pagos y adeudos de los clientes para llevar un control
financiero del gimnasio.

**Por qué esta prioridad**: la consulta financiera es de lectura sobre datos ya registrados y no
bloquea las operaciones de registro.

**Prueba independiente**: el administrador autenticado consulta el historial de pagos de un cliente
y visualiza los adeudos identificados por el sistema.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado, **Cuando** consulta el historial de pagos, **Entonces** el
   sistema muestra los pagos registrados asociados a clientes y membresías.
2. **Dado** un administrador autenticado, **Cuando** consulta adeudos, **Entonces** el sistema
   identifica a los clientes con membresías activas sin el pago correspondiente.
3. **Dado** un recepcionista o un entrenador autenticado, **Cuando** intenta consultar información
   financiera administrativa, **Entonces** el sistema aplica los permisos de su rol.
4. **Dado** un usuario con rol cliente, **Cuando** consulta sus pagos y adeudos, **Entonces** el
   sistema muestra únicamente la información propia.

---

### Historia de usuario 6 - Registro de información facial (Prioridad: P1) — US-S2-06

Como administrador o recepcionista autorizado, quiero registrar la información facial de un cliente
para permitir su identificación al ingresar al gimnasio.

**Por qué esta prioridad**: sin información facial registrada no es posible la identificación ni el
control de acceso por rostro, que son el eje del sprint.

**Prueba independiente**: un recepcionista autenticado registra la información facial de un cliente
existente y el sistema la asocia correctamente a ese cliente.

**Escenarios de aceptación**:

1. **Dado** un administrador o recepcionista autenticado y un cliente existente, **Cuando** registra
   su información facial mediante la cámara, **Entonces** el sistema la procesa y la asocia al
   cliente.
2. **Dado** un cliente no registrado, **Cuando** se intenta asociar información facial, **Entonces**
   el sistema rechaza la operación.
3. **Dado** un cliente que ya tiene información facial registrada, **Cuando** se registra de nuevo,
   **Entonces** el sistema actualiza la información asociada sin duplicar al cliente.
4. **Dado** un intento de acceso a los datos biométricos desde fuera de los flujos autorizados,
   **Cuando** se solicita su consulta, **Entonces** el sistema no expone el descriptor facial.

---

### Historia de usuario 7 - Identificación mediante reconocimiento facial (Prioridad: P1) — US-S2-07

Como cliente previamente registrado, quiero utilizar mi rostro para identificarme al ingresar al
gimnasio.

**Por qué esta prioridad**: la identificación facial es una de las funciones principales del
sistema y es requisito previo a la validación de acceso.

**Prueba independiente**: un cliente con información facial registrada se identifica ante la cámara
y el sistema lo reconoce como el cliente correcto.

**Escenarios de aceptación**:

1. **Dado** un cliente con información facial registrada, **Cuando** la cámara captura su rostro,
   **Entonces** el sistema lo identifica y obtiene al cliente correspondiente.
2. **Dado** un rostro que no coincide con ningún cliente registrado, **Cuando** se procesa la
   captura, **Entonces** el sistema no identifica a nadie y lo reporta como no reconocido.
3. **Dado** un rostro que coincide con un cliente registrado, **Cuando** el sistema lo identifica,
   **Entonces** la coincidencia por sí sola no autoriza el acceso; todavía debe validarse la
   membresía.

---

### Historia de usuario 8 - Validación de acceso (Prioridad: P1) — US-S2-08

Como sistema, quiero verificar la membresía del cliente después de identificarlo para determinar si
puede ingresar al gimnasio.

**Por qué esta prioridad**: es el objetivo final del sprint; combina la identificación facial con el
estado de la membresía para autorizar o rechazar el acceso.

**Prueba independiente**: tras identificar a un cliente, el sistema autoriza el acceso si su
membresía está vigente y lo rechaza si está vencida, suspendida, cancelada o no existe.

**Escenarios de aceptación**:

1. **Dado** un cliente identificado con membresía activa y vigente, **Cuando** se valida el acceso,
   **Entonces** el sistema autoriza la entrada y lo registra como acceso autorizado.
2. **Dado** un cliente identificado con membresía vencida, suspendida o cancelada, **Cuando** se
   valida el acceso, **Entonces** el sistema rechaza la entrada y registra el motivo.
3. **Dado** un cliente identificado sin membresía registrada, **Cuando** se valida el acceso,
   **Entonces** el sistema rechaza la entrada y registra el motivo.
4. **Dado** un rostro no identificado, **Cuando** se intenta validar el acceso, **Entonces** el
   sistema rechaza el acceso y registra el intento con su motivo.

---

### Historia de usuario 9 - Consulta de accesos (Prioridad: P3) — US-S2-09

Como administrador o recepcionista, quiero consultar los registros de acceso para conocer las
entradas autorizadas y los intentos rechazados.

**Por qué esta prioridad**: es de lectura y auditoría operativa; aporta valor una vez que el control
de acceso ya genera registros.

**Prueba independiente**: un recepcionista autenticado consulta el historial de accesos y ve tanto
entradas autorizadas como intentos rechazados con su motivo.

**Escenarios de aceptación**:

1. **Dado** un administrador o recepcionista autenticado, **Cuando** consulta los registros de
   acceso, **Entonces** el sistema muestra los accesos autorizados y rechazados con fecha, hora y
   resultado.
2. **Dado** un acceso rechazado, **Cuando** se consulta el registro, **Entonces** el sistema muestra
   el motivo del rechazo.
3. **Dado** un usuario con rol cliente, **Cuando** consulta su historial de accesos, **Entonces** el
   sistema muestra únicamente sus propios accesos.

---

### Casos límite

- ¿Qué sucede cuando se registra un pago para una membresía inexistente o de otro cliente? El
  sistema debe rechazar la operación y no persistir el pago.
- ¿Qué sucede cuando se asigna una membresía a un cliente inexistente o inactivo? Debe rechazarse
  con un mensaje claro sin persistir nada.
- ¿Qué sucede cuando dos pagos idénticos se envían al mismo tiempo? Solo debe persistirse uno; el
  otro debe rechazarse o marcarse como duplicado sin corromper el historial.
- ¿Qué sucede cuando un cliente tiene varias membresías a lo largo del tiempo? Debe conservarse el
  historial y usar la vigente para validar el acceso.
- ¿Qué sucede cuando la membresía vence el mismo día del intento de acceso? Debe aplicarse la regla
  de vigencia definida (por defecto, la membresía es válida hasta el final de su fecha de
  finalización) y registrarse el resultado.
- ¿Qué sucede cuando la cámara no detecta ningún rostro? Debe registrarse el intento como no
  reconocido con su motivo y no autorizar el acceso.
- ¿Qué sucede cuando hay más de un cliente con rostros muy similares? Debe aplicarse el umbral de
  coincidencia; si ninguna coincidencia supera el umbral, el acceso se rechaza y se registra.
- ¿Qué sucede cuando el servicio de base de datos no está disponible? El backend debe responder con
  un error controlado, sin stack traces ni credenciales, y no autorizar el acceso.
- ¿Qué sucede cuando un usuario sin permiso intenta registrar pagos, membresías o rostros? El
  backend debe denegar la operación aunque el frontend oculte la opción.
- ¿Qué sucede cuando se intenta eliminar un pago o un acceso? No debe permitirse su eliminación
  ordinaria; forman parte del historial.
- ¿Qué sucede cuando un rostro no reconocido intenta repetidamente el acceso? Debe registrarse cada
  intento y aplicarse el máximo de intentos definido antes de reportar el rechazo.

## Requisitos *(obligatorio)*

### Requisitos funcionales

**Tipos de membresía**

- **FR-001**: Únicamente el administrador DEBE poder registrar tipos de membresía con nombre,
  descripción, duración y precio.
- **FR-002**: El administrador y el recepcionista DEBEN poder consultar los tipos de membresía; el
  entrenador DEBE poder consultar el nombre y la duración de los tipos (sin información financiera).
- **FR-003**: El administrador DEBE poder modificar los tipos de membresía sin alterar las
  membresías ya generadas.
- **FR-004**: Un tipo de membresía DEBE tener una duración y un precio válidos y un estado que lo
  habilite o deshabilite para nuevas asignaciones.

**Membresías**

- **FR-005**: El administrador y el recepcionista DEBEN poder asignar una membresía a un cliente
  existente usando un tipo de membresía válido.
- **FR-006**: Toda membresía DEBE registrar una fecha de inicio y una fecha de finalización
  calculada a partir de la duración del tipo de membresía.
- **FR-007**: El sistema DEBE identificar el estado de una membresía: activa, vencida, suspendida o
  cancelada.
- **FR-008**: El administrador y el recepcionista DEBEN poder renovar la membresía de un cliente,
  conservando el historial de la anterior.
- **FR-009**: El cliente DEBE poder consultar únicamente su propia membresía y su vigencia.
- **FR-010**: El administrador y el recepcionista DEBEN poder consultar las membresías de los
  clientes conforme a los permisos de su rol.

**Pagos y adeudos**

- **FR-011**: El administrador y el recepcionista DEBEN poder registrar pagos asociados a un cliente
  y a su membresía correspondiente, con monto, fecha, método de pago y estado.
- **FR-012**: El administrador DEBE poder consultar el historial de pagos y los adeudos de los
  clientes.
- **FR-013**: El cliente DEBE poder consultar únicamente sus propios pagos y adeudos.
- **FR-014**: El historial de pagos NO DEBE eliminarse de manera ordinaria; forma parte del
  historial financiero del sistema.
- **FR-015**: El sistema DEBE identificar adeudos cuando exista una membresía activa sin el pago
  correspondiente registrado.

**Reconocimiento facial**

- **FR-016**: El administrador y el recepcionista autorizado DEBEN poder registrar la información
  facial de un cliente previamente registrado.
- **FR-017**: La información facial DEBE asociarse a un cliente existente y solo podrá registrarse
  para clientes previamente registrados.
- **FR-018**: El sistema DEBE poder identificar a un cliente registrado comparando la captura de la
  cámara con la información facial almacenada.
- **FR-019**: El sistema DEBE rechazar la identificación cuando ninguna coincidencia supere el umbral
  de similitud definido.
- **FR-020**: Los datos biométricos DEBEN tratarse como información sensible, almacenarse de forma
  protegida y NO exponerse mediante endpoints públicos ni devolverse al frontend. La información
  facial se usará únicamente para identificación y control de acceso, nunca para vigilancia o
  seguimiento.

**Control de acceso**

- **FR-021**: El sistema DEBE identificar al cliente mediante reconocimiento facial ANTES de validar
  su membresía.
- **FR-022**: El sistema DEBE autorizar el acceso únicamente cuando exista una coincidencia facial
  válida Y una membresía vigente y activa.
- **FR-023**: El sistema DEBE rechazar el acceso cuando la membresía esté vencida, suspendida,
  cancelada o no exista.
- **FR-024**: El sistema DEBE registrar cada intento de acceso, autorizado o rechazado, con fecha,
  hora, resultado y, cuando corresponda, el motivo del rechazo.
- **FR-025**: Los registros de acceso NO DEBEN eliminarse de manera ordinaria.
- **FR-026**: El administrador y el recepcionista DEBEN poder consultar los registros de acceso; el
  entrenador DEBE poder consultar la asistencia conforme a los permisos de su rol.
- **FR-027**: El cliente DEBE poder consultar únicamente su propio historial de accesos.

**Seguridad y permisos**

- **FR-028**: El backend DEBE validar los permisos de cada rol antes de ejecutar cualquier operación
  de este sprint.
- **FR-029**: El backend DEBE validar los datos de entrada (montos, fechas, duraciones, tipos,
  campos obligatorios y formatos) antes de persistirlos.
- **FR-030**: El sistema DEBE responder en JSON con códigos HTTP apropiados y mensajes de error
  claros que no revelen información técnica interna.

**Base de datos y arquitectura**

- **FR-031**: El sistema DEBE implementar funcionalmente las tablas `tipos_membresia`, `membresias`,
  `pagos`, `rostros`, `accesos` y `auditoria`, manteniendo las tablas `usuarios` y `clientes` del
  Sprint 1.
- **FR-032**: Las tablas DEBEN utilizar MySQL local con motor InnoDB y codificación `utf8mb4`, con
  llaves primarias, llaves foráneas e integridad referencial.
- **FR-033**: Los cambios de estructura DEBEN agregarse como scripts SQL numerados en
  `database/migrations/`, y la base de datos DEBE poder reconstruirse íntegramente a partir de
  ellos.
- **FR-034**: El backend DEBE mantener ES Modules (`"type": "module"`, `import`/`export`, sin
  `require()` ni `module.exports`) y la separación por capas (`routes/`, `controllers/`, `services/`,
  `models/`, `middlewares/`, `validators/`, `utils/`).
- **FR-035**: El frontend DEBE usar React con JavaScript y NO DEBE tener acceso directo a MySQL; toda
  comunicación pasa por la API REST del backend.
- **FR-036**: La auditoría DEBE registrar las acciones relevantes del sprint (registro de tipos de
  membresía, asignación y renovación de membresías, registro de pagos, registro de información facial
  y control de acceso); su consulta será exclusiva del administrador.
- **FR-037**: El sistema DEBE conservar el historial de membresías, pagos y accesos para poder
  evaluar la evolución y el control del gimnasio.

### Entidades clave

- **tipos_membresia**: catálogo de planes disponibles. Atributos clave: nombre, descripción,
  duración, precio y estado. Se relaciona con muchas membresías.
- **membresias**: periodo de acceso de un cliente. Atributos clave: cliente, tipo de membresía, fecha
  de inicio, fecha de finalización y estado (activa, vencida, suspendida o cancelada). Un cliente
  puede tener varias a lo largo del tiempo.
- **pagos**: historial financiero. Atributos clave: cliente, membresía, monto, fecha de pago, método
  de pago y estado. Se relaciona con un cliente y, cuando corresponde, con una membresía.
- **rostros**: información de identificación facial asociada a un cliente. Atributos clave: cliente,
  descriptor facial, fecha de registro y estado. Se almacena solo lo necesario para la
  identificación y se protege como información sensible.
- **accesos**: registro de intentos de entrada. Atributos clave: cliente (cuando se identifica),
  fecha, hora, tipo, resultado (autorizado/rechazado) y motivo de rechazo.
- **auditoria**: registro de acciones importantes. Atributos clave: usuario, acción, módulo, fecha,
  resultado y descripción.
- **usuarios** y **clientes**: entidades del Sprint 1 reutilizadas; las membresías, pagos, rostros y
  accesos se relacionan con el cliente.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **SC-001**: Un usuario autorizado completa el flujo de demostración del sprint (registrar tipo de
  membresía, asignar membresía, registrar pago, registrar rostro, identificar al cliente, validar el
  acceso y consultar el registro) en menos de 5 minutos.
- **SC-002**: El 100 % de las rutas protegidas rechazan solicitudes sin token válido o con un rol sin
  permiso (0 operaciones no autorizadas en la prueba de roles).
- **SC-003**: El 100 % de los intentos de acceso quedan registrados con su resultado y, cuando son
  rechazados, con su motivo.
- **SC-004**: El 0 % de los datos biométricos se expone mediante endpoints públicos o se devuelve al
  frontend; los descriptores faciales permanecen en almacenamiento protegido.
- **SC-005**: El reconocimiento facial identifica correctamente a clientes registrados y rechaza los
  rostros sin coincidencia válida en la prueba de extremo a extremo.
- **SC-006**: El 100 % de los accesos con membresía vencida, suspendida, cancelada o inexistente son
  rechazados (0 accesos indebidos).
- **SC-007**: La base de datos se reconstruye desde cero ejecutando únicamente los scripts SQL
  versionados de `database/`.
- **SC-008**: Ningún secreto (credenciales de MySQL, claves JWT) está presente en el repositorio;
  `.env` no se versiona y `.env.example` existe.
- **SC-009**: El frontend no realiza ninguna conexión directa a MySQL y no contiene credenciales de
  base de datos; el backend no expone `require()` ni `module.exports`.
- **SC-010**: Las 9 historias de usuario pasan de extremo a extremo (frontend → API REST → MySQL) en
  el entorno local.

## Supuestos

- El Sprint 1 está implementado: existen autenticación JWT, roles, y el registro y la consulta de
  clientes sobre los que se apoya este sprint.
- MySQL está instalado y se ejecuta localmente durante el desarrollo y la demostración.
- La librería de reconocimiento facial se seleccionará y justificará en la fase de planificación
  (research/plan), no en esta especificación; debe ser compatible con JavaScript, React, Node.js,
  ejecución local y cámara.
- Se almacenan descriptores faciales, no imágenes faciales, salvo justificación técnica y de
  seguridad aprobada; el descriptor nunca se expone al frontend.
- El umbral de coincidencia facial y el número máximo de intentos por acceso se definirán en la fase
  de planificación con valores predeterminados razonables.
- Una membresía se considera vigente hasta el final de su fecha de finalización, salvo que esté
  suspendida o cancelada; no se aplica un periodo de tolerancia adicional en este sprint.
- Renovar una membresía antes de su vencimiento extiende la vigencia conservando el historial de la
  membresía anterior.
- El método de pago se registra como un dato del pago; no se procesan pagos con bancos ni plataformas
  externas y no se manejan pagos parciales en este sprint, salvo indicación contraria del equipo.
- Los mensajes e interfaz se redactan en español.
- La verificación de permisos ocurre en el backend aunque el frontend oculte opciones según el rol.

## Fuera del alcance del Sprint 2

- Dashboard avanzado y reportes avanzados.
- Aplicación móvil, múltiples sucursales, nómina, inventario, contabilidad completa y facturación
  electrónica.
- Procesamiento directo de pagos mediante bancos o plataformas externas.
- Vigilancia, seguimiento o rastreo facial de clientes.
- Identificación facial de personas no registradas o con fines distintos al control de acceso.
- Reconocimiento facial en espacios distintos al punto de acceso definido.
- Gestión, asignación y consulta de entrenadores y rutinas (Sprint 3).
- Cualquier función que no forme parte del MVP definido en `docs/project-context.md`.

## Preguntas abiertas para `/speckit.clarify`

Decisiones que el equipo debe aprobar y que se resolverán con `/speckit.clarify` o durante el plan:

- Librería de reconocimiento facial y compatibilidad con React y Node.js.
- Lugar donde se ejecuta el procesamiento facial (frontend, backend o combinación).
- Forma de almacenamiento y protección de los descriptores faciales.
- Umbral de coincidencia facial y número máximo de intentos por acceso.
- Condiciones mínimas de iluminación y cámara para las pruebas.
- Métodos de pago admitidos y política de pagos parciales.
- Política para membresías suspendidas y tiempo de tolerancia tras el vencimiento.
- Reglas específicas de auditoría que serán funcionales en este sprint.
- Driver de MySQL (driver directo, query builder u ORM): decisión de planificación.

## Trazabilidad

| Historia de usuario | US origen | Requisitos principales                          | Sprint   |
| ------------------- | --------- | ----------------------------------------------- | -------- |
| HU1                 | US-S2-01  | FR-001 a FR-004                                 | Sprint 2 |
| HU2                 | US-S2-02  | FR-005 a FR-007, FR-010, FR-037                 | Sprint 2 |
| HU3                 | US-S2-03  | FR-008, FR-009, FR-037                          | Sprint 2 |
| HU4                 | US-S2-04  | FR-011, FR-014, FR-015                          | Sprint 2 |
| HU5                 | US-S2-05  | FR-012, FR-013, FR-015                          | Sprint 2 |
| HU6                 | US-S2-06  | FR-016, FR-017, FR-020                          | Sprint 2 |
| HU7                 | US-S2-07  | FR-018, FR-019, FR-020                          | Sprint 2 |
| HU8                 | US-S2-08  | FR-021 a FR-025                                 | Sprint 2 |
| HU9                 | US-S2-09  | FR-026, FR-027                                  | Sprint 2 |

Los requisitos FR-028 a FR-037 cubren seguridad, permisos, base de datos y arquitectura, y se
verifican mediante los criterios de éxito SC-002, SC-004, SC-007, SC-008 y SC-009.
