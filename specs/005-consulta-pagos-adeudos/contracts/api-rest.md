# Contrato de la API REST: Consulta de pagos y adeudos

**Rama**: `005-consulta-pagos-adeudos` | **Fecha**: 2026-11-20 | **Plan**:
[../plan.md](../plan.md)

Prefijo base: `/api`. Todas las respuestas son JSON (`Content-Type: application/json`). Todas las
rutas de este documento requieren `Authorization: Bearer <token>`; los roles se validan en el
backend mediante los middlewares `autenticar` y `autorizar`, nunca solo en la interfaz.

Formato de errores: ver [formato-errores.md](./formato-errores.md). Estructuras de datos: ver
[../data-model.md](../data-model.md).

## 1. Resumen de endpoints

| Método y ruta | Acción | Roles | Éxito |
|---------------|--------|-------|-------|
| `GET /api/pagos` | Historial general de pagos | `administrador`, `recepcionista` | `200` |
| `GET /api/pagos/mios` | Historial del cliente autenticado | `cliente` | `200` |
| `GET /api/pagos/adeudos` | Adeudos agrupados por cliente | `administrador`, `recepcionista` | `200` |
| `GET /api/pagos/adeudos/mios` | Adeudos del cliente autenticado | `cliente` | `200` |
| `POST /api/pagos` | Registro de pagos (contrato existente, sin cambios) | `administrador`, `recepcionista` | `201` |

Las rutas `/mios` resuelven al cliente por el `correo` del JWT. Un `idCliente` válido enviado en la
consulta no cambia el resultado; un valor no numérico o menor o igual a cero se rechaza con `400`.

## 2. `GET /api/pagos`

Devuelve el historial general con filtros opcionales y paginación (FR-001, FR-003, FR-004).

### Parámetros de consulta

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `fechaInicio` | `YYYY-MM-DD` | No | Inicio del rango inclusivo sobre `fecha_pago`. |
| `fechaFin` | `YYYY-MM-DD` | No | Fin del rango inclusivo sobre `fecha_pago`. |
| `idCliente` | Entero positivo | No | Filtra los pagos de un cliente. |
| `estado` | `pendiente` \| `completado` \| `cancelado` | No | Filtra por estado. |
| `limite` | Entero de 1 a 200 | No | Cantidad máxima de registros por página; por defecto `50`. |
| `offset` | Entero ≥ 0 | No | Registros a omitir; por defecto `0`. |

### Respuesta `200` con resultados

```json
{
  "pagos": [
    {
      "id": 12,
      "idCliente": 3,
      "idMembresia": 7,
      "monto": 350,
      "fechaPago": "2026-11-10T10:30:00.000Z",
      "metodoPago": "efectivo",
      "estado": "completado"
    }
  ],
  "total": 137,
  "montoTotal": 350,
  "limite": 50,
  "offset": 0
}
```

`total` es la cantidad general de pagos que cumplen los filtros, sin aplicar paginación.
`montoTotal` es la suma de `monto` de los pagos devueltos en esa página.

### Respuesta `200` sin resultados

```json
{
  "pagos": [],
  "total": 0,
  "montoTotal": 0,
  "limite": 50,
  "offset": 0,
  "mensaje": "No hay pagos para los filtros seleccionados."
}
```

### Errores

- `400`: filtros inválidos o `fechaInicio` posterior a `fechaFin`.
- `401`: sin token o token inválido.
- `403`: rol entrenador o cualquier rol distinto de administrador/recepcionista.

## 3. `GET /api/pagos/mios`

Devuelve el historial del cliente resuelto desde `req.usuario.correo` (FR-002, FR-006). Acepta
`fechaInicio`, `fechaFin`, `estado`, `limite` y `offset` con las mismas reglas del apartado 2.
Cualquier `idCliente` se ignora; si no hay cliente asociado al correo de la sesión, se
responde `404`.

La forma de la respuesta es idéntica a `GET /api/pagos`, incluidos `total`, `montoTotal`, `limite`,
`offset` y el mensaje de estado vacío.

### Errores

- `400`: filtros inválidos.
- `401`: sin token o token inválido.
- `403`: rol distinto de cliente.
- `404`: no existe un cliente con el correo del token.

## 4. `GET /api/pagos/adeudos`

Devuelve los adeudos agrupados por cliente. Solo cuentan los pagos con estado `pendiente` (FR-009,
FR-011, FR-012).

### Parámetros de consulta

| Parámetro | Tipo | Obligatorio | Descripción |
|-----------|------|-------------|-------------|
| `idCliente` | Entero positivo | No | Limita la consulta a un cliente; sin él se incluyen todos. |
| `limite` | Entero de 1 a 200 | No | Cantidad máxima de clientes agrupados; por defecto `50`. |
| `offset` | Entero ≥ 0 | No | Grupos a omitir; por defecto `0`. |

### Respuesta `200` con resultados

```json
{
  "adeudos": [
    {
      "cliente": {
        "id": 3,
        "nombre": "Ana",
        "apellido": "Pérez",
        "correo": "ana@example.com"
      },
      "totalAdeudado": 350,
      "pagos": [
        {
          "id": 21,
          "idCliente": 3,
          "idMembresia": null,
          "monto": 350,
          "fechaPago": "2026-11-12T09:00:00.000Z",
          "metodoPago": "transferencia",
          "estado": "pendiente"
        }
      ]
    }
  ],
  "total": 8,
  "limite": 50,
  "offset": 0
}
```

`total` es la cantidad de clientes con al menos un pago pendiente, sin aplicar paginación. Los
pagos `completados` y `cancelados` nunca aparecen en `pagos` ni suman a `totalAdeudado`.

### Respuesta `200` sin resultados

```json
{
  "adeudos": [],
  "total": 0,
  "limite": 50,
  "offset": 0,
  "mensaje": "No hay adeudos registrados."
}
```

Un `idCliente` inexistente produce esta misma respuesta, sin revelar si el cliente existe.

### Errores

- `400`: `idCliente`, `limite` u `offset` inválidos.
- `401`: sin token o token inválido.
- `403`: rol no autorizado.

## 5. `GET /api/pagos/adeudos/mios`

Devuelve el adeudo del cliente autenticado, resuelto por el correo del JWT (FR-010, FR-011, FR-013).
No acepta filtros de cliente; un `idCliente` válido se ignora.

### Respuesta `200` con adeudos

```json
{
  "cliente": {
    "id": 3,
    "nombre": "Ana",
    "apellido": "Pérez",
    "correo": "ana@example.com"
  },
  "totalAdeudado": 350,
  "pagos": [
    {
      "id": 21,
      "idCliente": 3,
      "idMembresia": null,
      "monto": 350,
      "fechaPago": "2026-11-12T09:00:00.000Z",
      "metodoPago": "transferencia",
      "estado": "pendiente"
    }
  ]
}
```

### Respuesta `200` sin adeudos

```json
{
  "cliente": {
    "id": 3,
    "nombre": "Ana",
    "apellido": "Pérez",
    "correo": "ana@example.com"
  },
  "totalAdeudado": 0,
  "pagos": [],
  "mensaje": "No hay adeudos registrados."
}
```

### Errores

- `400`: filtros inválidos distintos de `idCliente`, si se enviaran.
- `401`: sin token o token inválido.
- `403`: rol distinto de cliente.
- `404`: no existe un cliente con el correo del token.

## 6. Reglas comunes

- Las respuestas satisfactorias usan `200`; la validación fallida usa `400`, la autenticación
  `401`, la autorización `403`, la ausencia del cliente asociado `404` y los fallos inesperados
  `500` o `503`.
- Los mensajes de error son claros y están en español; no incluyen stack traces, credenciales ni
  datos internos.
- El formato de cada pago lo define `presentarPago`: `id`, `idCliente`, `idMembresia`, `monto`,
  `fechaPago`, `metodoPago` y `estado`.
- El resumen de cliente contiene únicamente `id`, `nombre`, `apellido` y `correo`.
- `monto` y `totalAdeudado` se devuelven como números; `fechaPago` usa formato ISO 8601.
- El orden de los pagos es `fechaPago` descendente con desempate por `id`; el orden de los adeudos
  generales es `totalAdeudado` descendente con desempate por `id` de cliente.

## 7. Trazabilidad

| Requisito | Endpoint(s) |
|-----------|-------------|
| FR-001, FR-003, FR-004, FR-008 | `GET /api/pagos` |
| FR-002, FR-006 | `GET /api/pagos/mios` |
| FR-009, FR-011, FR-012 | `GET /api/pagos/adeudos` |
| FR-010, FR-011, FR-013 | `GET /api/pagos/adeudos/mios` |
| FR-005, FR-016, FR-019 | Todos los endpoints |
