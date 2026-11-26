# Modelo de datos: Consulta de pagos y adeudos

**Rama**: `005-consulta-pagos-adeudos` | **Fecha**: 2026-11-20 | **Plan**:
[plan.md](./plan.md)

Este documento describe las entidades que intervienen en la consulta, tal como existen hoy en la
base de datos. **No se crean tablas, columnas ni migraciones nuevas** y esta funcionalidad no
escribe en ninguna de las entidades: solo lee `pagos` y los datos de contexto necesarios para
presentar los resultados.

## 1. Entidades

### 1.1 `pagos` (fuente principal)

Definida en `database/migrations/001_crear_estructura.sql`, con índices agregados por las
migraciones `004_sprint4_optimizacion_reportes.sql` y `006_sprint4_indices_compuestos.sql`.

| Columna | Tipo | Restricción / índice | Uso en esta funcionalidad |
|---------|------|----------------------|---------------------------|
| `id_pago` | `INT UNSIGNED` | `PRIMARY KEY`, `AUTO_INCREMENT` | Identificador devuelto como `id`. |
| `id_cliente` | `INT UNSIGNED` | `NOT NULL`, `FK → clientes.id_cliente`, `ix_pagos_cliente` | Filtro por cliente y clave de agrupación de adeudos. |
| `id_membresia` | `INT UNSIGNED` | `NULL`, `FK → membresias.id_membresia` | Se devuelve como contexto; no filtra ni participa en el adeudo. |
| `monto` | `DECIMAL(10, 2)` | `NOT NULL` | Se muestra en el historial y se suma para el adeudo. |
| `fecha_pago` | `DATETIME` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP`, `idx_fecha_pago` | Filtro por rango inclusivo y orden descendente. |
| `metodo_pago` | `VARCHAR(50)` | `NOT NULL`, `idx_metodo_pago` | Solo se devuelve; no hay filtro por método en esta funcionalidad. |
| `estado` | `ENUM('pendiente', 'completado', 'cancelado')` | `NOT NULL`, `DEFAULT 'completado'`, `idx_pagos_estado_fecha` | Filtro opcional y regla de adeudo: solo `pendiente` suma. |

Reglas sobre `pagos`:

- El historial es inmutable aquí: no hay `INSERT`, `UPDATE` ni `DELETE`.
- Un pago con `id_membresia = NULL` es válido; aparece en el historial y cuenta como adeudo si su
  estado es `pendiente`.
- Los rangos de fechas son inclusivos en ambos extremos y se aplican sobre `fecha_pago`.
- El orden por defecto es `fecha_pago DESC, id_pago DESC`, para que el desempate sea determinista.
- Los totales de adeudos se calculan en el backend con `COALESCE(SUM(monto), 0)` y se entregan como
  número con dos decimales.

### 1.2 `clientes`

| Columna | Tipo | Restricción | Uso en esta funcionalidad |
|---------|------|-------------|---------------------------|
| `id_cliente` | `INT UNSIGNED` | `PRIMARY KEY`, `AUTO_INCREMENT` | Relaciona el pago con su dueño. |
| `nombre` | `VARCHAR(100)` | `NOT NULL` | Nombre mostrado en adeudos generales. |
| `apellido` | `VARCHAR(100)` | `NOT NULL` | Apellido mostrado en adeudos generales. |
| `correo` | `VARCHAR(150)` | `NOT NULL`, `UNIQUE (uq_clientes_correo)` | Resuelve el cliente desde el correo del JWT. |
| `telefono`, `direccion` | `VARCHAR` | `NULL` | No se devuelven en esta funcionalidad. |
| `fecha_registro` | `DATETIME` | `DEFAULT CURRENT_TIMESTAMP` | No se devuelve en esta funcionalidad. |
| `estado` | `ENUM('activo', 'inactivo')` | `DEFAULT 'activo'` | No filtra los pagos: el historial se consulta por cliente, no por estado del cliente. |

El resumen expuesto en adeudos contiene solo `id`, `nombre`, `apellido` y `correo`.

### 1.3 `usuarios`

| Columna | Tipo | Uso en esta funcionalidad |
|---------|------|---------------------------|
| `id_usuario` | `INT UNSIGNED` | Identifica al usuario autenticado; no se expone. |
| `correo` | `VARCHAR(150)` | Viaja en el JWT (`req.usuario.correo`) y resuelve al cliente. |
| `rol` | `ENUM(...)` | Viaja en el JWT (`req.usuario.rol`) y determina los endpoints permitidos. |
| `password`, `nombre`, `estado` | — | No se leen ni se devuelven en esta funcionalidad. |

No se agrega `id_cliente` al JWT: la relación usuario-cliente se resuelve por correo, igual que en
los endpoints `/yo` ya implementados.

### 1.4 `membresias` y `tipos_membresia`

Aparecen solo como contexto del pago (`idMembresia`). No intervienen en el cálculo de adeudos ni en
los filtros de esta funcionalidad. No se modifica su esquema ni su contenido.

## 2. Relaciones

- `clientes` 1 → N `pagos`, mediante `pagos.id_cliente`. Soporta el historial por cliente y la
  agrupación de adeudos.
- `membresias` 1 → N `pagos`, mediante `pagos.id_membresia` (opcional).
- `tipos_membresia` 1 → N `membresias`; solo contexto indirecto.
- `usuarios` ↔ `clientes` por coincidencia de `correo`. Es una convención del proyecto, no una
  llave foránea; se aplica únicamente a solicitudes con rol `cliente`.

## 3. Reglas de validación de la consulta

### 3.1 Parámetros de `GET /api/pagos` y `GET /api/pagos/mios`

| Parámetro | Tipo | Valor por defecto | Regla |
|-----------|------|-------------------|-------|
| `fechaInicio` | `YYYY-MM-DD` | Sin filtro | Debe ser una fecha válida y no posterior a `fechaFin`. |
| `fechaFin` | `YYYY-MM-DD` | Sin filtro | Debe ser una fecha válida; el rango incluye todo ese día. |
| `estado` | Texto | Sin filtro | Debe ser `pendiente`, `completado` o `cancelado`. |
| `idCliente` | Parámetro ajeno | Sin filtro | Solo se aplica en `/api/pagos`; en `/mios` se ignora siempre. |
| `limite` | Entero | `50` | Debe estar entre 1 y 200. |
| `offset` | Entero | `0` | Debe ser mayor o igual que cero. |

### 3.2 Parámetros de `GET /api/pagos/adeudos`

| Parámetro | Tipo | Valor por defecto | Regla |
|-----------|------|-------------------|-------|
| `idCliente` | Entero positivo | Todos los clientes | Filtra la agrupación a un solo cliente. |
| `limite` | Entero | `50` | Debe estar entre 1 y 200; pagina los grupos de clientes. |
| `offset` | Entero | `0` | Debe ser mayor o igual que cero. |

`GET /api/pagos/adeudos/mios` no acepta filtros de cliente: resuelve al cliente por el correo del
JWT. Cualquier `idCliente` que se envíe se ignora y no produce `400`.

### 3.3 Reglas comunes

- Un parámetro inválido produce `400` con `{ "mensaje", "codigo": "VALIDACION", "errores" }` y la
  consulta no llega a ejecutarse.
- `fechaInicio` y `fechaFin` se transforman a `[inicio 00:00:00, fin+1 día 00:00:00)` para
  comparar directamente `fecha_pago` y conservar el uso de `idx_fecha_pago`.
- `idCliente` se valida siempre; en rutas `/mios`, un valor válido distinto al del token no altera
  el resultado.
- La respuesta incluye el `total` general de coincidencias, calculado con `COUNT(*)` sobre los
  mismos filtros y sin aplicar `limite` ni `offset`.

## 4. Formatos de salida

- **Pago**: `presentarPago` devuelve `id`, `idCliente`, `idMembresia`, `monto` (número),
  `fechaPago` (ISO 8601), `metodoPago` y `estado`. Se reutiliza en historial y en el detalle de
  adeudos.
- **Cliente resumido**: `{ id, nombre, apellido, correo }`, construido con una función nueva de
  `cliente.presentador.js`.
- **Adeudo**: `{ cliente, totalAdeudado, pagos }`. Sin pagos pendientes, `totalAdeudado` es `0` y
  `pagos` es `[]`.
- **Lista paginada de pagos**: `{ pagos, total, montoTotal, limite, offset, mensaje? }`.
- **Lista paginada de adeudos**: `{ adeudos, total, limite, offset, mensaje? }`.
- **Adeudo propio**: `{ cliente, totalAdeudado, pagos, mensaje? }`.

El `mensaje` aparece solo cuando la respuesta está vacía y usa el texto definido en la spec:
"No hay pagos para los filtros seleccionados." o "No hay adeudos registrados.".

## 5. Transiciones de estado

No hay transiciones en esta funcionalidad. Los únicos estados que se interpretan son los de
`pagos.estado`: `pendiente` (cuenta como adeudo), `completado` y `cancelado` (no cuentan). Los
pagos no cambian de estado aquí; el registro y la modificación de estados quedan fuera del alcance.
