# Contrato de API REST: Sprint 3 - Entrenadores, rutinas y dashboard

**Rama**: `003-entrenadores-rutinas-dashboard` | **Fecha**: 2026-10-15 | **Plan**: [plan.md](./plan.md)

API REST bajo el prefijo `/api`. Todas las respuestas usan `Content-Type: application/json`. Las
rutas requieren `Authorization: Bearer <token>` y su rol se valida en el backend con el middleware
`autorizar(...)` (FR-022). Se mantienen los contratos de los Sprints 1 y 2; este documento **añade**
los endpoints del Sprint 3. Formato de errores en [formato-errores.md](./formato-errores.md).

Convención de roles: `A` = administrador, `R` = recepcionista, `E` = entrenador, `C` = cliente.

## 1. Entrenadores

| Método | Ruta | Acción | Roles | Éxito |
|--------|------|--------|-------|-------|
| GET | `/api/entrenadores` | Lista entrenadores | A, R | `200` |
| GET | `/api/entrenadores/:id` | Detalle del entrenador | A, R | `200` / `404` |
| GET | `/api/entrenadores/yo` | Perfil del entrenador autenticado | E | `200` / `404` |
| POST | `/api/entrenadores` | Registra un entrenador (FR-001) | A | `201` |
| PATCH | `/api/entrenadores/:id` | Modifica especialidad o teléfono | A | `200` / `404` |
| PATCH | `/api/entrenadores/:id/estado` | Activa/desactiva (FR-002) | A | `200` / `404` |

Petición de creación:

```json
{ "idUsuario": 7, "especialidad": "Fuerza y acondicionamiento", "telefono": "555-1234" }
```

Respuesta `201`:

```json
{ "mensaje": "Entrenador registrado correctamente", "entrenador": { "id": 1, "idUsuario": 7, "nombre": "Carla Méndez", "especialidad": "Fuerza", "telefono": "555-1234", "estado": "activo" } }
```

| Código | Cuándo |
|--------|--------|
| `400` | Falta `idUsuario` o formato inválido (FR-023) |
| `403` | Rol distinto de `administrador` |
| `404` | `id_usuario` inexistente o entrenador inexistente |
| `409` | Usuario ya asociado a un entrenador (FR-003) o rol del usuario no es `entrenador` (FR-004) |

## 2. Asignaciones de entrenador

| Método | Ruta | Acción | Roles | Éxito |
|--------|------|--------|-------|-------|
| GET | `/api/asignaciones` | Lista asignaciones (filtros `idEntrenador`, `idCliente`, `estado`) | A, R | `200` |
| GET | `/api/asignaciones/:id` | Detalle de una asignación | A, R | `200` / `404` |
| GET | `/api/asignaciones/entrenador/:idEntrenador` | Clientes asignados a un entrenador (FR-008) | A, R | `200` |
| GET | `/api/asignaciones/yo` | Clientes asignados al entrenador autenticado | E | `200` |
| POST | `/api/asignaciones` | Asigna un entrenador a un cliente activo (FR-005) | A, R | `201` |
| PATCH | `/api/asignaciones/:id/estado` | Finaliza una asignación | A, R | `200` / `404` |

Petición de asignación:

```json
{ "idCliente": 3, "idEntrenador": 1, "esPrincipal": true }
```

Respuesta `201`:

```json
{ "mensaje": "Entrenador asignado correctamente", "asignacion": { "id": 7, "idCliente": 3, "idEntrenador": 1, "esPrincipal": true, "estado": "activa", "fechaAsignacion": "2026-10-15T12:00:00.000Z" } }
```

**Regla del entrenador principal (FR-006, R15)**: si `esPrincipal` es `true` y el cliente ya tiene un
entrenador principal activo, el servicio finaliza la asignación anterior y crea la nueva dentro de
una transacción; la base de datos lo garantiza con el índice único sobre la columna generada.

| Código | Cuándo |
|--------|--------|
| `400` | Faltan `idCliente`/`idEntrenador` o tipos inválidos (FR-023) |
| `403` | Entrenador o cliente intentan asignar |
| `404` | Cliente o entrenador inexistente |
| `409` | Cliente inactivo o entrenador inactivo (FR-007) |

## 3. Rutinas y ejercicios

| Método | Ruta | Acción | Roles | Éxito |
|--------|------|--------|-------|-------|
| GET | `/api/rutinas` | Lista rutinas (filtros `idCliente`, `idEntrenador`, `estado`) | A, R | `200` |
| GET | `/api/rutinas/:id` | Detalle de una rutina con sus ejercicios | A, R, E | `200` / `404` |
| GET | `/api/rutinas/cliente/:idCliente` | Rutinas de un cliente | A, R, E | `200` |
| GET | `/api/rutinas/yo` | Rutina vigente del cliente autenticado (FR-017) | C | `200` / `404` |
| POST | `/api/rutinas` | Crea una rutina con ejercicios (FR-009, FR-011) | E | `201` |
| PATCH | `/api/rutinas/:id` | Modifica nombre/descripción | E | `200` / `404` |
| PUT | `/api/rutinas/:id/ejercicios` | Reemplaza la lista de ejercicios de la rutina | E | `200` / `404` |

Petición de creación:

```json
{
  "idCliente": 3,
  "nombre": "Fuerza - 4 días",
  "descripcion": "Rutina de hipertrofia",
  "ejercicios": [
    { "nombre": "Sentadilla", "series": 4, "repeticiones": "8-10", "peso": "60 kg", "descanso": "90 s", "orden": 1 },
    { "nombre": "Press banca", "series": 4, "repeticiones": "10", "peso": "40 kg", "orden": 2 }
  ]
}
```

Respuesta `201`:

```json
{ "mensaje": "Rutina creada correctamente", "rutina": { "id": 12, "idCliente": 3, "idEntrenador": 1, "nombre": "Fuerza - 4 días", "descripcion": "Rutina de hipertrofia", "estado": "activa", "ejercicios": [ { "id": 40, "nombre": "Sentadilla", "series": 4, "repeticiones": "8-10", "peso": "60 kg", "descanso": "90 s", "orden": 1 } ] } }
```

| Código | Cuándo |
|--------|--------|
| `400` | Falta `idCliente` o `nombre`; ejercicio sin `nombre`; `series <= 0` (FR-023) |
| `403` | `administrador`, `recepcionista` o `cliente` intentan crear/editar (FR-012); entrenador gestionando un cliente que no es suyo (FR-012) |
| `404` | Cliente o rutina inexistentes; el cliente no tiene rutina vigente (`/rutinas/yo`) |
| `409` | El cliente no está asignado al entrenador autenticado (FR-012) |

## 3.1 Objetivos de entrenamiento

| Método | Ruta | Acción | Roles | Éxito |
|--------|------|--------|-------|-------|
| GET | `/api/objetivos` | Lista objetivos (filtros `idCliente`, `estado`) | A, R | `200` |
| GET | `/api/objetivos/cliente/:idCliente` | Objetivos de un cliente | A, R, E | `200` |
| GET | `/api/objetivos/yo` | Objetivos propios (FR-017) | C | `200` |
| POST | `/api/objetivos` | Crea un objetivo (FR-013) | E | `201` |
| PATCH | `/api/objetivos/:id/estado` | Marca cumplido/cancelado | E | `200` / `404` |

Petición:

```json
{ "idCliente": 3, "descripcion": "Reducir grasa corporal", "valorObjetivo": 12.0, "unidad": "porcentaje", "fechaObjetivo": "2026-12-31" }
```

Respuesta `201`:

```json
{ "mensaje": "Objetivo registrado correctamente", "objetivo": { "id": 5, "idCliente": 3, "idEntrenador": 1, "descripcion": "Reducir grasa corporal", "valorObjetivo": 12.0, "unidad": "porcentaje", "fechaObjetivo": "2026-12-31", "estado": "en_progreso" } }
```

| Código | Cuándo |
|--------|--------|
| `400` | Falta `idCliente` o `descripcion`; `valorObjetivo < 0` (FR-023) |
| `403` | Rol distinto de `entrenador`, o cliente no asignado al entrenador (FR-012) |
| `404` | Cliente inexistente o cliente sin asignación al entrenador |

## 3.1 bis. Progresos del cliente

| Método | Ruta | Acción | Roles | Éxito |
|--------|------|--------|-------|-------|
| GET | `/api/progresos` | Lista progresos (filtros `idCliente`, `idObjetivo`) | A, R | `200` |
| GET | `/api/progresos/cliente/:idCliente` | Progresos de un cliente en orden (FR-015) | A, R, E | `200` |
| GET | `/api/progresos/yo` | Progreso propio del cliente autenticado (FR-017) | C | `200` |
| POST | `/api/progresos` | Registra un progreso (FR-014) | E | `201` |

Petición:

```json
{ "idCliente": 3, "idObjetivo": 5, "valor": 15.5, "unidad": "porcentaje", "observaciones": "Primera medición" }
```

Respuesta `201`:

```json
{ "mensaje": "Progreso registrado correctamente", "progreso": { "id": 20, "idCliente": 3, "idEntrenador": 1, "idObjetivo": 5, "valor": 15.5, "unidad": "porcentaje", "observaciones": "Primera medición", "fechaRegistro": "2026-10-15T12:30:00.000Z" } }
```

| Código | Cuándo |
|--------|--------|
| `400` | Falta `idCliente` o `valor` (FR-023) |
| `403` | Rol distinto de `entrenador`, o cliente no asignado al entrenador (FR-012) |
| `404` | Cliente inexistente; objetivo inexistente o de otro cliente (FR-014) |

## 4. Dashboard administrativo

| Método | Ruta | Acción | Roles | Éxito |
|--------|------|--------|-------|-------|
| GET | `/api/dashboard` | Resumen general del gimnasio (FR-019) | A | `200` |
| GET | `/api/dashboard/personal` | Resumen operativo de personal y asignaciones | A, R | `200` |

Respuesta `200` de `/api/dashboard`:

```json
{
  "resumen": {
    "clientesActivos": 42,
    "clientesInactivos": 5,
    "entrenadoresActivos": 6,
    "clientesConEntrenador": 30,
    "clientesSinEntrenador": 12,
    "rutinasActivas": 28,
    "objetivosEnProgreso": 19,
    "membresiasActivas": 35,
    "membresiasVencidas": 7,
    "accesosRecientes": 58,
    "accesosRechazados": 9
  }
}
```

Respuesta `200` de `/api/dashboard/personal` (sin indicadores financieros ni reservados al
administrador, FR-020):

```json
{ "resumen": { "entrenadoresActivos": 6, "clientesAsignados": 30, "clientesSinEntrenador": 12 } }
```

| Código | Cuándo |
|--------|--------|
| `403` | Rol sin permiso (el recepcionista solo accede a `/api/dashboard/personal`) |
| `500` | Error inesperado al calcular los agregados |

## 5. Reglas transversales del contrato

1. Todas las rutas requieren token válido (`401` sin token) y rol autorizado (`403`) (FR-022).
2. El cliente solo accede a sus propios recursos (`/rutinas/yo`, `/objetivos` vía `/yo`,
   `/progresos/yo`) y nunca a datos de otros clientes (FR-018).
3. El entrenador solo gestiona rutinas, objetivos y progresos de clientes con asignación activa a
   su cargo; cualquier otro caso devuelve `403` (FR-012).
4. El `administrador` y el `recepcionista` no crean ni editan rutinas, objetivos ni progresos
   (FR-012, FR-016).
5. No existen endpoints de borrado para asignaciones, rutinas, objetivos ni progresos; el historial
   se conserva (FR-031).
6. Los errores siguen [formato-errores.md](./formato-errores.md) y nunca revelan información técnica
   interna (FR-024).
