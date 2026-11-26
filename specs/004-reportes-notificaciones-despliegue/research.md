# Investigación: Sprint 4 - Reportes avanzados, alertas y despliegue

**Rama**: `004-reportes-notificaciones-despliegue` | **Fecha**: 2026-11-05 | **Plan**:
[plan.md](./plan.md)

Documento de la Fase 0 de `/speckit.plan`. Resuelve las decisiones técnicas abiertas de la
especificación y la pregunta pendiente para `/speckit.clarify`. Cada entrada sigue el formato
**Decisión**, **Justificación** y **Alternativas consideradas**. La numeración continúa la serie del
proyecto (el Sprint 3 usó R15–R24), por lo que este sprint comienza en R25.

---

## R25. Generación de PDF y CSV sin dependencias nuevas

- **Decisión**: el PDF se genera en el **frontend** con `window.print()` y una hoja de estilos
  `@media print` que oculta navegación, filtros y botones, y conserva el encabezado, el rango de
  fechas, los filtros aplicados y los totales. El CSV se genera en el **frontend** con un `Blob` de
  texto UTF-8 (con BOM), separador `;` para compatibilidad con Excel en español y descarga mediante
  un enlace temporal. No se crea un endpoint de descarga ni se almacenan archivos en el servidor.
- **Justificación**: cumple FR-016 a FR-020 y RN-S4-03 sin agregar `jspdf`, `pdfmake` ni otra
  dependencia no aprobada por la constitución. Los datos ya están en pantalla; exportarlos desde el
  navegador garantiza que el archivo contenga exactamente lo que el usuario ve. Al no escribir
  archivos en disco se evitan temporales permanentes y descargas duplicadas.
- **Alternativas consideradas**:
  - *PDF con `jspdf`/`pdfmake` en el frontend*: rechazada por ser una dependencia nueva y aumentar el
    tamaño del bundle sin cambiar el resultado visible.
  - *PDF con stream desde Express*: rechazada por agregar una dependencia de generación de PDF,
    escribir o transmitir archivos y duplicar la lógica de formato del frontend.
  - *CSV generado en el backend*: rechazada porque obliga a un endpoint de descarga y a manejar
    `Content-Disposition`; el navegador ya puede producir el archivo con los datos recibidos.

## R26. Contrato de reportes y filtros obligatorios

- **Decisión**: se mantienen los endpoints existentes y se completan sus filtros:
  - `GET /api/reports/financial?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD&metodoPago=...` (solo
    administrador). `metodoPago` es opcional y filtra los pagos completados por método.
  - `GET /api/reports/access?fechaInicio=YYYY-MM-DD&fechaFin=YYYY-MM-DD&idCliente=...&resultado=...`
    (solo administrador). `resultado` admite `autorizado` o `rechazado`; la respuesta agrega
    `porMotivoRechazo` para cumplir FR-010.
  - `GET /api/reports/expiring-memberships` (administrador y recepcionista).
  - `GET /api/reports/expired-clients?fechaInicio=...&fechaFin=...&buscar=...` (administrador y
    recepcionista), definido en R27.
  - `POST /api/reports/exports` registra en auditoría una exportación (R30).
- **Justificación**: FR-002 exige filtrar por método de pago y FR-007 por resultado; FR-010 exige
  incluir los motivos de rechazo. Mantener rutas planas y parámetros de consulta es consistente con
  los Sprints 1 a 3 y con el cliente HTTP `pedir` del frontend.
- **Alternativas consideradas**:
  - *Filtros por ruta anidada* (p. ej. `/reports/financial/:metodo`): rechazada por inconsistencia
    con el resto de la API.
  - *Devolver todos los pagos y filtrar en el frontend*: rechazada porque el backend debe validar y
    limitar los datos, y porque el reporte financiero es sensible.

## R27. Reporte de clientes vencidos y filtro por "documento"

- **Decisión**: un **cliente vencido** es aquel que no tiene ninguna membresía `activa` con
  `fecha_fin >= CURDATE()`. El reporte devuelve **una fila por cliente**:
  - Si tiene membresías vencidas, muestra la más reciente por `fecha_fin` (desempate por
    `id_membresia`), con `tipoMembresia`, `fechaFin` y `estado` calculado como `vencida`.
  - Si no tiene ninguna membresía, muestra `tipoMembresia = "Sin membresía"`, `fechaFin = null` y
    `estado = "sin_membresia"`.
  - Los filtros de fecha (`fechaInicio`/`fechaFin`) se aplican sobre la `fecha_fin` de la membresía
    vencida más reciente. Los clientes sin membresía se incluyen cuando no se envía rango de fechas.
  - El filtro `buscar` se aplica sobre `nombre`, `apellido`, `correo` e `idCliente`.
  - **No se calculan adeudos, saldos ni morosidad** (fuera de alcance).
- **Sobre "documento" (FR-036)**: la tabla `clientes` del MVP **no tiene columna `documento`**. Para
  no ampliar el alcance con un cambio de esquema y formularios de clientes, el plan interpreta
  "documento" como el identificador disponible del cliente: `idCliente` o `correo`. Si en el futuro
  se agrega un documento oficial, el mismo parámetro `buscar` podrá incluirlo sin cambiar el
  contrato.
- **Justificación**: cumple FR-034 a FR-039 y SC-013 sin duplicar filas ni incluir clientes con
  membresía vigente. Evita introducir un campo nuevo ajeno a los reportes y mantiene la promesa de
  "solo índices y consultas agregadas" del spec.
- **Alternativas consideradas**:
  - *Agregar `documento` a `clientes` en este sprint*: rechazada porque obliga a modificar registro,
    edición, validaciones y formularios de clientes, fuera del alcance de reportes.
  - *Mostrar todas las membresías vencidas del cliente*: rechazada por FR-039, que exige una sola
    fila por cliente.
  - *Incluir deudas calculadas*: rechazada explícitamente por el spec y por el alcance del sprint.

## R28. Índices y verificación de rendimiento

- **Decisión**: se mantiene la migración `004_sprint4_optimizacion_reportes.sql` y se agrega
  `006_sprint4_indices_compuestos.sql` con índices compuestos reejecutables (comprobando
  `information_schema.statistics` antes de crearlos):
  - `pagos (estado, fecha_pago)` y `pagos (estado, fecha_pago, metodo_pago)` para el reporte
    financiero.
  - `accesos (fecha_hora, resultado)` y `accesos (fecha_hora, id_cliente, resultado)` para el reporte
    de accesos.
  - `membresias (id_cliente, estado, fecha_fin)` para la vigencia y las alertas.
  - `membresias (estado, fecha_fin)` para el panel de vencimientos.
  - `rostros (estado)` para la carga de descriptores activos.
  - `clientes (apellido, nombre)` para la búsqueda del reporte de vencidos.
- **Justificación**: los índices simples actuales ayudan, pero las consultas de reportes filtran por
  dos o tres columnas a la vez; los índices compuestos evitan escaneos completos y permiten que
  MySQL use el prefijo izquierdo. Se verifica con `EXPLAIN` que las consultas usen índices (SC-010).
  La migración nueva respeta el historial de migraciones ya aplicadas (no se edita la 004).
- **Alternativas consideradas**:
  - *Modificar la migración 004 ya aplicada*: rechazada porque el aplicador registra migraciones
    aplicadas y no la volvería a ejecutar en bases existentes.
  - *Solo índices simples*: insuficiente para filtros combinados de fecha, estado y método.
  - *Índices en todas las columnas*: rechazada porque degrada las escrituras y aumenta el espacio sin
    beneficio demostrable.

## R29. Rendimiento de la validación de acceso facial

- **Decisión**: se mide el flujo completo `POST /api/accesos/validar` con un conjunto representativo
  de rostros activos y membresías. Se conserva la comparación en memoria porque el volumen del MVP es
  pequeño y el descriptor nunca sale del backend. Se agrega el índice `rostros (estado)` y se
  documenta que la consulta de vigencia usa `membresias (id_cliente, estado, fecha_fin)`. Si la
  medición local supera 200 ms de forma sostenida, se aplica una caché en memoria de descriptores
  activos invalidada al registrar o actualizar un rostro, sin cambiar el contrato.
- **Justificación**: FR-023 y SC-008 piden < 200 ms en el entorno local de demostración, no una
  arquitectura de búsqueda vectorial. La caché es una optimización opcional y acotada; el índice por
  estado reduce la carga inicial.
- **Alternativas consideradas**:
  - *Búsqueda vectorial en MySQL o motor externo*: rechazada por ser una dependencia y complejidad
    fuera del MVP.
  - *Guardar descriptores en el frontend*: rechazada por seguridad (datos biométricos).
  - *Prometer < 200 ms en producción*: fuera de alcance; la meta es el entorno local de demostración.

## R30. Auditoría de generación y exportación de reportes

- **Decisión**: se reutiliza `services/auditoria.service.js` (`registrarAccion`, best-effort) para:
  - registrar la **generación** del reporte financiero, de accesos y de clientes vencidos, con
    módulo `reportes`, acción `generar_reporte_*`, usuario autenticado y descripción con el rango y
    los filtros aplicados;
  - registrar la **exportación** mediante `POST /api/reports/exports` con cuerpo
    `{ "reporte": "financiero|accesos|vencidos", "formato": "csv|pdf", "filtros": { ... } }`. El
    frontend llama a este endpoint después de iniciar la descarga; si falla, la descarga no se
    bloquea (la auditoría es best-effort) pero se informa en consola del servidor.
- **Justificación**: FR-032 exige registrar generación y exportación de reportes sensibles. Como la
  exportación ocurre en el navegador, el backend necesita un evento explícito para dejar
  trazabilidad. La consulta de auditoría sigue siendo exclusiva del administrador.
- **Alternativas consideradas**:
  - *Registrar solo la generación*: insuficiente para FR-032.
  - *Descargar desde el backend para poder auditar*: rechazada por R25.
  - *Guardar el archivo exportado*: rechazado por FR-019 y por privacidad.

## R31. Experiencia de reportes en el frontend

- **Decisión**: la pantalla `Reportes.jsx` mantiene el formulario de rango de fechas y cliente, y se
  organiza en tres secciones: **Reporte financiero** (solo administrador), **Reporte de accesos**
  (solo administrador) y **Clientes vencidos** (administrador y recepcionista). Cada sección muestra
  sus filtros activos, sus totales, una tabla o un mensaje de estado vacío, y botones **Exportar
  CSV** y **Exportar PDF**. Los botones se deshabilitan mientras hay una exportación en curso para
  evitar descargas duplicadas. El reporte de vencidos se navega desde `/reports` para el
  administrador y desde un acceso visible para el recepcionista; el backend valida el rol en todos
  los casos.
- **Justificación**: cumple FR-011 a FR-020 y FR-034 a FR-039 con una sola pantalla coherente, sin
  agregar un router nuevo ni un módulo de navegación distinto. El estado vacío y el bloqueo de
  exportación cubren los casos límite del spec.
- **Alternativas consideradas**:
  - *Una página por reporte*: rechazada por fragmentar la experiencia y duplicar filtros.
  - *Ocultar el módulo al recepcionista*: se mantiene la ocultación de reportes financieros, pero el
    reporte de vencidos debe ser accesible para su rol; la seguridad real está en el backend.

## R32. Formato de archivos exportados

- **Decisión**: el CSV usa UTF-8 con BOM, separador `;`, cabecera en español y una sección de
  metadatos (título, rango, filtros, totales) antes de las filas. El PDF (impresión) usa el mismo
  contenido visible: encabezado "GymAccess", título del reporte, rango de fechas, filtros, totales y
  tablas. Los nombres de archivo son
  `reporte-financiero-YYYY-MM-DD-YYYY-MM-DD.csv`,
  `reporte-accesos-YYYY-MM-DD-YYYY-MM-DD.csv` y
  `reporte-clientes-vencidos-YYYY-MM-DD-YYYY-MM-DD.csv` (o `sin-filtro` cuando no hay rango).
  Ningún archivo incluye credenciales, tokens, rutas internas ni descriptores faciales.
- **Justificación**: FR-017 a FR-020 y SC-006, SC-007 y SC-014. El BOM y el separador `;` hacen que
  Excel en configuración regional española abra el archivo sin pasos extra.
- **Alternativas consideradas**:
  - *CSV con coma*: rechazada porque Excel en español suele interpretar mal los decimales y las
    columnas.
  - *Incluir el descriptor facial o el hash de la contraseña*: prohibido por la constitución.

## R33. Preparación del entorno para despliegue

- **Decisión**: se mantienen `.env.example` en la raíz y en `backend/` sin secretos reales; `.env` y
  sus variantes están en `.gitignore`. La compilación del frontend se valida con `npm run build` y el
  arranque del backend con `npm start` usando variables de entorno. Se documenta `NODE_ENV` y se
  agrega una variable opcional `CORS_ORIGIN` para restringir el origen en producción; si no se
  define, se conserva el comportamiento actual de desarrollo. No se agregan dependencias.
- **Justificación**: FR-027 a FR-029 y SC-011. La aplicación ya carga `.env` desde `backend/.env` o
  la raíz; la validación de variables obligatorias ya existe en `config/entorno.js`. Restringir CORS
  en producción evita exponer la API a cualquier origen sin afectar la demostración local.
- **Alternativas consideradas**:
  - *Nuevo archivo `.env.production` versionado*: rechazado porque puede filtrar secretos.
  - *Servir el frontend desde Express*: fuera del alcance; la demostración usa Vite y un servidor
    estático separado si hiciera falta.

## R34. Estrategia de pruebas del sprint

- **Decisión**: pruebas de **integración** con `vitest` + `supertest` para:
  - permisos por rol en cada endpoint (401/403);
  - validación de fechas y filtros;
  - sumas y desgloses del reporte financiero (solo completados);
  - totales, franjas horarias, resultados y motivos del reporte de accesos;
  - alertas que incluyen exactamente 0–5 días y excluyen vencidas/suspendidas;
  - reporte de clientes vencidos (una fila por cliente, sin adeudos, sin clientes vigentes);
  - auditoría de generación y exportación.
  Pruebas de **componentes** con React Testing Library para el estado vacío, los filtros, los botones
  de exportación y las alertas. Validación manual de rendimiento y despliegue en
  [quickstart.md](./quickstart.md).
- **Justificación**: principio X de la constitución y consistencia con los sprints previos. Las
  reglas de reportes son deterministas y verificables contra MySQL real.
- **Alternativas consideradas**:
  - *Solo pruebas manuales*: rechazado por la constitución.
  - *Mocks de base de datos*: rechazados para las pruebas de integración porque se quiere verificar el
    comportamiento real de MySQL y de los índices.

## R35. Fechas, zona horaria y rangos inclusivos

- **Decisión**: los filtros se reciben como `YYYY-MM-DD` y se validan con patrón y fecha real. El
  rango es **inclusivo en ambos extremos**: las consultas usan
  `fecha >= inicio AND fecha < DATE_ADD(fin, INTERVAL 1 DAY)` para columnas `DATETIME` y
  `fecha_fin BETWEEN ...` para columnas `DATE`. La fecha de hoy se calcula con la hora local del
  servidor (`CURDATE()`/`hoyIso()`), igual que en los sprints anteriores. Si no se envía rango en el
  reporte de vencidos, se incluyen todos los clientes vencidos y los clientes sin membresía.
- **Justificación**: evita perder registros del último día y mantiene consistencia con
  `utils/fechas.js` y con los reportes ya implementados. Los valores se parametrizan siempre; no se
  concatena entrada del usuario en el SQL.
- **Alternativas consideradas**:
  - *Rango exclusivo en el fin*: rechazado porque el usuario espera incluir el día final.
  - *Zona UTC fija*: rechazada porque el gimnasio opera en hora local y la demostración es local.

---

## Decisiones de la especificación resueltas

| Pregunta abierta | Decisión |
|------------------|----------|
| ¿PDF en frontend o backend? | Frontend con `window.print()` y estilos de impresión (R25). |
| ¿Horas pico por hora o por turno? | Franjas de una hora con `HOUR(fecha_hora)` (spec, R26). |
| ¿Qué pagos suman al total? | Solo `estado = 'completado'` (spec, R26). |
| ¿Cómo se define un cliente vencido? | Sin membresía activa vigente; una fila con la vencida más reciente (R27). |
| ¿Cómo se filtra por documento? | `buscar` sobre nombre, apellido, correo e `idCliente`; no existe columna `documento` (R27). |
| ¿Cómo se audita una exportación hecha en el navegador? | Evento `POST /api/reports/exports` (R30). |

## Ítems que permanecen diferidos (no bloquean este sprint)

| Ítem | Motivo del diferimiento |
|------|--------------------------|
| Envío de correos, SMS o WhatsApp | Fuera de alcance explícito del Sprint 4. |
| Reportes programados o envío automático | Fuera del MVP. |
| Data warehouse o inteligencia de negocio avanzada | Fuera del MVP. |
| Cálculo de adeudos o cobranza | Excluido por el spec y por el alcance del sprint. |
| Búsqueda vectorial de rostros | Complejidad y dependencia innecesarias para el volumen local. |
| Servir el frontend desde Express | La demostración usa Vite y un servidor estático si se requiere. |
