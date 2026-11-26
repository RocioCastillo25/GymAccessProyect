# Especificación de la Funcionalidad: Sprint 4 - Reportes avanzados, notificaciones automáticas y optimización para despliegue

**Rama de la funcionalidad**: `004-reportes-notificaciones-despliegue`

**Creada**: 2026-11-04

**Estado**: Borrador

**Entrada**: Descripción del usuario: "Sprint 4: reportes avanzados, notificaciones automáticas y
optimización para despliegue. Usa `docs/sprint-4.md`, `docs/project-context.md` y `docs/reglas.md`
como fuentes de verdad.".

**Fuentes de verdad**: `docs/sprint-4.md`, `docs/project-context.md`, `docs/reglas.md` y la
constitución del proyecto (`.specify/memory/constitution.md`).

**Dependencia**: reutiliza clientes, membresías, pagos, accesos, rostros y auditoría de los Sprints
1 a 3. No crea módulos de negocio nuevos; agrega reportes, alertas visuales, exportaciones,
optimización de consultas y preparación del entorno de despliegue.

## Clarifications

### Session 2026-11-04

- Q: ¿El Sprint 4 debe incluir un reporte de clientes morosos o vencidos, además de los reportes financiero y de accesos? → A: Incluir un reporte exportable de clientes con membresía vencida o sin membresía activa, sin calcular adeudos monetarios.
- Q: ¿Cómo deben agruparse las horas pico en el reporte de accesos: por franjas de una hora o por turnos del gimnasio? → A: Por franjas de una hora.
- Q: ¿Qué pagos debe incluir el reporte financiero al calcular el total recaudado: solo los completados o también los pendientes y cancelados? → A: Solo los pagos con estado completado.

## Escenarios de usuario y pruebas *(obligatorio)*

### Historia de usuario 1 - Reporte financiero de ingresos (Prioridad: P1) — US-S4-01

Como administrador, quiero consultar y exportar un reporte detallado de ingresos por rangos de fecha
y método de pago para auditar las finanzas del gimnasio.

**Por qué esta prioridad**: es el reporte de mayor valor para la toma de decisiones y la auditoría
financiera; sin él, el administrador no puede comprobar los ingresos del periodo.

**Prueba independiente**: un administrador autenticado elige un rango de fechas con pagos completados
y el sistema muestra el total recaudado y su desglose por tipo de membresía y método de pago.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado y un rango de fechas con pagos completados, **Cuando** genera
   el reporte financiero, **Entonces** el sistema muestra el total recaudado y el desglose por tipo de
   membresía y método de pago.
2. **Dado** un administrador autenticado, **Cuando** aplica filtros de fecha y método de pago,
   **Entonces** el reporte solo incluye los pagos completados que cumplen esos filtros.
3. **Dado** un rango de fechas sin pagos, **Cuando** se genera el reporte, **Entonces** el sistema
   muestra una tabla vacía con la leyenda "No hay registros para este periodo" y totales en cero.
4. **Dado** un recepcionista, entrenador o cliente autenticado, **Cuando** intenta consultar el
   reporte financiero, **Entonces** el sistema deniega la operación con `403`.
5. **Dado** un periodo con pagos completados, pendientes y cancelados, **Cuando** se genera el
   reporte financiero, **Entonces** el total recaudado solo suma los pagos completados y excluye los
   pendientes y cancelados.

---

### Historia de usuario 2 - Reporte de accesos y concurrencia (Prioridad: P1) — US-S4-02

Como administrador, quiero consultar el historial consolidado de accesos autorizados y rechazados
con filtros por cliente y fecha para analizar horas pico y patrones de asistencia.

**Por qué esta prioridad**: permite entender la operación diaria del gimnasio y detectar horarios de
mayor demanda o problemas de acceso.

**Prueba independiente**: un administrador autenticado consulta un rango de fechas con accesos y el
sistema muestra totales autorizados, rechazados y la distribución por franja horaria.

**Escenarios de aceptación**:

1. **Dado** un administrador autenticado y un rango de fechas con accesos, **Cuando** genera el
   reporte de accesos, **Entonces** el sistema muestra el total de accesos, los autorizados, los
   rechazados y su distribución por tipo y franja horaria.
2. **Dado** un administrador autenticado, **Cuando** filtra por cliente, resultado o fecha,
   **Entonces** el reporte solo incluye los accesos que cumplen los filtros.
3. **Dado** un rango de fechas sin accesos, **Cuando** se genera el reporte, **Entonces** el sistema
   muestra una tabla vacía con la leyenda "No hay registros para este periodo" y totales en cero.
4. **Dado** un recepcionista, entrenador o cliente autenticado, **Cuando** intenta consultar el
   reporte de accesos consolidado, **Entonces** el sistema deniega la operación con `403`.

---

### Historia de usuario 3 - Alertas de membresías por vencer (Prioridad: P1) — US-S4-03

Como administrador o recepcionista, quiero visualizar un panel de alertas con los clientes cuya
membresía vencerá en los próximos 5 días para gestionar su renovación oportuna.

**Por qué esta prioridad**: reduce la pérdida de clientes y permite que recepción contacte al
cliente antes del vencimiento.

**Prueba independiente**: un recepcionista autenticado abre el dashboard o la pantalla de membresías
y ve las membresías activas que vencen dentro de los próximos 5 días, resaltadas visualmente.

**Escenarios de aceptación**:

1. **Dado** un administrador o recepcionista autenticado, **Cuando** abre el dashboard o la pantalla
   de membresías, **Entonces** el sistema muestra las membresías activas que vencen en 5 días o
   menos, con cliente, tipo de membresía, fecha de vencimiento y días restantes.
2. **Dado** un conjunto de membresías activas, vencidas y suspendidas, **Cuando** se calculan las
   alertas, **Entonces** solo se incluyen las activas cuyo vencimiento está entre hoy y los próximos
   5 días.
3. **Dado** un conjunto sin membresías por vencer, **Cuando** se abre el panel, **Entonces** el
   sistema muestra un mensaje claro de que no hay alertas.
4. **Dado** un entrenador o cliente autenticado, **Cuando** intenta consultar el panel de alertas,
   **Entonces** el sistema no le muestra información de otros clientes.

---

### Historia de usuario 4 - Exportación de reportes a PDF y CSV (Prioridad: P2) — US-S4-04

Como administrador, quiero descargar los reportes de finanzas y asistencias en formato PDF y CSV
para archivado o presentación externa.

**Por qué esta prioridad**: complementa la consulta en pantalla y permite compartir o conservar los
resultados del periodo analizado.

**Prueba independiente**: un administrador autenticado genera un reporte, presiona exportar y
descarga un archivo PDF o CSV con los mismos datos y filtros que ve en pantalla.

**Escenarios de aceptación**:

1. **Dado** un reporte financiero o de accesos con filtros aplicados, **Cuando** el administrador
   exporta a PDF, **Entonces** el archivo descargado incluye el encabezado del gimnasio, el rango de
   fechas, los filtros y los totales correspondientes.
2. **Dado** un reporte con filtros aplicados, **Cuando** el administrador exporta a CSV, **Entonces**
   el archivo contiene las mismas filas y totales que el reporte en pantalla.
3. **Dado** un rango sin registros, **Cuando** se exporta, **Entonces** el archivo se genera con la
   leyenda de periodo sin registros y totales en cero, sin romper la interfaz.
4. **Dado** una exportación en curso, **Cuando** el usuario vuelve a presionar exportar, **Entonces**
   el sistema evita generar descargas duplicadas o archivos temporales permanentes.

---

### Historia de usuario 5 - Optimización de base de datos e índices (Prioridad: P2) — US-S4-05

Como sistema/desarrollador, quiero implementar índices SQL y consultas optimizadas para garantizar
respuestas rápidas en la validación de acceso facial y en los reportes.

**Por qué esta prioridad**: el sistema debe sostener la operación y las consultas analíticas sin
degradar la experiencia del usuario.

**Prueba independiente**: se aplican las migraciones de índices, se ejecutan las consultas de
validación de acceso y reportes y se comprueba que usan los índices y cumplen los tiempos objetivo
en el entorno local.

**Escenarios de aceptación**:

1. **Dado** la base de datos actualizada, **Cuando** se revisan las columnas de filtrado frecuente y
   las llaves foráneas, **Entonces** todas cuentan con un índice explícito.
2. **Dado** un volumen de prueba representativo, **Cuando** se ejecuta una validación de acceso
   facial, **Entonces** la respuesta se completa en menos de 200 ms en el entorno local de
   demostración.
3. **Dado** un rango de un mes con datos de prueba, **Cuando** se generan los reportes financiero y
   de accesos, **Entonces** las consultas utilizan los índices y responden dentro del tiempo
   objetivo definido para la demostración.
4. **Dado** un entorno nuevo, **Cuando** se ejecutan únicamente las migraciones versionadas,
   **Entonces** la base de datos se reconstruye con las tablas, relaciones e índices requeridos.

---

### Historia de usuario 6 - Preparación del entorno para despliegue (Prioridad: P3) — US-S4-06

Como sistema/desarrollador, quiero dejar configurado el entorno y los scripts de compilación para
que la aplicación pueda desplegarse sin secretos en el repositorio.

**Por qué esta prioridad**: cierra el sprint con un sistema reproducible y seguro para la
demostración final.

**Prueba independiente**: se compila el frontend, se inicia el backend con variables de entorno y se
comprueba que no hay credenciales ni secretos versionados.

**Escenarios de aceptación**:

1. **Dado** un entorno nuevo, **Cuando** se configura con `.env.example`, **Entonces** la aplicación
   inicia con las variables necesarias sin modificar el código.
2. **Dado** el repositorio, **Cuando** se revisa el control de versiones, **Entonces** `.env` no está
   versionado y `.env.example` no contiene secretos reales.
3. **Dado** el código fuente, **Cuando** se ejecuta la compilación del frontend y el arranque del
   backend, **Entonces** ambos completan sin errores y con la configuración documentada.
4. **Dado** el backend, **Cuando** se revisa el código, **Entonces** mantiene la arquitectura modular
   y la configuración de importación aprobada en la constitución del proyecto.

---

### Historia de usuario 7 - Reporte de clientes vencidos (Prioridad: P2) — US-S4-07

Como administrador o recepcionista, quiero consultar y exportar un reporte de clientes con membresía
vencida o sin membresía activa para priorizar su renovación y seguimiento.

**Por qué esta prioridad**: permite identificar clientes que ya no tienen acceso vigente y apoyar la
retención; complementa las alertas de vencimiento próximo sin calcular deudas.

**Prueba independiente**: un administrador o recepcionista autenticado genera el reporte y ve a los
clientes con membresía vencida o sin membresía activa, sin montos de adeudo.

**Escenarios de aceptación**:

1. **Dado** un administrador o recepcionista autenticado y clientes con membresía vencida o sin
   membresía activa, **Cuando** genera el reporte, **Entonces** el sistema muestra cliente, contacto,
   tipo de membresía, fecha de fin y estado, sin calcular ni mostrar adeudos monetarios.
2. **Dado** un reporte de clientes vencidos, **Cuando** se filtra por rango de vencimiento o por
   nombre o documento del cliente, **Entonces** solo se incluyen los clientes que cumplen los filtros.
3. **Dado** un conjunto sin clientes vencidos, **Cuando** se genera el reporte, **Entonces** el
   sistema muestra una tabla vacía con la leyenda "No hay clientes vencidos para este periodo" y
   totales en cero.
4. **Dado** un entrenador o cliente autenticado, **Cuando** intenta consultar el reporte de clientes
   vencidos, **Entonces** el sistema deniega la operación con `403`.
5. **Dado** un reporte con filtros aplicados, **Cuando** el administrador o recepcionista lo exporta
   a PDF o CSV, **Entonces** el archivo contiene las mismas filas y filtros que el reporte en
   pantalla.

---

### Casos límite

- ¿Qué sucede cuando la fecha de inicio es posterior a la fecha de fin? El sistema debe rechazar la
  consulta con un mensaje claro y no ejecutar el reporte.
- ¿Qué sucede cuando el rango de fechas no tiene pagos o accesos? Debe mostrarse una tabla vacía con
  la leyenda "No hay registros para este periodo" y totales en cero.
- ¿Qué sucede cuando el periodo tiene pagos pendientes o cancelados? No deben sumarse al total
  recaudado ni mostrarse como ingresos.
- ¿Qué sucede cuando una membresía vence exactamente en 5 días? Debe incluirse en las alertas.
- ¿Qué sucede cuando una membresía ya está vencida? No debe aparecer en las alertas de vencimiento
  próximo, pero sí en el reporte de clientes vencidos.
- ¿Qué sucede cuando un cliente tiene varias membresías vencidas? El reporte debe mostrar una sola
  fila con su membresía vencida más reciente.
- ¿Qué sucede cuando un cliente no tiene ninguna membresía registrada? Debe aparecer en el reporte de
  clientes vencidos como cliente sin membresía activa.
- ¿Qué sucede cuando se exporta un reporte sin registros? Debe generarse el archivo con la leyenda
  correspondiente y totales en cero.
- ¿Qué sucede cuando un usuario sin rol administrador intenta consultar o exportar reportes
  financieros? El backend debe denegar la operación con `403`.
- ¿Qué sucede cuando un entrenador o cliente intenta consultar el panel de alertas? No debe recibir
  datos de otros clientes.
- ¿Qué sucede cuando la base de datos no está disponible? El backend debe responder con un error
  controlado, sin stack traces ni credenciales.
- ¿Qué sucede cuando se solicita un rango de fechas muy amplio? El sistema debe responder sin romper
  la interfaz y dentro de un tiempo aceptable para la demostración.
- ¿Qué sucede cuando se presiona exportar varias veces seguidas? No deben quedar archivos temporales
  permanentes ni descargas duplicadas innecesarias.

## Requisitos *(obligatorio)*

### Requisitos funcionales

**Reporte financiero**

- **FR-001**: Solo el administrador DEBE poder consultar y exportar el reporte financiero de
  ingresos.
- **FR-002**: El reporte financiero DEBE filtrarse por rango de fechas y, opcionalmente, por método
  de pago.
- **FR-003**: El reporte financiero DEBE mostrar el total recaudado y el desglose por tipo de
  membresía y método de pago.
- **FR-004**: El reporte financiero DEBE incluir únicamente los pagos con estado completado cuya
  fecha corresponda al periodo consultado; los pagos pendientes y cancelados NO DEBEN sumarse al
  total recaudado ni mostrarse como ingresos.
- **FR-005**: El sistema DEBE rechazar rangos de fechas inválidos o incompletos con un mensaje claro.

**Reporte de accesos y concurrencia**

- **FR-006**: Solo el administrador DEBE poder consultar el reporte consolidado de accesos.
- **FR-007**: El reporte de accesos DEBE filtrarse por rango de fechas, cliente y resultado.
- **FR-008**: El reporte de accesos DEBE mostrar el total de accesos, los autorizados, los
  rechazados y su distribución por tipo y franja horaria.
- **FR-009**: El reporte de accesos DEBE usar franjas horarias de una hora para calcular las horas
  pico, sin exponer descriptores faciales ni datos biométricos.
- **FR-010**: El reporte de accesos DEBE incluir los motivos de rechazo cuando correspondan.

**Alertas de vencimiento próximo**

- **FR-011**: El administrador y el recepcionista DEBEN poder ver un panel de alertas de membresías
  por vencer.
- **FR-012**: El panel DEBE incluir únicamente membresías activas cuyo vencimiento esté entre la
  fecha actual y los próximos 5 días, ambos inclusive.
- **FR-013**: Cada alerta DEBE mostrar cliente, tipo de membresía, fecha de vencimiento y días
  restantes, y DEBE resaltarse visualmente con un color de advertencia.
- **FR-014**: El panel DEBE mostrar un mensaje claro cuando no existan membresías por vencer.
- **FR-015**: Las alertas DEBEN ser visuales dentro de la aplicación; el envío de correos, SMS o
  mensajes de WhatsApp queda fuera del alcance.

**Exportación de reportes**

- **FR-016**: El administrador DEBE poder exportar los reportes financiero y de accesos a PDF y CSV.
- **FR-017**: La exportación DEBE respetar los filtros activos y contener el mismo conjunto de datos
  y totales que el reporte en pantalla.
- **FR-018**: El PDF DEBE incluir el encabezado del gimnasio, el rango de fechas, los filtros
  aplicados y los totales correspondientes.
- **FR-019**: El sistema NO DEBE almacenar archivos temporales permanentes en el servidor ni generar
  descargas duplicadas innecesarias.
- **FR-020**: Las exportaciones NO DEBEN incluir credenciales, secretos ni datos biométricos crudos.

**Rendimiento, índices y despliegue**

- **FR-021**: La base de datos DEBE tener índices explícitos en las llaves foráneas y en las columnas
  de filtrado frecuente de pagos, accesos, membresías y clientes.
- **FR-022**: Las consultas de validación de acceso y de reportes DEBEN aprovechar los índices y
  cumplir los tiempos objetivo de la demostración local.
- **FR-023**: La validación de acceso facial DEBE completarse en menos de 200 ms en el entorno local
  de demostración con un volumen de datos representativo.
- **FR-024**: Los reportes de un mes con datos de prueba DEBEN generarse dentro de un tiempo
  aceptable para la demostración y sin bloquear la interfaz.
- **FR-025**: Los cambios de estructura e índices DEBEN agregarse como scripts SQL numerados en
  `database/migrations/`, de forma reejecutable cuando corresponda.
- **FR-026**: La base de datos DEBE poder reconstruirse íntegramente ejecutando únicamente las
  migraciones versionadas.
- **FR-027**: El sistema DEBE configurarse mediante variables de entorno para desarrollo y
  producción; `.env` NO DEBE versionarse y `.env.example` DEBE existir sin secretos reales.
- **FR-028**: El frontend DEBE compilarse y el backend DEBE iniciar con la configuración documentada,
  manteniendo la arquitectura y el stack aprobados en la constitución del proyecto.
- **FR-029**: El frontend NO DEBE conectarse directamente a la base de datos; toda consulta DEBE
  pasar por la API del backend.

**Seguridad, auditoría y errores**

- **FR-030**: El backend DEBE validar autenticación, rol y datos de entrada antes de ejecutar
  cualquier reporte, exportación o consulta de alertas.
- **FR-031**: El sistema DEBE responder en JSON con códigos HTTP apropiados y mensajes claros que no
  revelen información técnica interna.
- **FR-032**: La auditoría DEBE registrar la generación y exportación de reportes sensibles y los
  cambios de configuración relevantes; su consulta será exclusiva del administrador.
- **FR-033**: El sistema DEBE conservar la integridad de pagos, accesos y membresías; los reportes
  solo leen información y no modifican el historial.

**Reporte de clientes vencidos**

- **FR-034**: El administrador y el recepcionista DEBEN poder consultar el reporte de clientes con
  membresía vencida o sin membresía activa.
- **FR-035**: El reporte de clientes vencidos DEBE incluir cliente, contacto, tipo de membresía,
  fecha de fin y estado de la membresía; NO DEBE calcular ni mostrar adeudos monetarios.
- **FR-036**: El reporte de clientes vencidos DEBE filtrarse por rango de fecha de vencimiento y por
  nombre o documento del cliente.
- **FR-037**: El reporte de clientes vencidos DEBE mostrar una tabla vacía con la leyenda "No hay
  clientes vencidos para este periodo" cuando no existan resultados.
- **FR-038**: El administrador y el recepcionista DEBEN poder exportar el reporte de clientes
  vencidos a PDF y CSV, respetando los filtros activos y sin incluir datos biométricos ni
  credenciales.
- **FR-039**: El reporte DEBE mostrar una sola fila por cliente, usando su membresía vencida más
  reciente cuando tenga varias, y DEBE excluir a los clientes con una membresía activa cuya fecha de
  fin sea hoy o posterior.

### Entidades clave

- **pagos**: registra los ingresos del gimnasio. Atributos clave: cliente, membresía, monto, fecha de
  pago, método de pago y estado. Se consulta con agregaciones por fecha, tipo de membresía y método
  de pago.
- **accesos**: registra los intentos de entrada autorizados y rechazados. Atributos clave: cliente,
  fecha y hora, tipo, resultado y motivo de rechazo. Se consulta con agregaciones por fecha, hora y
  resultado.
- **membresias**: relaciona un cliente con un tipo de membresía y su vigencia. Atributos clave:
  cliente, tipo, fecha de inicio, fecha de fin y estado. Se consulta para reportes, alertas de
  vencimiento próximo y el reporte de clientes vencidos.
- **clientes**: información de los clientes del gimnasio. Atributos clave: identidad, contacto y
  estado. Se usa para identificar al cliente en reportes, alertas y el reporte de clientes vencidos,
  sin exponer datos innecesarios.
- **tipos_membresia**: planes disponibles. Atributos clave: nombre, duración, precio y estado. Se usa
  para desglosar ingresos y alertas.
- **auditoria**: registro de acciones importantes. Atributos clave: usuario, acción, módulo, fecha,
  resultado y descripción. Se usa para auditar la generación y exportación de reportes.
- **Índices de base de datos**: no son entidades de negocio; son artefactos de persistencia sobre
  pagos, accesos, membresías y clientes para acelerar filtros y agregaciones.

## Criterios de éxito *(obligatorio)*

### Resultados medibles

- **SC-001**: Un administrador completa la consulta y exportación de un reporte financiero de un mes
  en menos de 2 minutos.
- **SC-002**: El 100 % de las solicitudes a reportes financieros y de accesos realizadas por
  recepcionistas, entrenadores o clientes se rechazan con `403` (0 accesos no autorizados).
- **SC-003**: El 100 % de los totales del reporte financiero coincide con la suma de los pagos
  completados del rango y los filtros seleccionados en los datos de prueba, excluyendo pendientes y
  cancelados.
- **SC-004**: El 100 % de los totales y desgloses del reporte de accesos coincide con los registros
  del rango y la suma de las franjas horarias equivale al total de accesos.
- **SC-005**: El 100 % de las membresías activas que vencen en 5 días o menos aparece en el panel de
  alertas, y ninguna membresía vencida, suspendida o fuera del rango aparece en él.
- **SC-006**: El 100 % de las exportaciones PDF y CSV probadas contiene los mismos totales y filtros
  que el reporte visible en pantalla.
- **SC-007**: Ninguna exportación contiene credenciales, secretos ni datos biométricos crudos, y no
  quedan archivos temporales permanentes después de exportar.
- **SC-008**: La validación de acceso facial se completa en menos de 200 ms en al menos el 95 % de
  las solicitudes de la demostración local con un volumen de datos representativo.
- **SC-009**: Los reportes de un mes con al menos 10,000 pagos y 50,000 accesos se generan en menos
  de 3 segundos en el entorno local de demostración.
- **SC-010**: La base de datos se reconstruye desde cero ejecutando únicamente las migraciones
  versionadas y las consultas de reportes y accesos usan los índices definidos.
- **SC-011**: Ningún secreto (credenciales de base de datos, claves de autenticación) está presente
  en el repositorio; `.env` no se versiona y `.env.example` existe sin valores reales.
- **SC-012**: Las 7 historias de usuario pasan de extremo a extremo (interfaz → API → base de datos)
  en el entorno local.
- **SC-013**: El 100 % de los clientes con membresía vencida o sin membresía activa aparece una sola
  vez en el reporte de clientes vencidos, y ningún cliente con membresía activa vigente aparece en él.
- **SC-014**: El 100 % de las exportaciones del reporte de clientes vencidos contiene las mismas
  filas y filtros que el reporte en pantalla, sin montos de adeudo ni datos biométricos.
- **SC-015**: El 100 % de las solicitudes al reporte de clientes vencidos realizadas por entrenadores
  o clientes se rechazan con `403`.

## Supuestos

- Los Sprints 1 a 3 están implementados: existen autenticación JWT, roles, clientes, membresías,
  pagos, accesos y datos de auditoría sobre los que se apoyan los reportes.
- MySQL está instalado y se ejecuta localmente durante el desarrollo y la demostración.
- Los reportes reutilizan las tablas existentes; no se crean nuevas entidades de negocio, solo
  índices y consultas agregadas.
- El rango de fechas de los reportes es inclusivo en ambos extremos y, si no se indica, se usa el
  mes actual como valor inicial razonable.
- Solo los pagos con estado completado representan ingresos; los pendientes y cancelados se excluyen
  del total recaudado.
- Las horas pico se agrupan siempre por franjas de una hora; no se agrupan por turnos.
- La generación de PDF puede realizarse en el frontend o en el backend; la decisión se resolverá en
  la planificación o en `/speckit.clarify` sin cambiar el resultado visible para el usuario.
- El formato CSV es suficiente para la exportación tipo Excel solicitada en el sprint.
- Un "cliente vencido" es aquel cuya membresía más reciente está vencida o que no tiene ninguna
  membresía activa; el reporte no calcula adeudos, saldos pendientes ni estado de morosidad.
- Las alertas son visuales dentro de la aplicación; no se envían correos, SMS ni mensajes de
  WhatsApp.
- El rendimiento se mide en el entorno local de demostración con un volumen de datos representativo,
  no en un entorno de producción real.
- Los mensajes e interfaz se redactan en español.
- La verificación de permisos ocurre en el backend aunque el frontend oculte opciones según el rol.
- Los datos financieros y biométricos se tratan como información sensible y no se incluyen en logs
  ni en exportaciones más allá de lo necesario.

## Fuera del alcance del Sprint 4

- Envío de correos electrónicos, SMS o mensajes de WhatsApp automáticos; el sprint se limita a
  alertas visuales en la interfaz.
- Pasarelas de pago en línea como Stripe, PayPal o MercadoPago.
- Aplicación móvil nativa para iOS o Android.
- Reportería programada, envío automático de reportes, data warehouse o inteligencia de negocio
  avanzada.
- Contabilidad completa, facturación electrónica, nómina, inventario o venta de productos.
- Cálculo de adeudos, saldos pendientes, cobranza o estado de morosidad financiera.
- Administración de múltiples sucursales.
- Nuevas funcionalidades de clientes, membresías, pagos, reconocimiento facial o control de acceso
  fuera de las necesarias para reportes y alertas.
- Cualquier función que no forme parte del MVP definido en `docs/project-context.md`.

## Preguntas abiertas para `/speckit.clarify`

Decisiones que el equipo debe aprobar y que se resolverán con `/speckit.clarify` o durante el plan:

- ¿El PDF se generará en el frontend con una librería o en el backend mediante un stream?

## Trazabilidad

| Historia de usuario | US origen | Requisitos principales | Sprint   |
| ------------------- | --------- | ---------------------- | -------- |
| HU1                 | US-S4-01  | FR-001 a FR-005        | Sprint 4 |
| HU2                 | US-S4-02  | FR-006 a FR-010        | Sprint 4 |
| HU3                 | US-S4-03  | FR-011 a FR-015        | Sprint 4 |
| HU4                 | US-S4-04  | FR-016 a FR-020        | Sprint 4 |
| HU5                 | US-S4-05  | FR-021 a FR-026        | Sprint 4 |
| HU6                 | US-S4-06  | FR-027 a FR-033        | Sprint 4 |
| HU7                 | US-S4-07  | FR-034 a FR-039        | Sprint 4 |

Los requisitos FR-030 a FR-033 cubren seguridad, auditoría y manejo de errores, y se verifican
mediante los criterios de éxito SC-002, SC-007, SC-011 y SC-012.
