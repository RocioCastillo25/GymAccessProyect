# Investigación: Consulta de pagos y adeudos

**Rama**: `005-consulta-pagos-adeudos` | **Fecha**: 2026-11-20 | **Plan**:
[plan.md](./plan.md)

Documento de la Fase 0 de `/speckit.plan`. Cierra las cuatro decisiones aprobadas en
`/speckit.clarify` y las dudas técnicas derivadas de ellas. Cada entrada sigue el formato
**Decisión**, **Justificación** y **Alternativas consideradas**. La numeración continúa la serie del
proyecto: el Sprint 4 terminó en R35, por lo que esta funcionalidad comienza en R36.

No quedan marcadores `NEEDS CLARIFICATION`.

---

## R36. Regla de cálculo de adeudos

- **Decisión**: el adeudo de un cliente es la suma de los montos de sus pagos con estado
  `pendiente`. Los pagos `completados` y `cancelados` no cuentan. Se usa
  `COALESCE(SUM(monto), 0)` sobre `pagos` y se devuelve como número con dos decimales. Un pago
  pendiente sin membresía asociada sí cuenta.
- **Justificación**: `pagos.estado` ya existe y es la fuente directa del compromiso pendiente; la
  regla es fácil de probar y no depende del catálogo de tipos de membresía ni de supuestos sobre
  pagos parciales. Cumple FR-011 y SC-004.
- **Alternativas consideradas**:
  - *Precio del tipo de membresía menos pagos completados*: rechazada porque inferiría montos desde
    `tipos_membresia`, fallaría cuando el pago no tiene membresía y no respeta el historial real.
  - *Incluir pagos cancelados*: rechazada porque un pago cancelado no representa una deuda vigente.
  - *Calcular el adeudo en el frontend*: rechazada porque la regla de negocio debe vivir en el
    backend y porque el frontend no puede consultar MySQL.

## R37. Identidad del cliente autenticado

- **Decisión**: para `/api/pagos/mios` y `/api/pagos/adeudos/mios`, el backend toma
  `req.usuario.correo` del JWT, llama a `clienteModelo.buscarPorCorreo(correo)` y usa el
  `id_cliente` resultante internamente. Si no hay cliente asociado, responde `404` con
  "No se encontró el cliente asociado a la sesión.".
- **Justificación**: reproduce el patrón ya aprobado en `/clientes/yo`, `/membresias/yo` y
  `/accesos/yo`, evita tocar el payload del JWT y mantiene la autorización en el backend. Cumple
  FR-002, FR-006, FR-010 y SC-002.
- **Alternativas consideradas**:
  - *Agregar `id_cliente` al JWT*: rechazada porque cambiaría el contrato de autenticación,
    invalidaría tokens emitidos previamente y duplicaría un dato que ya se puede resolver.
  - *Aceptar `idCliente` en la consulta y validarlo contra el usuario*: rechazada porque agrega una
    superficie de ataque innecesaria y permite conflictos entre parámetros y token.

## R38. Permisos por rol

- **Decisión**:
  - `GET /api/pagos` y `GET /api/pagos/adeudos`: `autorizar('administrador', 'recepcionista')`.
  - `GET /api/pagos/mios` y `GET /api/pagos/adeudos/mios`: `autorizar('cliente')`.
  - Sin token válido: `401`. Entrenador o cualquier otro rol: `403`, antes de ejecutar consulta.
- **Justificación**: la constitución da al administrador y al recepcionista acceso a pagos, y al
  cliente solo a su información; el entrenador no debe ver información financiera. La decisión
  coincide con la respuesta de `/speckit.clarify` y con FR-005, SC-003 y SC-008.
- **Alternativas consideradas**:
  - *Reservar la consulta general solo al administrador*: rechazada por la decisión aprobada; el
    recepcionista necesita el historial para dar seguimiento a los pagos que registra.
  - *Ocultar botones en la interfaz como único control*: rechazada porque la constitución exige
    validar permisos en el backend.

## R39. Paginación y forma de la respuesta

- **Decisión**: todas las consultas usan `limite` y `offset`. `limite` vale 50 por defecto, admite
  hasta 200 y `offset` vale 0 por defecto. Cada respuesta incluye `total` (cantidad general de
  registros que cumplen los filtros), `limite` y `offset` para construir la siguiente página. Las
  respuestas de historial incluyen además `montoTotal`, suma de los montos de la página devuelta.
  En adeudos generales se pagina la lista de clientes agrupados; en adeudos propios no hay paginación
  porque la respuesta corresponde a un solo cliente.
- **Justificación**: evita transferir listas extensas, mantiene predecible el tamaño de la respuesta
  y permite probar la paginación con datos de demostración. Cumple FR-003, FR-008, SC-001 y SC-006.
- **Alternativas consideradas**:
  - *Sin paginación*: rechazada porque con 10,000 pagos la respuesta sería extensa y lenta.
  - *Paginación por cursor con `id_pago`*: rechazada porque agrega complejidad innecesaria y el
    caso de uso no requiere navegación bidireccional eficiente.
  - *Limitar solo en el frontend*: rechazada porque la base de datos seguiría enviando todas las
    filas y no se cumpliría el objetivo de rendimiento.

## R40. Validación de filtros y rangos de fecha

- **Decisión**: los parámetros admitidos se validan en un nuevo
  `backend/src/validators/pagoConsulta.validator.js`:
  - `fechaInicio` y `fechaFin`: cadenas `YYYY-MM-DD` válidas; si `fechaInicio` es posterior a
    `fechaFin`, se rechaza con `400`.
  - `estado`: uno de `pendiente`, `completado` o `cancelado`, con `validarEstadoPago`.
  - `idCliente`: entero positivo, con `validarId`.
  - `limite`: entero de 1 a 200; `offset`: entero mayor o igual que cero.
  - El rango es inclusivo: se convierte a `[fechaInicio 00:00:00, fechaFin + 1 día 00:00:00)` con
    `sumarDias`, de modo que la comparación use directamente `fecha_pago` y no `DATE(fecha_pago)`.
  - En las rutas `/mios`, cualquier parámetro `idCliente` se ignora; la identidad siempre viene del
    token y ese parámetro nunca se valida ni modifica la consulta.
  - Los errores se agrupan en `errores: [{ campo, error }]` con `errorValidacion`.
- **Justificación**: centraliza la validación, reutiliza funciones existentes de
  `comunes.validator.js` y conserva el uso del índice `idx_fecha_pago`. Cumple FR-007 y los casos
  límite de la especificación.
- **Alternativas consideradas**:
  - *Comparar con `DATE(fecha_pago) BETWEEN`*: rechazada porque la función sobre la columna impide
    aprovechar el índice.
  - *Aceptar cualquier cadena de fecha y dejar que MySQL la interprete*: rechazada porque produciría
    resultados ambiguos y mensajes de error poco claros.
  - *Ignorar `idCliente` sin validarlo en las rutas propias*: rechazada porque la especificación
    exige `400` para valores no numéricos o no positivos.

## R41. Estructura de la respuesta de adeudos

- **Decisión**: `GET /api/pagos/adeudos` agrupa en el backend por `id_cliente` y devuelve
  `{ adeudos, total, limite, offset }`. Cada elemento contiene
  `{ cliente, totalAdeudado, pagos }`, donde `cliente` es un resumen con `id`, `nombre`, `apellido`
  y `correo`, y `pagos` usa `presentarPago`. `GET /api/pagos/adeudos/mios` devuelve un único objeto
  `{ cliente, totalAdeudado, pagos }`. Sin adeudos, `totalAdeudado` es `0`, `pagos` está vacío y se
  incluye "No hay adeudos registrados.".
- **Justificación**: cumple FR-012 y FR-013 entregando cliente, total y detalle en una sola
  respuesta; el resumen de cliente evita exponer teléfono, dirección o fecha de registro sin
  necesidad. El detalle se compone con el presentador ya existente, por lo que FR-004 se aplica
  también a los adeudos.
- **Alternativas consideradas**:
  - *Devolver una fila por pago y agrupar en el frontend*: rechazada porque dispersa la regla de
    negocio y obligaría a transferir más datos.
  - *Devolver solo totales sin detalle*: rechazada porque FR-012 exige el detalle de los pagos que
    componen el adeudo.
  - *Reutilizar `presentarCliente` completo*: rechazada porque incluiría datos personales que esta
    consulta no necesita.

## R42. Índices y migraciones

- **Decisión**: no se agrega ninguna migración SQL. El filtro por cliente usa `ix_pagos_cliente`,
  el rango de fechas usa `idx_fecha_pago`, y el filtro por estado combinado con fecha usa
  `idx_pagos_estado_fecha`. La agrupación de adeudos filtra primero por `estado = 'pendiente'`
  antes de agrupar.
- **Justificación**: los índices ya están aplicados por las migraciones 001, 004 y 006 y cubren los
  patrones de consulta previstos; agregar otro índice incrementaría el costo de escritura de pagos
  sin beneficio demostrado.
- **Alternativas consideradas**:
  - *Nuevo índice compuesto `(id_cliente, estado, fecha_pago)`*: rechazada porque no hay evidencia
    de necesidad con el volumen objetivo y la constitución prohíbe cambios innecesarios.
  - *Modificar la migración 001*: rechazada porque los scripts aplicados no se reescriben; cualquier
    cambio debería ser una migración numerada nueva.

## R43. Dependencias y estrategia de pruebas

- **Decisión**: no se instalan dependencias. Se agregan pruebas de integración en
  `backend/tests/integration/pagosConsulta.test.js` con `vitest` + `supertest` y los helpers
  `usuarioYToken` y `cerrarPool`; una prueba unitaria del validador en
  `backend/tests/unit/pagoConsulta.validator.test.js`; y pruebas de componentes en
  `frontend/src/tests/` con React Testing Library y `servidorFalso.js`.
- **Justificación**: las herramientas ya están configuradas y permiten cubrir los tres escenarios
  de usuario, permisos, estados vacíos y paginación sin ampliar el stack. Cumple el principio X de
  la constitución y SC-008.
- **Alternativas consideradas**:
  - *Nueva librería de pruebas o de UI*: rechazada por ser una dependencia innecesaria.
  - *Solo prueba manual en navegador*: rechazada porque no verificaría reglas de negocio ni
    autorización en el backend.
