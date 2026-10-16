# Especificación de la Funcionalidad: Sprint 3 - Entrenadores, rutinas y dashboard administrativo

**Rama de la funcionalidad**: `003-entrenadores-rutinas-dashboard`

**Creada**: 2026-10-15

**Estado**: Borrador

**Entrada**: Descripción del usuario: "Genera la especificación para Sprint 3. Usa
docs/project-context.md, docs/reglas.md y docs/sprint-3.md como fuentes de verdad. Sprint 3 debe
cubrir el registro de entrenadores, la asignación de entrenador a cliente, la creación de rutinas de
entrenamiento con ejercicios, el registro de objetivos y progresos, la consulta de rutina y progreso
por parte del cliente, la consulta del personal asignado y un dashboard administrativo. Debe mantener
la arquitectura frontend/, backend/, database/ y ES Modules en backend. Reutiliza usuarios, clientes,
membresías y accesos de los Sprints 1 y 2.".

**Fuentes de verdad**: `docs/project-context.md`, `docs/reglas.md`, `docs/sprint-3.md` y la
constitución del proyecto (`.specify/memory/constitution.md`).

**Dependencia**: reutiliza `usuarios` y `clientes` de los Sprints 1 y 2. No revisa membresías,
pagos, reconocimiento facial ni control de acceso más allá de su relación con la asignación de
clientes y el dashboard.

## Escenarios de usuario y pruebas *(obligatorio)*

### Historia de usuario 1 - Registro de entrenadores (Prioridad: P1) — US-S3-01

Como administrador, quiero registrar a los entrenadores del gimnasio para definir quiénes estarán a
cargo del acompañamiento de los clientes.

**Por qué esta prioridad**: es la base del sprint; sin entrenadores registrados no hay asignación,
rutinas ni progresos.

**Prueba independiente**: un administrador autenticado registra un entrenador asociado a un usuario
con rol entrenador y el sistema lo muestra en la consulta.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado y un usuario con rol `entrenador`, **Cuando** registra al
   entrenador con sus datos válidos, **Entonces** el sistema almacena el entrenador y lo asocia al
   usuario del sistema.
2. **Dado** un administrador autenticado, **Cuando** intenta registrar un entrenador con un usuario
   inexistente o con un rol no permitido, **Entonces** el sistema rechaza la operación sin persistir.
3. **Dado** un recepcionista o un entrenador autenticado, **Cuando** intenta registrar o modificar un
   entrenador, **Entonces** el sistema deniega la operación.

---

### Historia de usuario 2 - Asignación de entrenador a cliente (Prioridad: P1) — US-S3-02

Como administrador o recepcionista, quiero asignar un entrenador a un cliente para establecer la
responsabilidad del seguimiento físico y de entrenamiento.

**Por qué esta prioridad**: es la relación que habilita la creación de rutinas y el registro de
progresos para los clientes.

**Prueba independiente**: un recepcionista autenticado asigna un entrenador existente a un cliente
activo y la asignación queda reflejada en la consulta.

**Escenarios de aceptación**:

1. **Dado** un administrador o recepcionista autenticado, un cliente activo y un entrenador
   existente, **Cuando** realiza la asignación, **Entonces** el sistema registra la relación entre el
   cliente y el entrenador.
2. **Dado** un cliente inexistente o inactivo o un entrenador inexistente, **Cuando** se intenta
   asignar, **Entonces** el sistema rechaza la operación sin persistir.
3. **Dado** un cliente que ya tiene un entrenador principal activo, **Cuando** se asigna otro
   entrenador principal, **Entonces** el sistema aplica la regla de un único entrenador principal
   activo por cliente.
4. **Dado** un entrenador o un cliente autenticado, **Cuando** intenta asignar un entrenador,
   **Entonces** el sistema deniega la operación.

---

### Historia de usuario 3 - Creación de rutinas de entrenamiento (Prioridad: P1) — US-S3-03

Como entrenador, quiero crear rutinas personalizadas para los clientes asignados para orientar su
plan de entrenamiento.

**Por qué esta prioridad**: la rutina es el entregable central del acompañamiento físico y es
requisito para el seguimiento de objetivos y progresos.

**Prueba independiente**: un entrenador autenticado crea una rutina con ejercicios para un cliente
asignado a su carga y el sistema la almacena.

**Escenarios de aceptación**:

1. **Dado** un entrenador autenticado y un cliente asignado a su carga, **Cuando** crea una rutina con
   ejercicios, series, repeticiones o instrucciones, **Entonces** el sistema almacena la rutina
   asociada al cliente y al entrenador.
2. **Dado** un entrenador autenticado y un cliente que no está a su cargo, **Cuando** intenta crear o
   modificar una rutina, **Entonces** el sistema deniega la operación.
3. **Dado** un administrador autenticado, **Cuando** intenta crear una rutina, **Entonces** el sistema
   deniega la operación conforme a los permisos de su rol.
4. **Dado** un cliente sin rutina previa, **Cuando** el entrenador crea la rutina, **Entonces** el
   sistema la pone a disposición del cliente para su consulta.

---

### Historia de usuario 4 - Registro de objetivos y progresos (Prioridad: P2) — US-S3-04

Como entrenador, quiero registrar objetivos y avances del cliente para seguir su evolución de forma
ordenada y medible.

**Por qué esta prioridad**: complementa la rutina con seguimiento medible; aporta valor sobre datos
ya creados.

**Prueba independiente**: un entrenador autenticado registra un objetivo y un progreso para un
cliente a su cargo y el sistema los conserva en el historial.

**Escenarios de aceptación**:

1. **Dado** un entrenador autenticado y un cliente a su cargo, **Cuando** registra un objetivo de
   entrenamiento, **Entonces** el sistema lo almacena asociado al cliente y al entrenador.
2. **Dado** un objetivo registrado, **Cuando** el entrenador registra un nuevo progreso, **Entonces**
   el sistema conserva el registro anterior y agrega el nuevo al historial.
3. **Dado** un entrenador autenticado y un cliente que no está a su cargo, **Cuando** intenta
   registrar objetivos o progresos, **Entonces** el sistema deniega la operación.
4. **Dado** un recepcionista o un administrador autenticado, **Cuando** intenta registrar o editar
   progresos, **Entonces** el sistema deniega la operación conforme a los permisos de su rol.

---

### Historia de usuario 5 - Consulta de rutina y progreso (Prioridad: P2) — US-S3-05

Como cliente, quiero consultar mi rutina y mi progreso para conocer mi evolución y mantenerme
motivado.

**Por qué esta prioridad**: cierra el ciclo de valor del entrenamiento desde la perspectiva del
cliente; es de lectura sobre datos ya registrados.

**Prueba independiente**: un cliente autenticado consulta su rutina y su historial de progreso y el
sistema muestra únicamente su información.

**Escenarios de aceptación**:

1. **Dado** un cliente autenticado con rutina asignada, **Cuando** consulta su rutina, **Entonces** el
   sistema muestra los ejercicios, series, repeticiones o instrucciones correspondientes.
2. **Dado** un cliente autenticado con objetivos y progresos registrados, **Cuando** consulta su
   evolución, **Entonces** el sistema muestra el historial de progreso en orden.
3. **Dado** un cliente autenticado, **Cuando** intenta consultar la rutina o el progreso de otro
   cliente, **Entonces** el sistema deniega la operación.

---

### Historia de usuario 6 - Dashboard administrativo (Prioridad: P2) — US-S3-06

Como administrador, quiero ver un resumen de clientes activos, entrenadores asignados, progreso
general y rendimiento del gimnasio para tomar decisiones operativas.

**Por qué esta prioridad**: es la vista de supervisión del sprint; reutiliza datos generados por las
historias anteriores.

**Prueba independiente**: el administrador autenticado accede al dashboard y visualiza los
indicadores clave del gimnasio.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado, **Cuando** accede al dashboard, **Entonces** el sistema
   muestra un resumen con clientes activos, entrenadores, membresías y progreso general.
2. **Dado** un recepcionista o entrenador autenticado, **Cuando** accede a los indicadores
   administrativos, **Entonces** el sistema aplica los permisos de su rol y no expone información
   reservada al administrador.
3. **Dado** un administrador autenticado, **Cuando** consulta el dashboard, **Entonces** el sistema no
   expone datos sensibles de clientes fuera del resumen agregado.

---

### Historia de usuario 7 - Consulta del personal asignado (Prioridad: P3) — US-S3-07

Como administrador o recepcionista, quiero consultar los clientes asignados a cada entrenador para
organizar la carga de trabajo del equipo.

**Por qué esta prioridad**: es una vista de organización operativa; aporta valor una vez que existen
asignaciones.

**Prueba independiente**: un recepcionista autenticado consulta la lista de clientes asignados a un
entrenador y el sistema la muestra.

**Escenarios de aceptación**:

1. **Dado** un administrador o recepcionista autenticado, **Cuando** consulta los clientes asignados a
   un entrenador, **Entonces** el sistema muestra la lista de clientes a su cargo.
2. **Dado** un entrenador autenticado, **Cuando** consulta su propia carga de clientes, **Entonces**
   el sistema muestra únicamente los clientes asignados a él.
3. **Dado** un cliente autenticado, **Cuando** intenta consultar el personal asignado, **Entonces** el
   sistema deniega la operación.

---

### Casos límite

- ¿Qué sucede cuando se intenta registrar un entrenador sin un usuario válido asociado? El sistema
  debe rechazar la operación y no persistir nada.
- ¿Qué sucede cuando se asigna un entrenador a un cliente inexistente o inactivo? Debe rechazarse con
  un mensaje claro sin persistir nada.
- ¿Qué sucede cuando un cliente ya tiene un entrenador principal activo? Debe aplicarse la regla de un
  único entrenador principal activo por cliente.
- ¿Qué sucede cuando un entrenador intenta gestionar un cliente que no está a su cargo? El backend
  debe denegar la operación aunque el frontend oculte la opción.
- ¿Qué sucede cuando se registra un progreso nuevo sobre un objetivo existente? Debe conservarse el
  historial anterior y agregarse el nuevo registro.
- ¿Qué sucede cuando un cliente intenta consultar la rutina o el progreso de otro cliente? El sistema
  debe denegar el acceso y no exponer datos ajenos.
- ¿Qué sucede cuando el dashboard se consulta con datos insuficientes (sin clientes o sin
  entrenadores)? Debe mostrar valores en cero de forma clara, sin errores.
- ¿Qué sucede cuando el servicio de base de datos no está disponible? El backend debe responder con un
  error controlado, sin stack traces ni credenciales.
- ¿Qué sucede cuando un usuario sin permiso intenta crear rutinas u objetivos? El backend debe denegar
  la operación.

## Requisitos *(obligatorio)*

### Requisitos funcionales

**Entrenadores**

- **FR-001**: El administrador DEBE poder registrar entrenadores asociados a un usuario del sistema
  con rol entrenador.
- **FR-002**: El administrador DEBE poder consultar, modificar y activar/desactivar entrenadores.
- **FR-003**: Un entrenador DEBE estar asociado a un usuario válido del sistema y NO DEBE duplicar la
  asociación de un mismo usuario.
- **FR-004**: El sistema DEBE impedir el registro de entrenadores con usuarios inexistentes o con
  roles no permitidos.

**Asignación de entrenador**

- **FR-005**: El administrador y el recepcionista DEBEN poder asignar un entrenador a un cliente
  activo.
- **FR-006**: Un cliente DEBE tener como máximo un entrenador principal activo en el periodo de
  seguimiento.
- **FR-007**: El sistema DEBE rechazar asignaciones a clientes inexistentes o inactivos, o a
  entrenadores inexistentes.
- **FR-008**: El administrador y el recepcionista DEBEN poder consultar los clientes asignados a cada
  entrenador conforme a los permisos de su rol.

**Rutinas de entrenamiento**

- **FR-009**: El entrenador DEBE poder crear rutinas personalizadas para los clientes asignados a su
  carga.
- **FR-010**: Una rutina DEBE estar asociada a un cliente y a un entrenador válidos.
- **FR-011**: Una rutina DEBE incluir ejercicios con series, repeticiones o instrucciones.
- **FR-012**: El entrenador NO DEBE poder crear ni modificar rutinas de clientes que no estén a su
  cargo; el administrador y el recepcionista NO DEBEN crear ni editar rutinas.

**Objetivos y progresos**

- **FR-013**: El entrenador DEBE poder registrar objetivos de entrenamiento para los clientes a su
  cargo.
- **FR-014**: El entrenador DEBE poder registrar progresos medibles asociados a los objetivos de los
  clientes a su cargo.
- **FR-015**: El sistema DEBE conservar el historial de objetivos y progresos para comparar la
  evolución en el tiempo.
- **FR-016**: El recepcionista y el administrador NO DEBEN registrar ni editar objetivos ni progresos.

**Consulta del cliente**

- **FR-017**: El cliente DEBE poder consultar únicamente su propia rutina y su propio progreso.
- **FR-018**: El sistema NO DEBE exponer la rutina ni el progreso de un cliente a otros clientes ni a
  usuarios no autorizados.

**Dashboard administrativo**

- **FR-019**: El administrador DEBE poder consultar un dashboard con indicadores resumidos del
  gimnasio (clientes activos, entrenadores, membresías y progreso general).
- **FR-020**: El dashboard DEBE filtrar los indicadores según los permisos del usuario autenticado.
- **FR-021**: El dashboard NO DEBE exponer datos sensibles de clientes fuera del resumen autorizado.

**Seguridad y permisos**

- **FR-022**: El backend DEBE validar los permisos de cada rol antes de ejecutar cualquier operación
  de este sprint.
- **FR-023**: El backend DEBE validar los datos de entrada (campos obligatorios, formatos, rangos y
  relaciones) antes de persistirlos.
- **FR-024**: El sistema DEBE responder en JSON con códigos HTTP apropiados y mensajes de error claros
  que no revelen información técnica interna.

**Base de datos, auditoría y arquitectura**

- **FR-025**: El sistema DEBE implementar funcionalmente las tablas `entrenadores`, `rutinas`,
  `ejercicios_rutina`, `objetivos_entrenamiento`, `progresos_clientes` y `asignaciones_entrenador`,
  reutilizando `usuarios` y `clientes` de los sprints anteriores.
- **FR-026**: Las tablas DEBEN utilizar MySQL local con motor InnoDB y codificación `utf8mb4`, con
  llaves primarias, llaves foráneas e integridad referencial.
- **FR-027**: Los cambios de estructura DEBEN agregarse como scripts SQL numerados en
  `database/migrations/`, y la base de datos DEBE poder reconstruirse íntegramente a partir de ellos.
- **FR-028**: El backend DEBE mantener ES Modules (`"type": "module"`, `import`/`export`, sin
  `require()` ni `module.exports`) y la separación por capas (`routes/`, `controllers/`, `services/`,
  `models/`, `middlewares/`, `validators/`, `utils/`).
- **FR-029**: El frontend DEBE usar React con JavaScript y NO DEBE tener acceso directo a MySQL; toda
  comunicación pasa por la API REST del backend.
- **FR-030**: La auditoría DEBE registrar las acciones relevantes del sprint (registro y modificación
  de entrenadores, asignación de entrenador a cliente, creación de rutinas y registro de progresos);
  su consulta será exclusiva del administrador.
- **FR-031**: El sistema DEBE conservar el historial de asignaciones, rutinas, objetivos y progresos
  para poder evaluar la evolución y el cumplimiento.

### Entidades clave

- **entrenadores**: personal responsable del acompañamiento físico. Atributos clave: usuario asociado,
  datos de contacto, especialidad y estado. Se relaciona con un usuario del sistema y con muchos
  clientes asignados.
- **asignaciones_entrenador**: relación entre un cliente y su entrenador. Atributos clave: cliente,
  entrenador, fecha de asignación, indicador de entrenador principal y estado. Histórica.
- **rutinas**: plan de entrenamiento de un cliente. Atributos clave: cliente, entrenador, nombre,
  descripción, fecha y estado. Se relaciona con muchos ejercicios.
- **ejercicios_rutina**: detalle de cada ejercicio de una rutina. Atributos clave: rutina, nombre del
  ejercicio, series, repeticiones e instrucciones.
- **objetivos_entrenamiento**: meta del cliente. Atributos clave: cliente, entrenador, descripción,
  valor objetivo, fecha objetivo y estado. Se relaciona con muchos progresos.
- **progresos_clientes**: avance medible del cliente. Atributos clave: cliente, objetivo, valor
  registrado, fecha y observaciones. Se conserva como historial.
- **usuarios** y **clientes**: entidades de sprints anteriores reutilizadas; los entrenadores se
  asocian a un usuario y las rutinas, objetivos y progresos se relacionan con el cliente.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **SC-001**: Un usuario autorizado completa el flujo de demostración del sprint (registrar
  entrenador, asignar entrenador a un cliente, crear una rutina, registrar un objetivo y un progreso,
  consultar la rutina como cliente y abrir el dashboard) en menos de 5 minutos.
- **SC-002**: El 100 % de las rutas protegidas rechazan solicitudes sin token válido o con un rol sin
  permiso (0 operaciones no autorizadas en la prueba de roles).
- **SC-003**: El 100 % de los entrenadores registrados quedan asociados a un usuario válido con rol
  entrenador.
- **SC-004**: El 100 % de los clientes activos tiene como máximo un entrenador principal activo en
  cualquier momento.
- **SC-005**: El 100 % de las consultas de un cliente devuelven únicamente información propia (0
  accesos a datos ajenos en la prueba de roles).
- **SC-006**: El dashboard responde correctamente y aplica los permisos por rol en la demostración de
  extremo a extremo.
- **SC-007**: La base de datos se reconstruye desde cero ejecutando únicamente los scripts SQL
  versionados de `database/`.
- **SC-008**: Ningún secreto (credenciales de MySQL, claves JWT) está presente en el repositorio;
  `.env` no se versiona y `.env.example` existe.
- **SC-009**: El frontend no realiza ninguna conexión directa a MySQL y no contiene credenciales de
  base de datos; el backend no expone `require()` ni `module.exports`.
- **SC-010**: Las 7 historias de usuario pasan de extremo a extremo (frontend → API REST → MySQL) en el
  entorno local.

## Supuestos

- Los Sprints 1 y 2 están implementados: existen autenticación JWT, roles, clientes y el módulo de
  membresías y accesos sobre los que se apoya este sprint.
- MySQL está instalado y se ejecuta localmente durante el desarrollo y la demostración.
- Un entrenador se asocia a un usuario existente con rol entrenador creado por el administrador; la
  gestión de usuarios y roles proviene del Sprint 1.
- Un cliente tiene como máximo un entrenador principal activo; el historial de asignaciones se
  conserva al cambiar de entrenador.
- El progreso y los objetivos son datos de seguimiento deportivo; no constituyen información médica
  oficial.
- El dashboard reutiliza datos agregados de clientes, membresías y progresos; no requiere
  almacenamiento adicional complejo más allá de consultas consolidadas.
- Los mensajes e interfaz se redactan en español.
- La verificación de permisos ocurre en el backend aunque el frontend oculte opciones según el rol.

## Fuera del alcance del Sprint 3

- Reportes avanzados y exportación de información.
- Clases grupales, horarios y asistencia compleja.
- Seguimiento médico o nutricional y datos clínicos.
- Aplicación móvil, múltiples sucursales, nómina, inventario, contabilidad completa y facturación
  electrónica.
- Revisión de membresías, pagos, reconocimiento facial y control de acceso (Sprints 1 y 2), salvo su
  relación con la asignación de clientes y el dashboard.
- Cualquier función que no forme parte del MVP definido en `docs/project-context.md`.

## Preguntas abiertas para `/speckit.clarify`

Decisiones que el equipo debe aprobar y que se resolverán con `/speckit.clarify` o durante el plan:

- Alcance exacto de los indicadores del dashboard administrativo.
- Regla precisa de "entrenador principal" y manejo de reasignaciones (historial versus reemplazo).
- Nivel de detalle de los ejercicios de rutina (series, repeticiones, peso, descanso, notas).
- Unidades y validación de rangos de los progresos (peso, medidas, repeticiones, tiempo).
- Si el recepcionista puede modificar asignaciones existentes o solo crearlas y consultarlas.
- Reglas específicas de auditoría que serán funcionales en este sprint.

## Trazabilidad

| Historia de usuario | US origen | Requisitos principales    | Sprint   |
| ------------------- | --------- | ------------------------- | -------- |
| HU1                 | US-S3-01  | FR-001 a FR-004           | Sprint 3 |
| HU2                 | US-S3-02  | FR-005 a FR-008           | Sprint 3 |
| HU3                 | US-S3-03  | FR-009 a FR-012, FR-031   | Sprint 3 |
| HU4                 | US-S3-04  | FR-013 a FR-016, FR-031   | Sprint 3 |
| HU5                 | US-S3-05  | FR-017, FR-018            | Sprint 3 |
| HU6                 | US-S3-06  | FR-019 a FR-021           | Sprint 3 |
| HU7                 | US-S3-07  | FR-008, FR-005 a FR-007   | Sprint 3 |

Los requisitos FR-022 a FR-031 cubren seguridad, permisos, base de datos, auditoría y arquitectura, y
se verifican mediante los criterios de éxito SC-002, SC-007, SC-008, SC-009 y SC-010.
