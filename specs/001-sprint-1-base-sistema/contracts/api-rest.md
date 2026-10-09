# Contrato de la API REST: Sprint 1

**Rama**: `001-sprint-1-base-sistema` | **Fecha**: 2026-10-09 | **Plan**: [plan.md](./plan.md)

Prefijo base: `/api`. Todas las respuestas son JSON (`Content-Type: application/json`). Las rutas
marcadas con 🔒 requieren cabecera `Authorization: Bearer <token>`; el middleware de autorización
(`[roles]`) se evalúa siempre en el backend, nunca solo en la interfaz.

Formato de errores: ver [formato-errores.md](./formato-errores.md).

## 1. Autenticación

### POST `/api/auth/login`

Abre sesión con correo y contraseña (FR-001 a FR-006).

Petición:

```json
{ "correo": "admin@gimnasio.local", "password": "Secreta123" }
```

Respuesta `200`:

```json
{
  "token": "<jwt>",
  "expiraEn": "60m",
  "usuario": { "id": 1, "nombre": "Admin", "correo": "admin@gimnasio.local", "rol": "administrador", "estado": "activo" }
}
```

| Código | Cuándo |
|--------|--------|
| `400` | Faltan `correo` o `password`, o el formato no es válido |
| `401` | Credenciales incorrectas o usuario `inactivo` → mensaje genérico "Credenciales incorrectas", sin indicar si el correo existe (FR-005) |
| `500` | MySQL no disponible → error controlado sin detalles internos |

### GET `/api/auth/me` 🔒

Devuelve el usuario de la sesión actual.

- `200` → objeto del usuario (sin campo `password`).
- `401` → token ausente, expirado (60 min) o manipulado.

## 2. Usuarios (exclusivo del administrador: FR-007, FR-013)

| Método y ruta | Acción | Éxito |
|----------------|--------|-------|
| GET `/api/usuarios` 🔒 `[administrador]` | Lista de usuarios (nunca incluye `password`) | `200` |
| GET `/api/usuarios/:id` 🔒 `[administrador]` | Detalle de un usuario | `200` / `404` |
| POST `/api/usuarios` 🔒 `[administrador]` | Crea usuario con hash `bcrypt` (FR-011) | `201` |
| PATCH `/api/usuarios/:id` 🔒 `[administrador]` | Modifica nombre y/o correo | `200` / `404` |
| PATCH `/api/usuarios/:id/rol` 🔒 `[administrador]` | Asigna o cambia el rol (FR-009) | `200` / `400` / `404` |
| PATCH `/api/usuarios/:id/estado` 🔒 `[administrador]` | Activa o desactiva (FR-010) | `200` / `400` / `404` |
| PATCH `/api/usuarios/:id/password` 🔒 `[administrador]` | Restablece la contraseña (≥ 8 caracteres, hash `bcrypt`) | `200` / `400` / `404` |

Petición de creación:

```json
{ "nombre": "Ana", "correo": "ana@gimnasio.local", "password": "Secreta123", "rol": "recepcionista" }
```

Respuesta `201`:

```json
{ "mensaje": "Usuario creado correctamente", "usuario": { "id": 2, "nombre": "Ana", "correo": "ana@gimnasio.local", "rol": "recepcionista", "estado": "activo" } }
```

| Código | Cuándo |
|--------|--------|
| `400` | Rol inválido, correo con formato inválido o contraseña < 8 caracteres |
| `401` | Sin token o token expirado |
| `403` | Usuario autenticado sin rol `administrador` |
| `409` | Correo ya registrado en `usuarios` (FR-012) |

## 3. Clientes

| Método y ruta | Acción | Éxito |
|----------------|--------|-------|
| GET `/api/clientes` 🔒 `[administrador, recepcionista, entrenador]` | Lista de clientes | `200` |
| GET `/api/clientes/:id` 🔒 `[administrador, recepcionista]` | Detalle completo | `200` / `404` |
| GET `/api/clientes/yo` 🔒 `[cliente]` | Información propia (FR-017) | `200` / `404` |
| POST `/api/clientes` 🔒 `[administrador, recepcionista]` | Registra un cliente (FR-014) | `201` |
| PATCH `/api/clientes/:id` 🔒 `[administrador, recepcionista]` | Modifica un cliente (FR-015) | `200` / `404` |

**Restricción de campos por rol (FR-016, clarify 2026-10-09)**

| Rol | Campos recibidos |
|-----|------------------|
| `administrador`, `recepcionista` | `id`, `nombre`, `apellido`, `correo`, `telefono`, `direccion`, `fecha_registro`, `estado` |
| `entrenador` | Únicamente `id`, `nombre`, `apellido`, `estado` |
| `cliente` | Solo su propio registro completo; sobre otros → `403` |

Petición de creación:

```json
{ "nombre": "Luis", "apellido": "Pérez", "correo": "luis@correo.com", "telefono": "5512345678", "direccion": "Calle Norte 10" }
```

Respuesta `201`:

```json
{ "mensaje": "Cliente registrado correctamente", "cliente": { "id": 1, "nombre": "Luis", "apellido": "Pérez", "correo": "luis@correo.com", "estado": "activo" } }
```

| Código | Cuándo |
|--------|--------|
| `400` | `nombre`, `apellido` o `correo` ausentes, o formato inválido (FR-018) |
| `403` | `entrenador` o `cliente` intentan crear o modificar |
| `404` | `id` de cliente inexistente (mensaje claro, sin detalles internos) |
| `409` | Correo ya registrado en `clientes` (FR-020) |

## 4. Salud del servicio

### GET `/api/salud`

Sin autenticación. Verifica que el backend responde y que MySQL está accesible.

- `200` → `{ "estado": "ok", "baseDatos": "conectada" }`
- `503` → `{ "mensaje": "Servicio no disponible" }` cuando MySQL no responde (Casos límite).

## 5. Reglas transversales del contrato

1. Ninguna respuesta incluye el campo `password`.
2. Las rutas sin token responden `401`; sin permiso para el rol, `403` (SC-002).
3. Toda respuesta de error conserva el formato de [formato-errores.md](./formato-errores.md) y no
   expone stack traces, nombres de tablas ni credenciales (FR-034).
4. El frontend consume exclusivamente estas rutas; no existe acceso directo a MySQL (FR-033).
5. Las rutas de `tipos_membresia`, `membresias` y `pagos` no existen en el Sprint 1 (FR-027).
