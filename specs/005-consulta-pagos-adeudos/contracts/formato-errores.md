# Contrato de formato de errores: Consulta de pagos y adeudos

**Rama**: `005-consulta-pagos-adeudos` | **Fecha**: 2026-11-20 | **Plan**:
[../plan.md](../plan.md)

Se mantiene el formato de errores de los sprints anteriores. Todo endpoint de esta funcionalidad
devuelve los errores con el siguiente cuerpo:

```json
{
  "mensaje": "Mensaje claro en español, comprensible para la persona usuaria.",
  "codigo": "ERROR_CODIGO"
}
```

- `mensaje`: obligatorio; en español y sin información técnica interna (FR-016, FR-019).
- `codigo`: identificador estable para que el frontend reaccione sin analizar el texto.
- `errores`: opcional; lista de `{ campo, error }` cuando la solicitud contiene varios parámetros
  inválidos.

Ejemplo de validación de filtros:

```json
{
  "mensaje": "Revise los filtros enviados.",
  "codigo": "VALIDACION",
  "errores": [
    { "campo": "limite", "error": "El campo limite debe ser un número entero mayor que cero." },
    { "campo": "fechaFin", "error": "La fecha de inicio no puede ser posterior a la fecha de fin." }
  ]
}
```

## Correspondencia de códigos HTTP

| HTTP | `codigo` | Situación | Ejemplo de `mensaje` |
|------|----------|-----------|----------------------|
| `400` | `VALIDACION` | Parámetro de filtro o paginación inválido; rango de fechas invertido | "Revise los filtros enviados." |
| `401` | `AUTENTICACION` | Sin token, token expirado o token manipulado | "La sesión no es válida o ha expirado." |
| `403` | `AUTORIZACION` | Rol sin permiso para la consulta | "No tiene permisos para realizar esta operación." |
| `404` | `NO_ENCONTRADO` | No existe cliente asociado al correo del token | "No se encontró el cliente asociado a la sesión." |
| `500` | `ERROR_INTERNO` | Fallo inesperado del servidor | "Ocurrió un error inesperado. Intente de nuevo." |
| `503` | `SERVICIO_NO_DISPONIBLE` | Base de datos no disponible | "Servicio no disponible." |

## Reglas

- El backend valida la autorización antes de ejecutar cualquier consulta a la base de datos.
- Un `idCliente` inexistente en el historial general no es un error: devuelve una lista vacía con
  el mensaje de estado vacío, para no revelar si el cliente existe.
- Ninguna respuesta incluye stack traces, sentencias SQL, credenciales, secretos ni descriptores
  faciales.
- El frontend muestra `mensaje` tal como lo devuelve la API, sin traducirlo ni reemplazarlo por
  texto técnico.
