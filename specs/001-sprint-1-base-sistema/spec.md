# Especificación de la Funcionalidad: Sprint 1 - Base del sistema, autenticación, usuarios, roles y clientes

**Rama de la funcionalidad**: `001-sprint-1-base-sistema`

**Creada**: 2026-10-08

**Estado**: Borrador

**Entrada**: Descripción del usuario: "Genera la especificación únicamente para Sprint 1. Usa
docs/project-context.md, docs/reglas.md y docs/sprint-1.md como fuentes de verdad. Sprint 1 debe
cubrir la base del sistema, autenticación, usuarios, roles y clientes. No implementes todavía
membresías funcionales, pagos funcionales ni reconocimiento facial. El reconocimiento facial
pertenece a Sprint 2. Respeta la estructura frontend/, backend/, database/ y ES Modules en backend
y scripts JavaScript de database."

**Fuentes de verdad**: `docs/project-context.md`, `docs/reglas.md`, `docs/sprint-1.md`.

## Clarificaciones

### Session 2026-10-09

- Q: ¿Debe el correo de un cliente ser único en todo el sistema? → A: Sí, el correo de un cliente
  es obligatorio y único en todo el sistema.
- Q: ¿Cuánto tiempo debe durar la sesión válida del token JWT antes de expirar? → A: 60 minutos,
  configurable mediante variable de entorno; al expirar se debe volver a iniciar sesión (sin
  renovación automática en el Sprint 1).
- Q: ¿Qué valores debe admitir el campo `estado` de los usuarios y los clientes? → A: Únicamente
  `activo` e `inactivo` para ambas entidades.
- Q: ¿Qué campos concretos puede ver un entrenador cuando consulta la información de un cliente?
  → A: Únicamente nombre, apellido y estado; el resto de los campos (correo, teléfono, dirección,
  fecha de registro) deben quedar ocultos para su rol.
- Q: ¿Qué regla de validación debe cumplir la contraseña al crear o restablecer un usuario? → A:
  Mínimo 8 caracteres, sin exigir otros caracteres.

## Escenarios de usuario y pruebas *(obligatorio)*

### Historia de usuario 1 - Inicio de sesión y acceso por rol (Prioridad: P1) — US-S1-01

Como usuario registrado, quiero iniciar sesión con mi correo y contraseña para acceder a las
funciones permitidas según mi rol.

**Por qué esta prioridad**: sin autenticación no existe ninguna base sobre la que construir el
resto del sistema; todas las historias restantes dependen de un usuario autenticado y de un rol
identificado.

**Prueba independiente**: con el usuario administrador inicial (seed), iniciar sesión con credenciales
válidas y comprobar que el sistema devuelve un token y muestra únicamente las funciones del rol
administrador.

**Escenarios de aceptación**:

1. **Dado** un usuario registrado con credenciales válidas, **Cuando** envía su correo y contraseña,
   **Entonces** el sistema lo autentica, devuelve un token JWT e identifica su rol.
2. **Dado** un usuario registrado con contraseña incorrecta, **Cuando** envía sus credenciales,
   **Entonces** el sistema rechaza el acceso con un mensaje de error genérico que no revele si el
   correo existe.
3. **Dado** un usuario sin token o con token expirado, **Cuando** solicita una ruta protegida,
   **Entonces** el sistema deniega el acceso.
4. **Dado** un usuario autenticado, **Cuando** intenta usar una función que no corresponde a su rol,
   **Entonces** el sistema deniega la operación desde el backend.

---

### Historia de usuario 2 - Registro de clientes (Prioridad: P1) — US-S1-04

Como administrador o recepcionista, quiero registrar nuevos clientes para almacenar su información
en el sistema.

**Por qué esta prioridad**: el cliente es la entidad central del sistema; sin ella no se puede
evolucionar hacia membresías, pagos ni reconocimiento facial en el Sprint 2.

**Prueba independiente**: un recepcionista autenticado registra un cliente con datos válidos y el
cliente queda almacenado en MySQL y visible en la consulta.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado, **Cuando** registra un cliente con datos válidos,
   **Entonces** el sistema almacena el cliente y lo muestra en la consulta.
2. **Dado** un recepcionista autenticado, **Cuando** registra un cliente con datos válidos,
   **Entonces** el sistema almacena el cliente.
3. **Dado** un formulario con datos obligatorios vacíos o con formato inválido, **Cuando** se envía
   el registro, **Entonces** el sistema rechaza la solicitud, explica el error y no almacena nada.
4. **Dado** un entrenador o un cliente autenticado, **Cuando** intenta registrar un cliente,
   **Entonces** el sistema deniega la operación.

---

### Historia de usuario 3 - Registro de usuarios (Prioridad: P2) — US-S1-02

Como administrador, quiero registrar nuevos usuarios del sistema para permitir que el personal
autorizado pueda utilizar la plataforma.

**Por qué esta prioridad**: es necesaria para dar acceso al personal, pero durante el Sprint 1
puede probarse con el usuario administrador inicial creado por la semilla de base de datos.

**Prueba independiente**: el administrador registra un usuario nuevo con un rol válido y ese
usuario puede iniciar sesión con sus credenciales.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado, **Cuando** registra un usuario con correo, nombre,
   contraseña de al menos 8 caracteres y rol válidos, **Entonces** el sistema crea el usuario con
   la contraseña almacenada mediante hash de `bcrypt`.
2. **Dado** un correo que ya existe en la tabla de usuarios, **Cuando** el administrador intenta
   registrarlo de nuevo, **Entonces** el sistema rechaza la operación sin duplicar el registro.
3. **Dado** un usuario sin rol de administrador, **Cuando** intenta registrar un usuario,
   **Entonces** el sistema deniega la operación.
4. **Dado** un usuario registrado, **Cuando** el administrador restablece su contraseña,
   **Entonces** la contraseña anterior deja de ser válida y la nueva se almacena con hash.

---

### Historia de usuario 4 - Asignación de roles (Prioridad: P2) — US-S1-03

Como administrador, quiero asignar un rol a cada usuario para controlar las funciones que puede
utilizar dentro del sistema.

**Por qué esta prioridad**: los roles son el mecanismo de autorización del sistema; se requiere
haber podido registrar usuarios y es previo a probar los permisos del resto de historias.

**Prueba independiente**: el administrador cambia el rol de un usuario de "entrenador" a
"recepcionista" y las funciones disponibles del usuario cambian en consecuencia.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado, **Cuando** asigna un rol válido a un usuario,
   **Entonces** el sistema actualiza el rol y el usuario pasa a tener las funciones de ese rol.
2. **Dado** un valor de rol que no corresponda a los roles definidos, **Cuando** se intenta
   asignar, **Entonces** el sistema rechaza la operación.
3. **Dado** un usuario sin rol de administrador, **Cuando** intenta asignar roles,
   **Entonces** el sistema deniega la operación.
4. **Dado** un usuario desactivado, **Cuando** intenta iniciar sesión, **Entonces** el sistema
   rechaza el acceso independientemente de su rol.

---

### Historia de usuario 5 - Modificación de clientes (Prioridad: P2) — US-S1-05

Como administrador o recepcionista, quiero modificar la información de un cliente para mantener
sus datos actualizados.

**Por qué esta prioridad**: mantiene la calidad de los datos ya registrados; depende del registro
de clientes pero no bloquea las historias de consulta.

**Prueba independiente**: un recepcionista modifica el teléfono de un cliente y la consulta
muestra el valor actualizado.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado y un cliente existente, **Cuando** modifica datos
   válidos del cliente, **Entonces** el sistema actualiza el registro.
2. **Dado** un recepcionista autenticado y un cliente existente, **Cuando** modifica datos
   válidos del cliente, **Entonces** el sistema actualiza el registro.
3. **Dado** un entrenador o un cliente autenticado, **Cuando** intenta modificar un cliente,
   **Entonces** el sistema deniega la operación.
4. **Dado** un identificador de cliente inexistente, **Cuando** se intenta modificar,
   **Entonces** el sistema responde con un error claro sin revelar detalles internos.

---

### Historia de usuario 6 - Consulta de clientes (Prioridad: P3) — US-S1-06

Como administrador, recepcionista o entrenador, quiero consultar la información básica de los
clientes para realizar mis actividades.

**Por qué esta prioridad**: es lectura sobre datos ya existentes; el sistema genera valor con el
registro y la modificación, y la consulta puede evaluarse al final.

**Prueba independiente**: un entrenador autenticado consulta la lista de clientes y ve únicamente
la información permitida para su rol.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado, **Cuando** consulta los clientes, **Entonces** ve la
   lista completa de clientes registrados.
2. **Dado** un recepcionista autenticado, **Cuando** consulta los clientes, **Entonces** ve la
   información de los clientes.
3. **Dado** un entrenador autenticado, **Cuando** consulta los clientes, **Entonces** ve
   únicamente nombre, apellido y estado de cada cliente, sin recibir correo, teléfono, dirección
   ni fecha de registro.
4. **Dado** un cliente autenticado, **Cuando** intenta consultar el listado de otros clientes,
   **Entonces** el sistema deniega la consulta.

---

### Historia de usuario 7 - Consulta de información propia (Prioridad: P3) — US-S1-07

Como cliente, quiero consultar mi propia información para conocer los datos registrados en el
sistema.

**Por qué esta prioridad**: es la única función del rol cliente en este sprint; no bloquea el
trabajo del personal y se valida sobre datos ya registrados.

**Prueba independiente**: un usuario con rol cliente inicia sesión y ve sus propios datos, sin
acceder a los datos de ningún otro cliente.

**Escenarios de aceptación**:

1. **Dado** un usuario con rol cliente autenticado, **Cuando** consulta su información,
   **Entonces** ve únicamente sus propios datos registrados.
2. **Dado** un usuario con rol cliente autenticado, **Cuando** intenta consultar la información
   de otro cliente, **Entonces** el sistema deniega el acceso.
3. **Dado** un usuario con rol cliente sin token, **Cuando** solicita su información,
   **Entonces** el sistema deniega el acceso.

---

### Casos límite

- ¿Qué sucede cuando un usuario con la cuenta desactivada intenta iniciar sesión? Debe rechazarse
  el acceso con mensaje genérico.
- ¿Qué sucede cuando el token expiró o fue manipulado? La ruta protegida debe responder sin
  autorizar el acceso.
- ¿Qué sucede cuando dos administradores registran al mismo tiempo un usuario con el mismo correo?
  Solo debe persistirse uno; el otro recibe un error de duplicado.
- ¿Qué sucede cuando se registra un cliente con un correo que ya existe en la tabla de clientes?
  Solo debe persistirse uno; el otro recibe un error de duplicado y no se almacena nada.
- ¿Qué sucede cuando la base de datos MySQL no está disponible? El backend debe responder con un
  error controlado, sin mostrar stack traces ni credenciales.
- ¿Qué sucede cuando un campo obligatorio llega vacío o con formato inválido? El backend debe
  rechazar la solicitud sin persistir cambios.
- ¿Qué sucede cuando un cliente inexistente es consultado o modificado? Debe responderse con un
  error claro de "no encontrado".
- ¿Qué sucede cuando el frontend oculta una opción por rol? Eso no sustituye la validación; el
  backend debe rechazar igualmente la operación.
- ¿Qué sucede cuando un entrenador solicita la lista completa de clientes? La API debe responder
  con nombre, apellido y estado, descartando correo, teléfono, dirección y fecha de registro.
- ¿Qué sucede cuando la contraseña tiene menos de 8 caracteres? El backend debe rechazar la
  solicitud con un mensaje claro y no persistir el usuario ni el cambio de contraseña.
- ¿Qué sucede cuando se intenta eliminar físicamente un usuario o cliente? En este sprint no se
  permite; solo debe poder desactivarse.

## Requisitos *(obligatorio)*

### Requisitos funcionales

**Autenticación**

- **FR-001**: El sistema DEBE permitir iniciar sesión con correo y contraseña.
- **FR-002**: El sistema DEBE verificar las contraseñas mediante `bcrypt`; las contraseñas NUNCA
  deben almacenarse en texto plano.
- **FR-003**: El sistema DEBE emitir un token JWT tras una autenticación válida que identifique al
  usuario y a su rol. El token DEBE expirar a los 60 minutos, valor configurable mediante variable
  de entorno; expirado el token, el usuario DEBE volver a iniciar sesión (sin renovación automática
  en el Sprint 1).
- **FR-004**: El sistema DEBE proteger las rutas privadas mediante un middleware de autenticación
  que valide el token en el backend.
- **FR-005**: El sistema DEBE devolver un mensaje de error genérico cuando las credenciales sean
  incorrectas, sin revelar si el correo existe en el sistema.
- **FR-006**: El sistema DEBE identificar el rol del usuario y validar en el backend cada permiso
  antes de ejecutar una función.

**Usuarios y roles**

- **FR-007**: Únicamente el administrador DEBE poder registrar, consultar y modificar usuarios.
- **FR-008**: El sistema DEBE limitar los roles a los definidos en el contexto maestro:
  administrador, recepcionista, entrenador y cliente.
- **FR-009**: El administrador DEBE poder asignar o cambiar el rol de un usuario.
- **FR-010**: El administrador DEBE poder activar y desactivar usuarios; la desactivación DEBE
  impedir el inicio de sesión. El campo `estado` DEBE admitir únicamente los valores `activo` e
  `inactivo`, tanto en usuarios como en clientes.
- **FR-011**: El administrador DEBE poder restablecer la contraseña de un usuario, la cual DEBE
  quedar almacenada con hash de `bcrypt`. Al crear o restablecer una contraseña, el backend DEBE
  rechazar las contraseñas con menos de 8 caracteres; no se exigen reglas adicionales de
  complejidad.
- **FR-012**: El correo de un usuario DEBE ser único en el sistema.
- **FR-013**: La gestión de usuarios y roles DEBE ser exclusiva del administrador.

**Clientes**

- **FR-014**: El administrador y el recepcionista DEBEN poder registrar clientes.
- **FR-015**: El administrador y el recepcionista DEBEN poder modificar la información de un
  cliente.
- **FR-016**: El administrador, el recepcionista y el entrenador DEBEN poder consultar la
  información de los clientes conforme a los permisos de su rol. La respuesta para el entrenador
  DEBE limitarse a nombre, apellido y estado (`activo`/`inactivo`), sin exponer correo, teléfono,
  dirección ni fecha de registro.
- **FR-017**: El cliente DEBE poder consultar únicamente su propia información.
- **FR-018**: El backend DEBE validar los datos de entrada de los clientes antes de almacenarlos
  (campos obligatorios y formatos).
- **FR-019**: Los usuarios y clientes NUNCA deben eliminarse físicamente durante el Sprint 1;
  únicamente deben poder desactivarse.
- **FR-020**: El correo de un cliente DEBE ser obligatorio y único en todo el sistema; el
  rechazo de un correo duplicado DEBE devolver un error claro sin persistir el registro.

**Base de datos**

- **FR-021**: El sistema DEBE crear la estructura inicial de las tablas `usuarios`, `clientes`,
  `tipos_membresia`, `membresias` y `pagos` con sus llaves primarias y foráneas.
- **FR-022**: Las tablas DEBEN utilizar MySQL local con motor InnoDB y codificación `utf8mb4`.
- **FR-023**: La base de datos DEBE poder reconstruirse íntegramente a partir de scripts SQL
  versionados en `database/`.
- **FR-024**: Únicamente el backend DEBE acceder a MySQL y DEBE utilizar consultas parametrizadas
  para evitar inyecciones SQL.
- **FR-025**: La conexión a MySQL DEBE configurarse mediante las variables de entorno `DB_HOST`,
  `DB_PORT`, `DB_USER`, `DB_PASSWORD` y `DB_NAME`.
- **FR-026**: El archivo `.env` DEBE estar incluido en `.gitignore` y DEBE existir un
  `.env.example` sin información sensible.
- **FR-027**: Las tablas `tipos_membresia`, `membresias` y `pagos` DEBEN crearse únicamente como
  estructura; el Sprint 1 NO DEBE exponer operaciones funcionales sobre ellas.

**Arquitectura y convenciones**

- **FR-028**: El proyecto DEBE organizarse en las carpetas `frontend/`, `backend/` y `database/`,
  sin crear carpetas alternativas como `client/`, `server/` o `dataBase/`.
- **FR-029**: El backend DEBE utilizar ES Modules: `backend/package.json` DEBE incluir
  `"type": "module"` y todo el código DEBE usar `import`/`export`; NO debe usarse `require()` ni
  `module.exports`.
- **FR-030**: Los scripts JavaScript de `database/scripts/` DEBEN utilizar ES Modules.
- **FR-031**: La comunicación entre frontend y backend DEBE realizarse mediante una API REST con
  respuestas en JSON y códigos HTTP apropiados.
- **FR-032**: La lógica de negocio DEBE mantenerse separada de rutas y controladores, organizando
  el backend en `config/`, `routes/`, `controllers/`, `services/`, `models/`, `middlewares/`,
  `validators/` y `utils/`.
- **FR-033**: El frontend DEBE utilizar React con JavaScript y NO DEBE tener acceso directo a
  MySQL.
- **FR-034**: El sistema DEBE mostrar mensajes de error claros al usuario sin revelar información
  técnica interna del servidor.

**Reconocimiento facial (preparación sin implementación)**

- **FR-035**: El Sprint 1 NO DEBE instalar librerías de reconocimiento facial, capturar rostros,
  generar descriptores ni validar accesos mediante rostro.
- **FR-036**: La estructura DEBE permitir que en el Sprint 2 la información facial se relacione
  con un cliente existente.

### Entidades clave

- **usuarios**: cuentas de acceso al sistema. Atributos clave: nombre, correo único, contraseña
  (hash de `bcrypt`), rol (administrador, recepcionista, entrenador o cliente) y estado
  (activo/inactivo).
- **clientes**: información de los clientes del gimnasio. Atributos clave: nombre, apellido,
  correo (obligatorio y único en el sistema), teléfono, dirección, fecha de registro y estado
  (`activo`/`inactivo`). Se relacionará en el Sprint 2 con membresías, pagos e información facial.
- **tipos_membresia**, **membresias**, **pagos**: tablas con estructura inicial creada en este
  sprint para conservar la integridad del modelo relacional; sin operaciones funcionales hasta el
  Sprint 2.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **SC-001**: Un usuario autenticado completa el flujo de demostración (iniciar sesión, registrar
  un cliente, modificarlo y consultarlo) en menos de 5 minutos.
- **SC-002**: El 100 % de las rutas protegidas rechazan las solicitudes sin token válido o con un
  rol sin permiso (0 accesos no autorizados en la prueba de roles).
- **SC-003**: El 100 % de las contraseñas almacenadas en MySQL están protegidas con hash de
  `bcrypt` (0 contraseñas en texto plano).
- **SC-004**: La base de datos se reconstruye desde cero ejecutando únicamente los scripts SQL
  versionados de `database/`.
- **SC-005**: Ningún secreto (credenciales de MySQL, claves JWT) está presente en el repositorio;
  `.env` no se versiona y `.env.example` existe.
- **SC-006**: Las 7 historias de usuario pasan de extremo a extremo (frontend → API REST → MySQL)
  en el entorno local.
- **SC-007**: El frontend no realiza ninguna conexión directa a MySQL y no contiene credenciales
  de base de datos.
- **SC-008**: El backend no expone `require()` ni `module.exports` y `backend/package.json`
  declara `"type": "module"`.

## Supuestos

- Existe un usuario administrador inicial creado mediante una semilla de base de datos, sin el
  cual no sería posible gestionar usuarios y clientes.
- MySQL está instalado y se ejecuta localmente durante el desarrollo y la demostración.
- Los roles son fijos y se definen en `docs/project-context.md`; no existe gestión de permisos
  personalizados en este sprint.
- Un usuario desactivado conserva su registro pero no puede iniciar sesión.
- La expiración del token JWT se configura mediante variable de entorno, con un valor por defecto
  de 60 minutos para el Sprint 1.
- La interfaz y los mensajes se redactan en español.
- La verificación de permisos ocurre en el backend aunque el frontend oculte opciones del menú
  según el rol.
- No existe renovación automática del token en el Sprint 1: al expirar la sesión, el usuario debe
  volver a iniciar sesión.

## Fuera del alcance del Sprint 1

- Gestión funcional de membresías, renovación y control de vencimientos.
- Registro funcional de pagos y consulta de adeudos.
- Reconocimiento facial: instalación de librerías, captura de rostros, comparación, descriptores
  faciales y validación de acceso mediante rostro (Sprint 2).
- Registro funcional de accesos, dashboard, reportes y auditoría.
- Recuperación de contraseña mediante correo electrónico y auto-registro de usuarios.
- Aplicación móvil, múltiples sucursales, nómina, inventario, contabilidad, facturación
  electrónica y procesamiento de pagos con bancos o plataformas externas.

## Preguntas abiertas

- Driver de MySQL (driver directo, query builder u ORM): decisión de planificación, no de alcance.

## Trazabilidad

| Historia de usuario | US origen  | Requisitos principales           | Sprint |
| ------------------- | ---------- | -------------------------------- | ------ |
| HU1                 | US-S1-01   | FR-001 a FR-006                  | Sprint 1 |
| HU2                 | US-S1-04   | FR-014, FR-018, FR-019, FR-020   | Sprint 1 |
| HU3                 | US-S1-02   | FR-007, FR-011, FR-012, FR-013   | Sprint 1 |
| HU4                 | US-S1-03   | FR-008, FR-009, FR-010, FR-013   | Sprint 1 |
| HU5                 | US-S1-05   | FR-015, FR-018, FR-019           | Sprint 1 |
| HU6                 | US-S1-06   | FR-016, FR-017                   | Sprint 1 |
| HU7                 | US-S1-07   | FR-017                           | Sprint 1 |

Los requisitos FR-021 a FR-036 cubren la base de datos, la arquitectura y la preparación para el
Sprint 2, y se verifican mediante los criterios de éxito SC-004, SC-007 y SC-008.
