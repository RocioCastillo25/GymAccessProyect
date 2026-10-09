# Contrato de formato de errores: Sprint 1

**Rama**: `001-sprint-1-base-sistema` | **Fecha**: 2026-10-09 | **Plan**: [plan.md](./plan.md)

Todo endpoint devuelve los errores con el siguiente cuerpo:

```json
{
  "mensaje": "Mensaje claro en español, comprensible para la persona usuaria",
  "codigo": "ERROR_CODIGO"
}
```

- `mensaje`: obligatorio; redactado en español y sin información técnica interna (FR-034).
- `codigo`: opcional; identificador estable para que el frontend reaccione sin analizar texto.

## Correspondencia de códigos HTTP

| HTTP | `codigo` sugerido | Situación | Ejemplo de `mensaje` |
|------|-------------------|-----------|----------------------|
| `400` | `VALIDACION` | Datos de entrada inválidos (FR-018) | "El correo no tiene un formato válido." |
| `401` | `AUTENTICACION` | Sin token, token expirado o credenciales inválidas | "Credenciales incorrectas." |
| `403` | `AUTORIZACION` | Rol sin permiso para la operación (FR-006) | "No tiene permisos para realizar esta operación." |
| `404` | `NO_ENCONTRADO` | Recurso inexistente | "Cliente no encontrado." |
| `409` | `DUPLICADO` | Correo ya registrado (FR-012, FR-020) | "El correo ya está registrado." |
| `500` | `ERROR_INTERNO` | Fallo inesperado o MySQL no disponible | "Ocurrió un error inesperado. Intente de nuevo." |
| `503` | `SERVICIO_NO_DISPONIBLE` | MySQL inaccesible desde `/api/salud` | "Servicio no disponible." |

## Reglas

1. **Nunca** se incluyen `stack trace`, mensajes de la base de datos, rutas internas, nombres de
   tablas ni credenciales en el cuerpo de la respuesta (FR-034, regla V de la constitución).
2. Los detalles técnicos se registran únicamente en la consola del servidor (investigación R10).
3. En login, cualquier fallo de credenciales devuelve el mismo mensaje `401` para no revelar si el
   correo existe (FR-005).
4. Las validaciones de campo devuelven `400` con una lista opcional de errores por campo:

```json
{
  "mensaje": "Revise los datos enviados.",
  "codigo": "VALIDACION",
  "errores": [
    { "campo": "correo", "error": "El correo no tiene un formato válido." },
    { "campo": "password", "error": "La contraseña debe tener al menos 8 caracteres." }
  ]
}
```

5. Las respuestas exitosas usan `200` (lectura o modificación) y `201` (creación), con un cuerpo
   `mensaje` de confirmación cuando la operación produce un recurso nuevo o modificado.
