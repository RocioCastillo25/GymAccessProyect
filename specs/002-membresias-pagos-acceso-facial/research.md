# Investigación: Sprint 2 - Membresías, pagos, reconocimiento facial y control de acceso

**Rama**: `002-membresias-pagos-acceso-facial` | **Fecha**: 2026-10-15 | **Plan**: [plan.md](./plan.md)

Documento de la Fase 0 de `/speckit.plan`. Resuelve todas las decisiones técnicas pendientes que
dejó la especificación y las "Decisiones Pendientes" de la constitución aplicables a este sprint.
Cada entrada sigue el formato: **Decisión**, **Justificación**, **Alternativas consideradas**.

---

## R1. Librería de reconocimiento facial

- **Decisión**: `@vladmandic/face-api` (fork mantenido de `face-api.js`, licencia **MIT**, basado en
  TensorFlow.js) ejecutándose en el **navegador**. Provide detección de rostro (TinyFaceDetector /
  SSD MobileNet), 68 puntos faciales y un descriptor facial de **128 dimensiones** por rostro.
- **Justificación**: es compatible con JavaScript y React, funciona 100 % en local (sin servicios
  externos ni nube), su licencia MIT permite su uso académico y genera descriptores numéricos
  comparables con distancia euclídea. Es la opción madura y documentada para reconocimiento facial
  en el navegador y no exige compilar dependencias nativas en el servidor.
- **Alternativas consideradas**:
  - *`face-api.js` original*: rechazado por su menor mantenimiento; su API es la misma que la del
    fork, por lo que migrar es trivial si hiciera falta.
  - *MediaPipe Tasks (Google, Apache-2.0)*: rechazado porque, aunque detecta rostro y puntos
    faciales, no ofrece un reconocimiento por embeddings tan directo para identificar personas
    registradas.
  - *Servicios en la nube (AWS Rekognition, Azure Face, etc.)*: rechazados por depender de
    servicios externos, por privacidad de datos biométricos y por el requisito de ejecución local
    de la constitución.

## R2. Ubicación del procesamiento facial

- **Decisión**: la **detección y la generación del descriptor** se ejecutan en el **frontend**
  (navegador); la **comparación**, el **umbral** y la **decisión de acceso** se ejecutan en el
  **backend**.
- **Justificación**: mantiene el backend ligero (sin TensorFlow ni builds nativos en Windows),
  cumple que la decisión de negocio (autorizar/rechazar) se tome en el backend (constitución II y
  V) y garantiza que los descriptores almacenados **nunca** se envíen al cliente. El descriptor
  capturado sí viaja al backend en la petición, pero el catálogo de descriptores permanece
  protegido.
- **Alternativas consideradas**:
  - *Procesamiento completo en el backend con `@tensorflow/tfjs-node`*: rechazado por peso,
    dependencias nativas y fragilidad de compilación en Windows.
  - *Comparación en el frontend*: rechazada porque la decisión de acceso no puede residir en el
    cliente (un atacante podría saltársela).

## R3. Almacenamiento y protección del descriptor facial

- **Decisión**: un único registro por cliente en la tabla `rostros`, con `descriptor_facial` de tipo
  `JSON` (arreglo de 128 números) y `UNIQUE(id_cliente)`. Se almacenan **solo descriptores**, nunca
  imágenes. El descriptor no se devuelve por ningún endpoint.
- **Justificación**: cumple FR-020 y SC-004; MySQL 8 soporta el tipo `JSON`; evita almacenar
  imágenes faciales (menor riesgo) y permite comparar con aritmética simple. La protección se apoya
  en restringir el acceso a la tabla al backend, no exponerla por la API y no incluirla en
  respuestas.
- **Alternativas consideradas**:
  - *`BLOB`/float32 binario*: rechazado por menor legibilidad y auditabilidad en un proyecto
    académico.
  - *Guardar imágenes faciales*: rechazado explícitamente por seguridad y por la spec.
  - *Varios descriptores por cliente*: innecesario para el MVP; puede reevaluarse si la precisión
    resulta insuficiente.

## R4. Umbral de coincidencia y número de intentos

- **Decisión**: comparación por **distancia euclídea** con **umbral 0.6** (valor recomendado por la
  librería para descriptores de 128‑D); **máximo 3 intentos** de captura por intento de acceso.
  Ambos valores se leen de variables de entorno (`FACIAL_UMBRAL`, `FACIAL_MAX_INTENTOS`) con esos
  valores por defecto.
- **Justificación**: 0.6 es el valor estándar que equilibra falsos positivos y negativos; hacerlo
  configurable permite ajustar la sensibilidad sin tocar código. Limitar los intentos evita ciclos
  infinitos de captura.
- **Alternativas consideradas**:
  - *Umbral más estricto (0.5)*: rechazado por aumentar rechazos legítimos por iluminación.
  - *Umbral más laxo (0.7)*: rechazado por aumentar el riesgo de falsos positivos.

## R5. Momento de cálculo del estado de la membresía

- **Decisión**: el estado **vencida** se calcula dinámicamente en el backend al consultar y al
  validar el acceso (si `estado = 'activa'` y `fecha_fin < hoy` → se trata como vencida);
  **suspendida** y **cancelada** se persisten explícitamente.
- **Justificación**: evita procesos programados (cron) y garantiza que la vigencia siempre refleje
  la fecha real, tanto en listados como en el control de acceso.
- **Alternativas consideradas**:
  - *Tarea programada que marque vencidas*: rechazada por complejidad e infraestructura extra.
  - *Calcular solo en la validación de acceso*: insuficiente para listados y consultas de estado.

## R6. Renovación de membresía

- **Decisión**: la renovación crea una **nueva fila** en `membresias` con
  `fecha_inicio = max(fecha_fin anterior, hoy)` y `fecha_fin = fecha_inicio + duración del tipo`; la
  membresía anterior se conserva.
- **Justificación**: conserva el historial (FR-037) y evita solapamientos de vigencia. Si la
  membresía anterior ya venció, la nueva comienza hoy; si sigue vigente, la nueva comienza al
  terminar la anterior.
- **Alternativas consideradas**:
  - *Actualizar la fila existente*: rechazado porque perdería el historial.
  - *Permitir solapamiento (inicio hoy siempre)*: rechazado por generar periodos duplicados.

## R7. Definición de adeudo

- **Decisión**: existe **adeudo** cuando una membresía está activa o vigente y **no** tiene al menos
  un pago con estado `completado` asociado. La consulta de adeudos se agrupa por cliente.
- **Justificación**: permite identificar clientes con membresía vigente pero sin pago registrado
  (FR-012, FR-015) sin manejar saldos parciales.
- **Alternativas consideradas**:
  - *Adeudo por saldo parcial*: fuera de alcance (no hay pagos parciales).
  - *Adeudo por membresía vencida sin renovar*: interpretación distinta; se documenta como consulta
    adicional si el equipo lo requiere.

## R8. Métodos de pago y pagos parciales

- **Decisión**: catálogo fijo `{ efectivo, tarjeta, transferencia }` validado en el backend; **sin
  pagos parciales** (un pago corresponde al monto completo del tipo). El método se almacena en
  `pagos.metodo_pago`.
- **Justificación**: acota el alcance del sprint, evita procesamiento con bancos o plataformas
  externas y mantiene la validación en el backend.
- **Alternativas consideradas**:
  - *Método de pago como texto libre*: rechazado por inconsistencia en las consultas.
  - *Pagos parciales y saldos*: fuera de alcance del MVP.

## R9. Registro y consulta de accesos

- **Decisión**: `POST /api/accesos/validar` recibe el descriptor capturado, identifica al cliente,
  valida la membresía y **siempre** registra un acceso (autorizado o rechazado) con su motivo. La
  consulta queda disponible para administrador, recepcionista y entrenador; el cliente solo ve sus
  propios accesos.
- **Justificación**: cumple FR-024 a FR-027 y las reglas RN-10/RN-11 (todo intento se registra y el
  rechazo guarda motivo).
- **Alternativas consideradas**:
  - *Registrar solo accesos autorizados*: rechazado por la constitución (todo intento se registra).
  - *Registrar el acceso desde el frontend*: rechazado; el registro y la decisión van en el backend.

## R10. Auditoría

- **Decisión**: tabla `auditoria` que registra, como mínimo, registro/modificación de tipos de
  membresía, asignación y renovación de membresías, registro de pagos, registro/actualización de
  rostros y validación de acceso, con `id_usuario`, `accion`, `modulo`, `fecha`, `resultado` y
  `descripcion`. Su consulta es exclusiva del administrador (`GET /api/auditoria`).
- **Justificación**: cumple FR-036 y el principio X; centraliza la trazabilidad de las acciones
  relevantes del sprint mediante un middleware reutilizable.
- **Alternativas consideradas**:
  - *Solo logs de consola*: rechazado por no ser consultable ni persistente.
  - *Auditoría en cada controlador*: rechazado por duplicación; se prefiere un middleware/servicio.

## R11. Cámara y captura

- **Decisión**: captura en el navegador con `navigator.mediaDevices.getUserMedia` (cámara frontal),
  un elemento `<video>` y un `<canvas>` para tomar el fotograma que se procesa con la librería; **no
  se persiste ninguna imagen**.
- **Justificación**: funciona en local, sin dependencias de captura adicionales y cumple con no
  almacenar imágenes.
- **Alternativas consideradas**:
  - *Carga de una imagen desde archivo*: menos práctica para el control de acceso; puede usarse como
    respaldo si no hay cámara.
  - *Cámara dedicada del gimnasio*: no disponible en el entorno de desarrollo.

## R12. Formato de errores y nuevos códigos

- **Decisión**: reutilizar el formato `{ mensaje, codigo, errores? }` del Sprint 1 y añadir códigos
  nuevos (`ROSTRO_NO_RECONOCIDO`, `MEMBRESIA_NO_VALIDA`, `ADEUDO`, `PAGO_INVALIDO`,
  `TIPO_MEMBRESIA_INVALIDO`, `ACCESO_RECHAZADO`, `ROSTRO_YA_REGISTRADO`) manteniendo el middleware
  centralizado.
- **Justificación**: consistencia con el Sprint 1 y FR-030; el frontend ya sabe interpretar
  `codigo`.
- **Alternativas consideradas**:
  - *Nuevo formato de errores*: rechazado por inconsistencia innecesaria.

## R13. Modelos y assets del reconocimiento facial

- **Decisión**: servir localmente los pesos del modelo facial (TinyFaceDetector, FaceLandmark68Net
  y FaceRecognitionNet) como archivos estáticos en `frontend/public/models/`, cargados por la
  librería en tiempo de ejecución; sin CDN.
- **Justificación**: permite el funcionamiento local/offline y evita dependencias de red en la
  demostración.
- **Alternativas consideradas**:
  - *Cargar el modelo desde un CDN*: rechazado por requerir internet y por privacidad.

## R14. Estrategia de pruebas del reconocimiento facial

- **Decisión**: pruebas **unitarias** de la lógica de comparación (distancia euclídea, umbral,
  selección del mejor candidato) con descriptores sintéticos; pruebas de **integración** de
  `POST /api/accesos/validar` enviando descriptores simulados (coincidencia válida, sin
  coincidencia, membresía vencida); y validación **E2E manual** con cámara en `quickstart.md`.
- **Justificación**: la captura real depende de cámara e iluminación, por lo que la lógica
  determinista se aísla y se prueba sin hardware; el E2E con cámara se documenta como validación
  manual.
- **Alternativas consideradas**:
  - *E2E automatizado con cámara*: inviable en el entorno de desarrollo.

---

## Ítems que permanecen diferidos (no bloquean este sprint)

| Ítem | Motivo del diferimiento |
|------|--------------------------|
| Reportes exportables y dashboard administrativo | Pertenecen al Sprint 3. |
| Gestión de entrenadores, rutinas y progreso | Pertenecen al Sprint 3. |
| Rate limiting del intento de acceso facial | Entorno local y académico; se evaluará si aparece abuso. |
| Cifrado en reposo del descriptor facial | Se mantiene la protección por acceso restringido y no exposición; el cifrado puede añadirse como mejora. |
| Métricas y tracing distribuido | Fuera del alcance del MVP. |
