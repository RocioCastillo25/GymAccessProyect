# Especificación de la Funcionalidad: Consulta de pagos y adeudos

**Rama de la funcionalidad**: `005-consulta-pagos-adeudos`

**Creada**: 2026-11-19

**Estado**: Borrador

**Entrada**: Descripción del usuario: "Implementar la consulta de pagos y adeudos pendiente del MVP
(US-G11 y US-S2-05), reutilizando la tabla `pagos`, el modelo `pago.model.js` y los roles definidos,
sin modificar el historial financiero ni agregar pasarelas de pago.".

**Fuentes de verdad**: `docs/project-context.md`, `docs/reglas.md`, `docs/sprint-2.md`,
`specs/002-membresias-pagos-acceso-facial/spec.md`,
`specs/004-reportes-notificaciones-despliegue/spec.md` y la constitución del proyecto
(`.specify/memory/constitution.md`).

**Dependencia**: reutiliza autenticación JWT, roles, clientes, membresías, tipos de membresía,
pagos y auditoría de los Sprints 1 a 4. No redefine el registro de pagos ni los reportes
financieros del Sprint 4; solo agrega operaciones de lectura y sus vistas de consulta.

**Trazabilidad de sprint**: esta funcionalidad cierra `US-S2-05` (Sprint 2, según
`specs/002-membresias-pagos-acceso-facial/spec.md:463`) y `US-G11` (historia general de
`docs/project-context.md:563`). No crea un Sprint 5: reabre dos requisitos del MVP que quedaron
sin implementar. El proyecto ya documenta el Sprint 4 en `docs/sprint-4.md` y
`docs/reporte-sprint-4.md`; la formalización del principio I se hará en un cambio de gobernanza
separado con `/speckit.constitution`.

## Clarifications

### Session 2026-11-19

- Q: ¿Cómo debe calcularse el adeudo de un cliente? → A: Sumar los montos de los pagos con estado
  `pendiente`.
- Q: ¿Cómo debe identificar el backend al cliente autenticado para devolver solo sus pagos y adeudos?
  → A: Buscar el cliente por el `correo` del token JWT y usar su `id_cliente` internamente.
- Q: ¿Debe el recepcionista consultar el historial general de pagos y los adeudos, o solo el
  administrador? → A: Administrador y recepcionista consultan el historial general y los adeudos; el
  cliente consulta únicamente los suyos.
- Q: ¿Deben paginarse las respuestas de consulta de pagos o devolver todos los registros que coincidan
  con los filtros? → A: Paginación con `limite` y `offset`: 50 registros por defecto, 200 como
  máximo, y la respuesta incluye el total general.
- Q: ¿La autorización del recepcionista para consultar historial y adeudos generales cuenta con
  aprobación del equipo? → A: Sí, aprobada en la sesión de 2026-11-19 y registrada como
  desviación documentada en el plan antes de `/speckit.implement`.

## Escenarios de usuario y pruebas *(obligatorio)*

### Historia de usuario 1 - Consulta del historial de pagos (Prioridad: P1) — US-005-01

Como administrador o recepcionista, quiero consultar el historial de pagos con filtros para llevar
un control financiero del gimnasio.

**Por qué esta prioridad**: es la brecha más concreta del MVP: el registro de pagos ya existe, pero
no hay forma de consultarlo desde la API ni desde la interfaz. Aporta valor inmediato sin crear
nuevas entidades.

**Prueba independiente**: un administrador autenticado consulta los pagos registrados y ve el
histórico con cliente, membresía, monto, fecha, método de pago y estado.

**Escenarios de aceptación**:

1. **Dado** un administrador o recepcionista autenticado y pagos registrados, **Cuando** consulta el
   historial, **Entonces** el sistema muestra los pagos con identificador, cliente, membresía,
   monto, fecha de pago, método de pago y estado.
2. **Dado** un administrador autenticado, **Cuando** filtra por rango de fechas, cliente o estado,
   **Entonces** el sistema devuelve únicamente los pagos que cumplen todos los filtros aplicados.
3. **Dado** un rango de fechas sin pagos, **Cuando** se consulta el historial, **Entonces** el
   sistema devuelve una lista vacía, el mensaje "No hay pagos para los filtros seleccionados." y
   totales en cero.
4. **Dado** un rango con fecha de inicio posterior a la fecha de fin, **Cuando** se consulta el
   historial, **Entonces** el sistema rechaza la solicitud con `400` y un mensaje claro, sin
   ejecutar la consulta.
5. **Dado** un entrenador o un cliente autenticado, **Cuando** intenta consultar el historial
   general de pagos, **Entonces** el sistema deniega la operación con `403`.
6. **Dado** un usuario sin token válido, **Cuando** intenta consultar el historial, **Entonces** el
   sistema responde con `401`.
7. **Dado** más de 50 pagos que coinciden con los filtros, **Cuando** se consulta sin indicar
   `limite`, **Entonces** el sistema devuelve los primeros 50 registros, el total general y la
   información necesaria para solicitar la siguiente página con `offset`.

---

### Historia de usuario 2 - Consulta de mis pagos (Prioridad: P1) — US-005-02

Como cliente, quiero consultar únicamente mis pagos para conocer mi historial financiero sin ver
información de otros clientes.

**Por qué esta prioridad**: la regla RN-14 exige que el cliente solo consulte su propia
información; hoy el backend ya tiene `listarPorCliente`, pero no existe un endpoint seguro que lo
exponga al rol cliente.

**Prueba independiente**: un cliente autenticado consulta sus pagos y el sistema devuelve solo los
registros del cliente resuelto a partir del `correo` de su token JWT.

**Escenarios de aceptación**:

1. **Dado** un cliente autenticado con pagos registrados, **Cuando** consulta sus pagos, **Entonces**
   el sistema muestra únicamente los pagos asociados a su cliente.
2. **Dado** un cliente con varios pagos, **Cuando** filtra por fecha o estado, **Entonces** el sistema
   muestra solo sus pagos que cumplen los filtros.
3. **Dado** un cliente sin pagos registrados, **Cuando** consulta su historial, **Entonces** el
   sistema muestra el mensaje "No hay pagos para los filtros seleccionados." y totales en cero.
4. **Dado** un cliente autenticado, **Cuando** envía un parámetro `idCliente` distinto al suyo,
   **Entonces** el backend ignora ese parámetro, resuelve el cliente por el `correo` del token JWT y
   no expone pagos de otro cliente.
5. **Dado** un cliente autenticado, **Cuando** intenta consultar el historial general de pagos,
   **Entonces** el sistema deniega la operación con `403`.

---

### Historia de usuario 3 - Consulta de adeudos (Prioridad: P2) — US-005-03

Como administrador, recepcionista o cliente, quiero consultar los adeudos para saber qué pagos siguen
pendientes y dar seguimiento a la renovación correspondiente.

**Por qué esta prioridad**: completa US-S2-05 y US-G11. Depende de las historias anteriores porque
necesita el historial de pagos y la identificación del cliente; por eso tiene prioridad P2.

**Prueba independiente**: un administrador autenticado consulta los adeudos y ve el total pendiente
agrupado por cliente junto con el detalle de los pagos que lo componen.

**Escenarios de aceptación**:

1. **Dado** pagos con estado `pendiente`, **Cuando** se consultan los adeudos, **Entonces** el sistema
   muestra el cliente, el total adeudado y el detalle de los pagos pendientes que lo componen.
2. **Dado** un cliente con pagos completados y pendientes, **Cuando** se consultan sus adeudos,
   **Entonces** los pagos completados no se cuentan como adeudo.
3. **Dado** un cliente sin adeudos, **Cuando** se consultan sus adeudos, **Entonces** el sistema
   muestra el total en cero y el mensaje "No hay adeudos registrados.".
4. **Dado** un cliente autenticado, **Cuando** consulta sus adeudos, **Entonces** el sistema muestra
   únicamente los propios, sin información de otros clientes.
5. **Dado** un entrenador autenticado, **Cuando** intenta consultar adeudos, **Entonces** el sistema
   deniega la operación con `403`.
6. **Dado** un usuario autenticado con rol no permitido, **Cuando** intenta consultar adeudos de un
   cliente específico, **Entonces** el sistema no revela el total ni el detalle de ese cliente.

---

### Casos límite

- ¿Qué sucede cuando la fecha de inicio es posterior a la fecha de fin? La consulta debe rechazarse
  con `400` y un mensaje claro, sin ejecutarse.
- ¿Qué sucede cuando se envía un `idCliente` no numérico o menor o igual a cero en el historial
  general o en los adeudos generales? El sistema debe responder con `400` y no consultar la base de
  datos. En las rutas propias `/mios`, el parámetro se ignora y nunca debe alterar el cliente resuelto.
- ¿Qué sucede cuando se filtra por un cliente inexistente? El sistema debe devolver una lista vacía
  con el mensaje de periodo sin pagos, sin revelar si el cliente existe.
- ¿Qué sucede cuando `limite` o `offset` no son enteros positivos, o cuando `limite` supera 200? El
  sistema debe rechazar la solicitud con `400` y un mensaje claro, sin ejecutar la consulta.
- ¿Qué sucede cuando `offset` supera el total de registros? El sistema debe devolver una lista vacía,
  el total general y el mensaje de estado vacío, sin errores.
- ¿Qué sucede cuando no hay pagos pendientes? El sistema debe mostrar cero adeudos y el mensaje
  "No hay adeudos registrados.".
- ¿Qué sucede con los pagos cancelados al calcular adeudos? No se incluyen en el total adeudado ni
  se muestran como pagos completados.
- ¿Qué sucede cuando un cliente tiene pagos sin membresía asociada? Deben aparecer en el historial y,
  si están `pendientes`, sí cuentan en el adeudo.
- ¿Qué sucede cuando un cliente intenta consultar pagos de otro cliente? El sistema debe resolver el
  cliente solo por el `correo` del token JWT y nunca devolver datos ajenos.
- ¿Qué sucede cuando la base de datos no está disponible? El backend debe responder con un error
  controlado en JSON, sin stack traces ni credenciales.
- ¿Qué sucede cuando se consulta un historial muy extenso? El sistema debe responder dentro del
  tiempo objetivo definido para la demostración local, sin bloquear la interfaz.

## Requisitos *(obligatorio)*

### Requisitos funcionales

#### Convención de identificadores

Los `FR-001` a `FR-019` de esta especificación son locales a la funcionalidad 005. En documentos
que citen también la spec 002 se escriben con prefijo `005-FR-###` (por ejemplo `005-FR-011`)
para distinguirlos de `FR-011` a `FR-015` de la spec 002, que significan otra cosa.

**Consulta de pagos**

- **FR-001**: El sistema DEBE permitir a los roles administrador y recepcionista consultar el
  historial general de pagos mediante `GET /api/pagos`.
- **FR-002**: El sistema DEBE permitir al rol cliente consultar únicamente sus propios pagos mediante
  `GET /api/pagos/mios`, resolviendo el cliente a partir del `correo` del token JWT.
- **FR-003**: Las consultas de pagos DEBEN aceptar filtros opcionales por rango de fechas, cliente
  (solo para administrador y recepcionista) y estado, además de los parámetros de paginación
  `limite` y `offset`. El valor por defecto de `limite` DEBE ser 50, su máximo 200, y la respuesta
  DEBE incluir el total de registros que coinciden con los filtros.
- **FR-004**: Las respuestas DEBEN reutilizar el formato de `presentarPago`: `id`, `idCliente`,
  `idMembresia`, `monto`, `fechaPago`, `metodoPago` y `estado`.
- **FR-005**: El backend DEBE responder con `401` cuando falte o sea inválido el token, y con `403`
  cuando el rol no esté autorizado.
- **FR-006**: Para los endpoints del cliente, el backend DEBE resolver `id_cliente` buscando el
  cliente por el `correo` del token JWT; cualquier parámetro `idCliente` enviado por la petición NO
  DEBE alterar el resultado.
- **FR-007**: El sistema DEBE validar que la fecha de inicio no sea posterior a la fecha de fin y
  DEBE responder con `400` cuando la condición se incumpla.
- **FR-008**: Cuando no existan resultados, el sistema DEBE devolver una lista vacía, el mensaje
  "No hay pagos para los filtros seleccionados." y totales en cero.

**Consulta de adeudos**

- **FR-009**: El sistema DEBE permitir a administrador y recepcionista consultar los adeudos de un
  cliente específico o de todos los clientes, con filtro opcional `idCliente` y paginación mediante
  `limite` (por defecto 50, máximo 200) y `offset` (por defecto 0). La respuesta DEBE incluir el
  `total` de clientes con al menos un pago pendiente, sin aplicar paginación a ese total.
- **FR-010**: El sistema DEBE permitir al cliente consultar únicamente sus propios adeudos,
  resolviendo el cliente por el `correo` del token JWT y sin aceptar parámetros de cliente. Este
  endpoint NO aplica paginación: devuelve el `totalAdeudado` y el detalle completo de sus pagos
  pendientes.
- **FR-011**: El cálculo de adeudos DEBE sumar los montos de todos los pagos con estado `pendiente`
  del cliente correspondiente; los pagos `completados` y `cancelados` NO DEBEN incluirse en el total
  adeudado.
- **FR-012**: La respuesta de adeudos DEBE mostrar cliente, total adeudado y el detalle de los pagos
  que componen el adeudo.
- **FR-013**: Cuando no existan adeudos, el sistema DEBE devolver el total en cero y el mensaje
  "No hay adeudos registrados.".
- **FR-014**: Las consultas de adeudos DEBEN ser de solo lectura y NO DEBEN modificar pagos,
  membresías ni su historial.

**Seguridad, interfaz y errores**

- **FR-015**: El frontend NO DEBE conectarse directamente a MySQL; toda consulta DEBE pasar por la
  API REST del backend.
- **FR-016**: El backend DEBE devolver respuestas en JSON con códigos HTTP apropiados y mensajes
  claros que no revelen información técnica interna.
- **FR-017**: El frontend DEBE mostrar en español los estados vacíos, los totales y los mensajes de
  error devueltos por la API.
- **FR-018**: La implementación DEBE mantener la arquitectura modular del proyecto (rutas,
  controladores, servicios, modelos, presentadores y validadores) y el uso de ES Modules.
- **FR-019**: La funcionalidad NO DEBE exponer credenciales, secretos ni datos biométricos crudos en
  ninguna respuesta.

### Entidades clave

- **pagos**: registra los ingresos y compromisos de pago del gimnasio. Atributos clave: cliente,
  membresía, monto, fecha de pago, método de pago y estado (`pendiente`, `completado` o
  `cancelado`). Es la fuente principal de esta funcionalidad.
- **clientes**: identifica a la persona dueña de los pagos. Se usa para filtrar el historial y para
  restringir al rol cliente únicamente a su propia información.
- **membresias y tipos_membresia**: relacionan los pagos con un plan y su precio. No participan en el
  cálculo de adeudos porque la regla aprobada usa únicamente el estado de `pagos`; se conservan para
  contextualizar la membresía asociada al pago.
- **usuarios**: proporciona el `correo` y el rol del token JWT. El `correo` se usa para resolver el
  cliente asociado, igual que en los endpoints `/yo` existentes, cuando un cliente consulta sus
  propios datos.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **SC-001**: El 100 % de los pagos mostrados en cada página coincide con los registros de `pagos`
  que cumplen los filtros y el rango solicitado en los datos de prueba.
- **SC-002**: El 100 % de las consultas realizadas por un cliente devuelve solo pagos y adeudos de su
  propio cliente; 0 consultas exponen información ajena.
- **SC-003**: El 100 % de las solicitudes sin token o con rol no autorizado se rechaza con `401` o
  `403`, respectivamente.
- **SC-004**: El 100 % de los totales de adeudos coincide con la suma de pagos `pendientes` del
  cliente en los datos de prueba; ningún pago `completado` o `cancelado` se cuenta como adeudo.
- **SC-005**: El 100 % de las consultas sin resultados muestra el mensaje de estado vacío
  correspondiente y totales en cero, sin errores en la interfaz.
- **SC-006**: Las consultas de pagos y adeudos responden en menos de 500 ms con un volumen de 10,000
  pagos en el entorno local de demostración.
- **SC-007**: Ninguna respuesta de esta funcionalidad contiene credenciales, secretos ni datos
  biométricos crudos.
- **SC-008**: Las 3 historias de usuario pasan de extremo a extremo (interfaz → API → base de datos)
  en el entorno local.

## Supuestos

- Los Sprints 1 a 4 están implementados: existen autenticación JWT, roles, clientes, membresías,
  pagos, auditoría y reportes sobre los que se apoya la consulta.
- Los estados válidos de un pago son `pendiente`, `completado` y `cancelado`, según los validadores
  existentes del proyecto.
- Para esta funcionalidad, administrador y recepcionista están autorizados a consultar el historial
  general de pagos y los adeudos; el cliente solo consulta los propios.
- El cliente se resuelve de forma segura desde el `correo` del usuario autenticado; no se confía en
  parámetros enviados por el navegador para decidir la propiedad de los datos.
- Los rangos de fechas son inclusivos en ambos extremos.
- El historial de pagos es de solo lectura en esta funcionalidad; el registro de pagos permanece en
  el módulo existente del Sprint 2.
- El adeudo se calcula como la suma de pagos con estado `pendiente`; los pagos `completados` y
  `cancelados` no cuentan como adeudo.
- Los reportes financieros del Sprint 4 siguen siendo la fuente para análisis agregados; esta spec
  cubre consultas operativas por cliente, no reportería analítica.
- Los mensajes y la interfaz se redactan en español.
- La definición de adeudos de esta especificación (`005-FR-011`) prevalece sobre la redacción
  anterior de `002/FR-015`, que queda actualizada para evitar dos definiciones simultáneas.

## Fuera del alcance

- Modificar, eliminar o corregir pagos registrados.
- Registrar nuevos pagos o renovar membresías desde esta funcionalidad.
- Generar o exportar reportes financieros; eso corresponde al Sprint 4.
- Calcular morosidad, intereses, saldos a favor ni adeudos de clientes vencidos dentro del reporte
  del Sprint 4.
- Envío de correos, SMS o notificaciones automáticas de cobro.
- Pasarelas de pago en línea, facturación electrónica ni contabilidad completa.
- Consulta de auditoría; se propone como funcionalidad posterior `006-consulta-auditoria`.
- Administración de múltiples sucursales.

## Preguntas abiertas para `/speckit.clarify`

Decisiones pendientes después de la sesión 2026-11-19:

- Ninguna. Las decisiones de esta ronda quedaron registradas en la sección de aclaraciones.

## Trazabilidad

| Historia de usuario | US origen | Requisitos principales | Sprint | Funcionalidad |
| ------------------- | --------- | ---------------------- | ------ | ------------- |
| HU1                 | US-005-01 | FR-001 a FR-008        | Sprint 2 (`US-S2-05`) | Consulta de pagos |
| HU2                 | US-005-02 | FR-001, FR-002, FR-005 a FR-008 | Sprint 2 (`US-S2-05`) | Consulta de mis pagos |
| HU3                 | US-005-03 | FR-009 a FR-014        | Sprint 2 (`US-S2-05`) | Consulta de adeudos |

`US-G11` es una historia general sin sprint asignado en `docs/project-context.md`.

Los requisitos FR-015 a FR-019 cubren seguridad, arquitectura y manejo de errores, y se verifican
mediante los criterios SC-002, SC-003, SC-007 y SC-008.
