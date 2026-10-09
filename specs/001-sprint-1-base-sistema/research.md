# Investigación: Sprint 1 - Base del sistema, autenticación, usuarios, roles y clientes

**Rama**: `001-sprint-1-base-sistema` | **Fecha**: 2026-10-09 | **Plan**: [plan.md](./plan.md)

Documento de la Fase 0 de `/speckit.plan`. Resuelve todas las decisiones técnicas pendientes que
dejó la especificación y las "Decisiones Pendientes" de la constitución aplicables a este sprint.
Cada entrada sigue el formato: **Decisión**, **Justificación**, **Alternativas consideradas**.

---

## R1. Acceso a MySQL: driver directo, query builder u ORM

- **Decisión**: driver directo `mysql2/promise` con consultas parametrizadas, agrupando el acceso
  en módulos de `backend/src/models/` (una función por operación) y transacciones explícitas
  cuando hagan falta.
- **Justificación**: el alcance del Sprint 1 son 5 tablas y operaciones CRUD sencillas; la
  constitución exige consultas parametrizadas y prohibe dependencias innecesarias. Un driver
  directo mantiene el SQL visible y auditable, evita una capa de abstracción más que aprender y
  mantiene el código listo para las consultas específicas del Sprint 2 (estado de membresías,
  historiales).
- **Alternativas consideradas**:
  - *Sequelize / Prisma / TypeORM*: rechazados por peso, curva de aprendizaje y por generar
    comportamiento "mágico" difícil de justificar en un proyecto académico con pocas tablas.
  - *Knex (query builder)*: rechazado porque añade una capa sin necesidad; se puede reevaluar en
    el Sprint 2 si las consultas crecen notablemente.
  - *mysql (paquete antiguo)*: rechazado por estar en mantenimiento y no ofrecer promesas
    nativas.

## R2. Estrategia de pruebas

- **Decisión**: `vitest` como ejecutor único (ES Modules nativos), `supertest` para pruebas de
  integración de la API REST del backend, React Testing Library para componentes del frontend y
  escenarios E2E manuales guiados por `quickstart.md` sobre el entorno local.
- **Justificación**: la constitución exige probar autenticación, validación de roles, registro y
  modificación de clientes; `vitest` no pelea con `"type": "module"` (a diferencia de Jest),
  comparte configuración entre backend y frontend y arranca rápido. Las pruebas de integración
  sobre la API cubren de forma fiable la matriz de permisos por rol (SC-002).
- **Alternativas consideradas**:
  - *Jest*: rechazado por la fricción histórica con ES Modules en Node.js.
  - *Cypress / Playwright (E2E automatizado)*: rechazado para este sprint por costo de
    configuración; se puede añadir en el Sprint 2 si se necesita regresión automática completa.
  - *Solo pruebas manuales*: rechazado porque la constitución exige pruebas antes de considerar
    terminada cada funcionalidad.

## R3. Librería de componentes para React

- **Decisión**: ninguna librería de componentes en el Sprint 1; CSS propio organizado en
  `frontend/src/styles/` con variables (paleta, espaciados, tipografía) y componentes hechos a
  medida.
- **Justificación**: la constitución prohíbe dependencias innecesarias y exige justificar toda
  librería nueva. El Sprint 1 tiene pocas pantallas (login, usuarios, clientes, perfil propio) y
  una interfaz sencilla; un sistema de estilos propio cubre el principio XI (consistencia
  visual) sin peso adicional.
- **Alternativas consideradas**:
  - *Material UI*: rechazado por tamaño y por imponer su propia capa de theming.
  - *Tailwind CSS*: rechazado por la curva de configuración adicional sin necesidad actual.
  - *Bootstrap*: rechazado por acoplamiento de estilos globales difíciles de mantener.

## R4. Manejo de estado en React

- **Decisión**: `Context` + hooks (`useState`, `useReducer`, `useEffect`) para el estado global
  (sesión: token, usuario y rol) y estado local de componente para el resto; un cliente HTTP
  centralizado en `frontend/src/services/` que adjunta el token y maneja la expiración (401).
- **Justificación**: el único estado transversal del Sprint 1 es la sesión autenticada; el resto
  son listas y formularios locales. Context evita dependencias y es suficiente para 7 historias.
- **Alternativas consideradas**:
  - *Redux / Redux Toolkit*: rechazado por sobreingeniería para un único estado global.
  - *React Query / TanStack Query*: rechazado para este sprint; puede evaluarse en el Sprint 2 si
    el caché de listados se vuelve complejo.
  - *Estado en `localStorage` sin contexto*: rechazado porque obliga a prop drilling y a
    revalidar el rol en cada componente.

## R5. Estrategia de validación de formularios

- **Decisión**: validación en dos capas con el backend como única autoridad: funciones puras
  reutilizables en `backend/src/validators/` invocadas por un middleware antes del controlador, y
  una validación espejo en el frontend (`frontend/src/`) para dar retroalimentación inmediata que
  nunca sustituye la validación del servidor.
- **Justificación**: FR-018 y FR-032 exigen `validators/` y validación de entradas en el backend;
  las reglas son simples (correo, campos obligatorios, longitud de contraseña ≥ 8), por lo que no
  se justifica una dependencia adicional. Coincide con el principio "ocultar opciones en la
  interfaz no es seguridad".
- **Alternativas consideradas**:
  - *express-validator*: rechazado por añadir una dependencia pudiendo cubrirse con funciones
    propias; se reevaluará si aparecen reglas complejas.
  - *Zod / Joi*: rechazados por lo mismo (dependencia nueva para reglas simples).
  - *Validación solo en frontend*: rechazado explícitamente por la constitución.

## R6. Expiración y transporte del token JWT

- **Decisión**: token firmado con `JWT_SECRET` (variable de entorno) y expiración de 60 minutos
  configurable mediante `JWT_EXPIRES_IN` (valor por defecto `60m`), sin renovación automática; el
  frontend guarda el token en `localStorage` y lo envía en el encabezado
  `Authorization: Bearer <token>`.
- **Justificación**: es la respuesta aceptada en `/speckit.clarify` (2026-10-09) y queda registrado
  en FR-003. El encabezado `Authorization` es el patrón natural de una API REST con JWT y hace
  que la expiración sea verificable en las pruebas (HU1, escenario 3).
- **Alternativas consideradas**:
  - *Cookie `httpOnly`*: rechazado porque cambiaría el contrato de la API (el spec pide devolver un
    token) y añadiría manejo de CSRF.
  - *Refresh token / renovación automática*: rechazado por alcance del Sprint 1.
  - *Sesión de 15 minutos o de 24 horas*: descartados en el clarify por incomodidad y por
    exposición excesiva respectivamente.

## R7. Semilla del usuario administrador

- **Decisión**: script en `database/seeds/` que crea un usuario administrador inicial con correo y
  contraseña definidos en variables de entorno (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`), con
  contraseña de al menos 8 caracteres almacenada con hash `bcrypt` calculado en tiempo de
  ejecución; si el usuario ya existe, la semilla no lo duplica.
- **Justificación**: la spec asume un administrador inicial sin el cual no sería posible gestionar
  usuarios y clientes (HU1 y HU3 dependen de él); calcular el hash en la semilla evita guardar
  contraseñas ni hashes precargados en el repositorio.
- **Alternativas consideradas**:
  - *Usuario fijo con contraseña documentada en el repositorio*: rechazado por SC-005 (ningún
    secreto en el repositorio).
  - *Registro en línea del primer administrador*: rechazado porque el spec tiene el auto-registro
    fuera de alcance.

## R8. Migraciones y reconstrucción de la base de datos

- **Decisión**: scripts SQL numerados en `database/migrations/`
  (`001_crear_estructura.sql`, `002_semilla_administrador.sql`) y un aplicador en
  `database/scripts/` con ES Modules que ejecuta los scripts pendientes en orden y registra los
  aplicados; `database/seeds/` contiene los datos de demostración.
- **Justificación**: FR-023 y SC-004 exigen reconstruir la base de datos íntegramente desde scripts
  versionados; el aplicador elimina el paso manual de recordar el orden.
- **Alternativas consideradas**:
  - *Herramienta de migraciones (Knex Migrations, Sequelize CLI)*: rechazada por introducir un
    ORM/query builder que R1 descarta.
  - *Un único script gigante*: rechazado porque impide migraciones incrementales en el Sprint 2.

## R9. Comunicación frontend-backend en desarrollo

- **Decisión**: el frontend se sirve con Vite en `localhost:5173` y configura un proxy `/api` hacia
  el backend en `localhost:3000`; el backend expone las rutas bajo el prefijo `/api` y usa
  `cors` solo si se sirve desde otro origen.
- **Justificación**: evita problemas de CORS en desarrollo, mantiene una única URL de API en el
  frontend y respeta la separación frontend/backend sin añadir infraestructura.
- **Alternativas consideradas**:
  - *CORS abierto en backend*: rechazado como única medida (menos seguro y más configuración).
  - *Frontend compilado servido por Express*: rechazado para desarrollo, aunque puede usarse en la
    demostración final.

## R10. Manejo de errores y formato de respuestas

- **Decisión**: middleware de errores centralizado en `backend/src/middlewares/` que traduce
  errores a JSON con la forma `{ "mensaje": string, "codigo"?: string }` y códigos HTTP
  apropiados (400 validación, 401 autenticación, 403 autorización, 404 no encontrado, 409
  duplicado, 500 error interno genérico); los detalles técnicos solo se registran en consola del
  servidor.
- **Justificación**: FR-034, FR-005 y la regla IX de la constitución exigen mensajes claros sin
  revelar información interna; un único punto de traducción evita respuestas inconsistentes.
- **Alternativas consideradas**:
  - *Errores manejados en cada controlador*: rechazado por duplicación e inconsistencia.
  - *Respuestas con `stack trace` en desarrollo*: rechazado por riesgo de filtrar información
    sensible si el modo se olvida de cambiar.

## R11. Registro de eventos y observabilidad

- **Decisión**: en el Sprint 1, logging básico en consola del servidor con formato
  `[fecha] [nivel] mensaje` para arranque, errores 500 y fallos de conexión a MySQL; sin librería
  de logging ni tabla de auditoría (la auditoría pertenece al Sprint 2).
- **Justificación**: la observabilidad quedó como ítem de bajo impacto en el clarify; alcanza para
  diagnosticar fallos locales sin añadir dependencias ni salir del alcance.
- **Alternativas consideradas**:
  - *winston / pino*: rechazados por dependencia innecesaria en un entorno local de demostración.
  - *Tabla `auditoria` operativa en Sprint 1*: rechazado por estar fuera del alcance del spec.

## R12. Recuperación de contraseña

- **Decisión**: el único flujo del Sprint 1 es el restablecimiento manual por parte del
  administrador (FR-011); no se implementa envío de correos.
- **Justificación**: la recuperación por correo electrónico está explícitamente fuera de alcance en
  la spec y en `docs/sprint-1.md`, y no existe servicio de correo en el entorno local.
- **Alternativas consideradas**:
  - *SMTP con servicio externo*: rechazado por alcance y por dependencia externa.

---

## Ítems que permanecen diferidos (no bloquean este sprint)

| Ítem | Motivo del diferimiento |
|------|--------------------------|
| Umbral de intentos fallidos de login (rate limiting) | Ítem de bajo impacto señalado en el clarify; entorno local y académico. Evaluar en Sprint 2. |
| Métricas y trazabilidad de eventos (más allá de logs de consola) | La auditoría funcional pertenece al Sprint 2 según `docs/sprint-1.md`. |
| Librería de reconocimiento facial y almacenamiento de descriptores | Pertenece al Sprint 2; su selección exige pruebas de cámara e iluminación. |
