# Contrato de la API REST: Sprint 2

**Rama**: `002-membresias-pagos-acceso-facial` | **Fecha**: 2026-10-15 | **Plan**: [plan.md](./plan.md)

Prefijo base: `/api`. Todas las respuestas son JSON (`Content-Type: application/json`). Las rutas
marcadas con 🔒 requieren `Authorization: Bearer <token>`; el middleware de autorización
(`[roles]`) se evalúa siempre en el backend (FR-028). Se mantienen los contratos del Sprint 1; este
documento **añade** los endpoints del Sprint 2.

Formato de errores: ver [formato-errores.md](./formato-errores.md). Flujo de identificación y
validación de acceso: ver [control-acceso.md](./control-acceso.md).

## 1. Tipos de membresía

| Método y ruta | Acción | Roles | Éxito |
|----------------|--------|-------|-------|
| GET `/api/tipos-membresia` | Lista de tipos | `administrador`, `recepcionista`, `entrenador` | `200` |
| GET `/api/tipos-membresia/:id` | Detalle de un tipo | `administrador`, `recepcionista`, `entrenador` | `200` / `404` |
| POST `/api/tipos-membresia` | Crea un tipo (FR-001) | `administrador` | `201` |
| PATCH `/api/tipos-membresia/:id` | Modifica nombre, descripción, duración o precio (FR-003) | `administrador` | `200` / `404` |
| PATCH `/api/tipos-membresia/:id/estado` | Activa o desactiva para nuevas asignaciones (FR-004) | `administrador` | `200` / `404` |

**Restricción de campos por rol (FR-002)**

| Rol | Campos recibidos |
|-----|------------------|
| `administrador`, `recepcionista` | `id`, `nombre`, `descripcion`, `duracion`, `precio`, `estado` |
| `entrenador` | Únicamente `id`, `nombre`, `duracion` (sin información financiera) |

Petición de creación:

```json
{ "nombre": "Mensual", "descripcion": "Acceso 30 días", "duracion": 30, "precio": 350.00 }
```

Respuesta `201`:

```json
{ "mensaje": "Tipo de membresía creado correctamente", "tipoMembresia": { "id": 1, "nombre": "Mensual", "descripcion": "Acceso 30 días", "duracion": 30, "precio": 350.00, "estado": "activo" } }
```

| Código | Cuándo |
|--------|--------|
| `400` | `duracion <= 0`, `precio < 0`, nombre ausente o formato inválido (FR-004, FR-029) |
| `403` | Rol sin permiso (recepcionista o entrenador intentan crear/modificar) |
| `404` | `id` inexistente |
| `409` | Nombre de tipo ya registrado (si se opta por unicidad) |

## 2. Membresías

| Método y ruta | Acción | Roles | Éxito |
|----------------|--------|-------|-------|
| GET `/api/membresias` | Lista de membresías | `administrador`, `recepcionista` | `200` |
| GET `/api/membresias/:id` | Detalle de una membresía | `administrador`, `recepcionista` | `200` / `404` |
| GET `/api/membresias/yo` | Membresía propia y su vigencia (FR-009) | `cliente` | `200` / `404` |
| POST `/api/membresias` | Asigna una membresía a un cliente (FR-005, FR-006) | `administrador`, `recepcionista` | `201` |
| PATCH `/api/membresias/:id/estado` | Suspende o cancela una membresía (FR-007) | `administrador`, `recepcionista` | `200` / `404` |
| POST `/api/membresias/:id/renovar` | Renueva conservando historial (FR-008) | `administrador`, `recepcionista` | `201` |

Petición de asignación:

```json
{ "idCliente": 1, "idTipoMembresia": 2 }
```

Respuesta `201`:

```json
{ "mensaje": "Membresía asignada correctamente", "membresia": { "id": 5, "idCliente": 1, "idTipoMembresia": 2, "fechaInicio": "2026-10-15", "fechaFin": "2026-11-14", "estado": "activa" } }
```

Petición de renovación:

```json
{ "idTipoMembresia": 2 }
```

Respuesta `201`:

```json
{ "mensaje": "Membresía renovada correctamente", "membresia": { "id": 6, "idCliente": 1, "idTipoMembresia": 2, "fechaInicio": "2026-11-14", "fechaFin": "2026-12-14", "estado": "activa" } }
```

**El estado reportado (`activa`/`vencida`/`suspendida`/`cancelada`) se calcula en el backend**: si
la membresía está `activa` pero su `fechaFin` ya pasó, se reporta `vencida` (R5). Una membresía es
**vigente** si está `activa` y la fecha actual es menor o igual a `fechaFin`.

| Código | Cuándo |
|--------|--------|
| `400` | Faltan `idCliente`/`idTipoMembresia`, o el tipo está `inactivo` (FR-005) |
| `403` | `entrenador` o `cliente` intentan asignar, renovar o cambiar estado |
| `404` | Cliente o membresía inexistente; cliente sin membresía previa al renovar (FR-008 HU3 esc. 2) |
| `409` | Conflicto de renovación o asignación simultánea |

## 3. Pagos y adeudos

| Método y ruta | Acción | Roles | Éxito |
|----------------|--------|-------|-------|
| GET `/api/pagos` | Historial de pagos (FR-012) | `administrador` | `200` |
| GET `/api/pagos/:id` | Detalle de un pago | `administrador` | `200` / `404` |
| GET `/api/pagos/adeudos` | Clientes con membresía activa sin pago (FR-015) | `administrador` | `200` |
| GET `/api/pagos/yo` | Pagos y adeudos propios (FR-013) | `cliente` | `200` |
| POST `/api/pagos` | Registra un pago (FR-011) | `administrador`, `recepcionista` | `201` |

Petición de registro:

```json
{ "idCliente": 1, "idMembresia": 5, "monto": 350.00, "metodoPago": "efectivo", "estado": "completado" }
```

Respuesta `201`:

```json
{ "mensaje": "Pago registrado correctamente", "pago": { "id": 10, "idCliente": 1, "idMembresia": 5, "monto": 350.00, "fechaPago": "2026-10-15T10:30:00.000Z", "metodoPago": "efectivo", "estado": "completado" } }
```

**Catálogo de métodos (R8)**: `efectivo`, `tarjeta`, `transferencia`. Sin pagos parciales.

Respuesta de adeudos `200`:

```json
{ "adeudos": [ { "idCliente": 3, "nombre": "Ana", "apellido": "Ruiz", "idMembresia": 7, "fechaFin": "2026-11-01" } ] }
```

| Código | Cuándo |
|--------|--------|
| `400` | `monto <= 0` o ausente; `metodoPago` fuera del catálogo; estado inválido (FR-029) |
| `403` | `entrenador` o `cliente` intentan registrar o consultar pagos ajenos |
| `404` | Cliente inexistente o membresía inexistente/ajena (Casos límite) |
| `409` | Pago duplicado (mismo cliente, membresía, monto y momento) — se evita la corrupción del historial |

## 4. Rostros (información facial)

| Método y ruta | Acción | Roles | Éxito |
|----------------|--------|-------|-------|
| GET `/api/rostros/:idCliente` | Indica si el cliente tiene rostro registrado (sin descriptor) | `administrador`, `recepcionista` | `200` / `404` |
| POST `/api/rostros` | Registra información facial (FR-016, FR-017) | `administrador`, `recepcionista` | `201` |
| PUT `/api/rostros/:idCliente` | Actualiza la información facial existente (FR-017) | `administrador`, `recepcionista` | `200` / `404` |

Petición de registro (el descriptor se genera en el frontend, R1/R2):

```json
{ "idCliente": 1, "descriptorFacial": [0.0123, -0.0456, "... 128 valores ..."] }
```

Respuesta `201`:

```json
{ "mensaje": "Información facial registrada correctamente", "rostro": { "id": 1, "idCliente": 1, "fechaRegistro": "2026-10-15T10:35:00.000Z", "estado": "activo" } }
```

Respuesta de estado `200`:

```json
{ "idCliente": 1, "tieneRostro": true, "fechaRegistro": "2026-10-15T10:35:00.000Z" }
```

**Reglas del contrato**

1. El campo `descriptorFacial` **nunca** se incluye en ninguna respuesta (FR-020, SC-004).
2. `descriptorFacial` debe ser un arreglo numérico de 128 posiciones; otro formato → `400`.
3. Un segundo registro para el mismo cliente actualiza el existente vía `PUT` (un registro por
   cliente, R3).
3. Solo pueden registrarse rostros de clientes existentes (FR-017).

| Código | Cuándo |
|--------|--------|
| `400` | Cliente ausente o `descriptorFacial` con formato o longitud inválidos (FR-029) |
| `403` | `entrenador` o `cliente` intentan registrar/consultar rostros |
| `404` | Cliente inexistente (`ROSTRO_CLIENTE_NO_ENCONTRADO`) |
| `409` | Intento de crear un segundo rostro para un cliente que ya lo tiene (usar `PATCH`/`PUT`) |

## 4 bis. Identificación y validación de acceso

### POST `/api/accesos/validar` 🔒 `[administrador, recepcionista]`

Recibe el descriptor capturado por la cámara, identifica al cliente y valida su membresía; registra
siempre el intento. Detalle del algoritmo en [control-acceso.md](./control-acceso.md).

Petición:

```json
{ "descriptorFacial": [0.0123, -0.0456, "... 128 valores ..."], "tipo": "entrada" }
```

Respuesta `200` (autorizado):

```json
{
  "resultado": "autorizado",
  "cliente": { "id": 1, "nombre": "Luis", "apellido": "Pérez" },
  "membresia": { "id": 5, "estado": "activa", "fechaFin": "2026-11-14" },
  "acceso": { "id": 12, "fechaHora": "2026-10-15T11:00:00.000Z", "tipo": "entrada" }
}
```

Respuesta `200` (rechazado):

```json
{
  "resultado": "rechazado",
  "motivo": "La membresía está vencida.",
  "cliente": { "id": 1, "nombre": "Luis", "apellido": "Pérez" },
  "acceso": { "id": 13, "fechaHora": "2026-10-15T11:02:00.000Z", "tipo": "entrada" }
}
```

Cuando el rostro no coincide con ningún cliente (`cliente` es `null`):

```json
{ "resultado": "rechazado", "motivo": "Rostro no reconocido.", "cliente": null, "acceso": { "id": 14, "fechaHora": "2026-10-15T11:03:00.000Z", "tipo": "entrada" } }
```

**Reglas**

- El rechazo usa `200` con `resultado: "rechazado"` porque la validación se ejecutó correctamente;
  el motivo es de negocio, no un error HTTP. Los errores de entrada (descriptor malformado) sí
  devuelven `400`.
- La identificación facial **precede** a la validación de membresía (FR-021); la coincidencia por sí
  sola no autoriza (HU7 esc. 3).
- **Siempre** se registra un acceso, autorizado o rechazado, con su motivo (FR-024, SC-003).

| Código | Cuándo |
|--------|--------|
| `400` | `descriptorFacial` ausente, malformado o de longitud distinta de 128 (FR-029) |
| `401` | Sin token o token expirado |
| `403` | Rol distinto de `administrador`/`recepcionista` |
| `500` | MySQL no disponible (no se autoriza el acceso) |

## 4.1 Consulta de accesos

| Método y ruta | Acción | Roles | Éxito |
|----------------|--------|-------|-------|
| GET `/api/accesos` | Lista accesos autorizados y rechazados (FR-026) | `administrador`, `recepcionista`, `entrenador` | `200` |
| GET `/api/accesos/:id` | Detalle de un acceso | `administrador`, `recepcionista` | `200` / `404` |
| GET `/api/accesos/yo` | Historial propio (FR-027) | `cliente` | `200` |

Filtros admitidos en `GET /api/accesos`: `resultado` (autorizado/rechazado), `idCliente`,
`desde`, `hasta`. El `entrenador` recibe únicamente los campos operativos de asistencia
(`idCliente`, `fechaHora`, `tipo`, `resultado`) sin datos personales sensibles.

Respuesta `200`:

```json
{ "accesos": [ { "id": 12, "idCliente": 1, "cliente": "Luis Pérez", "fechaHora": "2026-10-15T11:00:00.000Z", "tipo": "entrada", "resultado": "autorizado", "motivoRechazo": null } ] }
```

## 5. Auditoría

| Método y ruta | Acción | Roles | Éxito |
|----------------|--------|-------|-------|
| GET `/api/auditoria` | Consulta de acciones registradas (FR-036) | `administrador` | `200` |

Filtros admitidos: `modulo`, `idUsuario`, `desde`, `hasta`, `resultado`.

Respuesta `200`:

```json
{ "auditoria": [ { "id": 30, "idUsuario": 1, "accion": "registrar_pago", "modulo": "pagos", "fecha": "2026-10-15T10:30:00.000Z", "resultado": "exito", "descripcion": "Pago #10 registrado para el cliente #1" } ] }
```

| Código | Cuándo |
|--------|--------|
| `403` | Rol distinto de `administrador` |

## 6. Reglas transversales del contrato

1. **Ninguna respuesta incluye `descriptorFacial`** ni otros datos biométricos (FR-020, SC-004).
2. Las rutas protegidas responden `401` sin token válido y `403` sin permiso para el rol
   (FR-028, SC-002); la verificación es en el backend.
3. Ninguna respuesta incluye `password` (se mantiene el contrato del Sprint 1).
4. Los montos se transfieren con dos decimales; los precios y el monto son validados en el backend
   (FR-029).
5. No existen endpoints de borrado para `pagos` ni `accesos`; el historial se conserva (FR-014,
   FR-025, FR-037).
6. Los errores siguen [formato-errores.md](./formato-errores.md) y nunca revelan información técnica
   interna (FR-030).
