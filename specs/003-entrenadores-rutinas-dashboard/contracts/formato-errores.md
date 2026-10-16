# Contrato de formato de errores: Sprint 3

**Rama**: `003-entrenadores-rutinas-dashboard` | **Fecha**: 2026-10-15 | **Plan**: [plan.md](./plan.md)

Se mantiene el formato de los Sprints 1 y 2. Todo endpoint devuelve los errores con el siguiente
cuerpo:

```json
{
  "mensaje": "Mensaje claro en español, comprensible para la persona usuaria",
  "codigo": "ERROR_CODIGO"
}
```

- `mensaje`: obligatorio; en español y sin información técnica interna (FR-024).
- `codigo`: opcional; identificador estable para que el frontend reaccione sin analizar el texto.

## Correspondencia de códigos HTTP

| HTTP | `codigo` sugerido | Situación | Ejemplo de `mensaje` |
|------|-------------------|-----------|----------------------|
| `400` | `VALIDACION` | Datos de entrada inválidos (FR-023) | "El nombre del ejercicio es obligatorio." |
| `401` | `AUTENTICACION` | Sin token, token expirado o credenciales inválidas | "Credenciales incorrectas." |
| `403` | `AUTORIZACION` | Rol sin permiso (FR-022) | "No tiene permisos para realizar esta operación." |
| `403` | `ENTRENADOR_NO_ASIGNADO` | El entrenador intenta gestionar un cliente que no está a su cargo (FR-012) | "El cliente no está asignado a su carga." |
| `404` | `NO_ENCONTRADO` | Recurso inexistente | "Entrenador no encontrado." |
| `404` | `SIN_RUTINA` | El cliente no tiene rutina vigente | "El cliente no tiene una rutina asignada." |
| `404` | `SIN_ASIGNACION` | El cliente no tiene entrenador asignado | "El cliente no tiene un entrenador asignado." |
| `409` | `DUPLICADO` | Registro duplicado (usuario ya es entrenador) | "El usuario ya está registrado como entrenador." |
| `409` | `ENTRENADOR_INACTIVO` | Intento de asignar un entrenador inactivo | "El entrenador no está activo." |
| `409` | `CLIENTE_INACTIVO` | Intento de asignar un cliente inactivo | "El cliente no está activo." |
| `500` | `ERROR_INTERNO` | Fallo inesperado o MySQL no disponible | "Ocurrió un error inesperado. Intente de nuevo." |
| `503` | `SERVICIO_NO_DISPONIBLE` | MySQL inaccesible desde `/api/salud` | "El servicio no está disponible temporalmente." |

## Reglas

1. **Nunca** se incluyen `stack trace`, mensajes de MySQL, rutas internas, nombres de tablas ni
   credenciales (FR-024, regla V de la constitución).
2. Los detalles técnicos se registran únicamente en la consola del servidor y en `auditoria` (R24).
3. Las validaciones de campo devuelven `400` con una lista opcional de errores por campo:

```json
{
  "mensaje": "Revise los datos enviados.",
  "codigo": "VALIDACION",
  "errores": [
    { "campo": "nombre", "error": "El nombre del ejercicio es obligatorio." },
    { "campo": "series", "error": "Las series deben ser mayores que cero." }
  ]
}
```

4. Las respuestas exitosas usan `200` (lectura o modificación) y `201` (creación).
5. El rechazo por permisos del entrenador sobre un cliente no asignado usa `403` con
   `ENTRENADOR_NO_ASIGNADO` para que el frontend lo distinga de un `403` de rol.
