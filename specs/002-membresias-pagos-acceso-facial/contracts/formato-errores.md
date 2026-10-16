# Contrato de formato de errores: Sprint 2

**Rama**: `002-membresias-pagos-acceso-facial` | **Fecha**: 2026-10-15 | **Plan**: [plan.md](./plan.md)

Se mantiene el formato del Sprint 1. Todo endpoint devuelve los errores con el siguiente cuerpo:

```json
{
  "mensaje": "Mensaje claro en español, comprensible para la persona usuaria",
  "codigo": "ERROR_CODIGO"
}
```

- `mensaje`: obligatorio; en español y sin información técnica interna (FR-030).
- `codigo`: opcional; identificador estable para que el frontend reaccione sin analizar el texto.

## Correspondencia de códigos HTTP

| HTTP | `codigo` sugerido | Situación | Ejemplo de `mensaje` |
|------|-------------------|-----------|----------------------|
| `400` | `VALIDACION` | Datos de entrada inválidos (FR-029) | "El monto debe ser mayor que cero." |
| `400` | `DESCRIPTOR_INVALIDO` | Descriptor facial ausente o malformado | "No se recibió una captura facial válida." |
| `401` | `AUTENTICACION` | Sin token, token expirado o credenciales inválidas | "Credenciales incorrectas." |
| `403` | `AUTORIZACION` | Rol sin permiso (FR-028) | "No tiene permisos para realizar esta operación." |
| `404` | `NO_ENCONTRADO` | Recurso inexistente | "Cliente no encontrado." |
| `404` | `SIN_MEMBRESIA` | Renovación de un cliente sin membresía previa | "El cliente no tiene una membresía para renovar." |
| `409` | `DUPLICADO` | Registro duplicado (correo, tipo, pago concurrente) | "El registro ya existe." |
| `409` | `ROSTRO_YA_REGISTRADO` | El cliente ya tiene información facial | "El cliente ya tiene información facial registrada." |
| `500` | `ERROR_INTERNO` | Fallo inesperado o MySQL no disponible | "Ocurrió un error inesperado. Intente de nuevo." |
| `503` | `SERVICIO_NO_DISPONIBLE` | MySQL inaccesible desde `/api/salud` | "Servicio no disponible." |

## Códigos de negocio en la validación de acceso

La validación de acceso responde `200` con un cuerpo de negocio (no un error HTTP) cuando el
resultado es `rechazado`; el motivo es claro y no revela información técnica:

```json
{ "resultado": "rechazado", "motivo": "Rostro no reconocido.", "cliente": null }
```

Motivos de rechazo previstos (FR-019, FR-023, FR-024):

| Motivo | Cuándo |
|--------|--------|
| `Rostro no reconocido.` | Ninguna coincidencia supera el umbral (FR-019) |
| `No se detectó ningún rostro.` | La captura no contiene un rostro válido |
| `La membresía está vencida.` | `fechaFin` anterior a la fecha actual (FR-023) |
| `La membresía está suspendida.` | Estado `suspendida` (FR-023) |
| `La membresía está cancelada.` | Estado `cancelada` (FR-023) |
| `El cliente no tiene una membresía registrada.` | Cliente identificado sin membresía (FR-023) |

## Reglas

1. **Nunca** se incluyen `stack trace`, mensajes de MySQL, rutas internas, nombres de tablas ni
   credenciales (FR-030, regla V de la constitución).
2. Los detalles técnicos se registran únicamente en la consola del servidor y en `auditoria`
   (R10).
3. Las validaciones de campo devuelven `400` con una lista opcional de errores por campo:

```json
{
  "mensaje": "Revise los datos enviados.",
  "codigo": "VALIDACION",
  "errores": [
    { "campo": "monto", "error": "El monto debe ser mayor que cero." },
    { "campo": "metodoPago", "error": "El método de pago no es válido." }
  ]
}
```

4. Las respuestas exitosas usan `200` (lectura o modificación), `201` (creación) y `200` con
   `resultado` de negocio para la validación de acceso.
5. Un descriptor facial malformado devuelve `400` con `DESCRIPTOR_INVALIDO` sin exponer el
   contenido recibido.
