# Contrato del flujo de control de acceso

**Rama**: `002-membresias-pagos-acceso-facial` | **Fecha**: 2026-10-15 | **Plan**: [plan.md](./plan.md)

Describe el flujo de identificación facial y validación de acceso (FR-018, FR-019, FR-021,
FR-024). Complementa [api-rest.md](./api-rest.md) y [formato-errores.md](./formato-errores.md).

## 1. Reparto de responsabilidades (R1, R2)

```text
Frontend (navegador)                     Backend (Node/Express)                MySQL
─────────────────────                    ──────────────────────                ─────
getUserMedia + <video> + <canvas>
        │
        ▼
detección de rostro (face-api)
        │
        ▼
descriptor facial (128 números)  ──▶  POST /api/accesos/validar
                                          │
                                          ▼
                                     compara descriptor con rostros
                                     (distancia euclídea, umbral)
                                          │
                                          ▼
                                     identifica al cliente
                                          │
                                          ▼
                                     valida membresía vigente  ◀──────────▶  membresias/pagos
                                          │
                                          ▼
                                     registra acceso (autorizado/rechazado) ─▶  accesos + auditoria
        ◀── resultado + cliente + motivo ──
```

- El frontend **solo** captura y genera el descriptor; nunca decide el acceso.
- El backend compara, decide, registra y devuelve el resultado.
- Los descriptores almacenados **nunca** se envían al cliente (FR-020, SC-004).

## 2. Algoritmo del backend

1. Validar que `descriptorFacial` sea un arreglo numérico de 128 posiciones; si no, `400`
   `DESCRIPTOR_INVALIDO` (FR-029).
2. Cargar todos los descriptores activos de `rostros` (solo `id_cliente` y `descriptor_facial`).
3. Calcular la **distancia euclídea** entre el descriptor recibido y cada descriptor almacenado.
4. Seleccionar la menor distancia. Si `menor_distancia > umbral` (por defecto `0.6`, R4), el rostro
   se considera **no reconocido** → rechazo `Rostro no reconocido.` y acceso con `id_cliente = NULL`
   (FR-019).
5. Si hay coincidencia, validar la **membresía vigente** del cliente: debe existir una membresía con
   `estado = 'activa'` y `hoy <= fecha_fin` (FR-021, FR-023).
6. Determinar el resultado:
   - Vigente → `autorizado`.
   - Vencida/suspendida/cancelada → `rechazado` con el motivo correspondiente.
   - Sin membresía → `rechazado` con `El cliente no tiene una membresía registrada.`
7. Registrar el acceso en `accesos` (autorizado o rechazado, con motivo) y una entrada en
   `auditoria` (FR-024, FR-036, SC-003).
8. Responder `200` con `resultado`, `cliente`, `membresia` (si aplica), `motivo` (si rechaza) y el
   `acceso` registrado.

## 3. Umbral y reintentos

- `FACIAL_UMBRAL` (defecto `0.6`) y `FACIAL_MAX_INTENTOS` (defecto `3`) se leen del entorno (R4).
- El **frontend** ofrece hasta `FACIAL_MAX_INTENTOS` capturas; el backend se mantiene sin estado
  entre intentos.
- Cada intento que llega al backend se registra como un acceso; el máximo de intentos limita la
  captura en la interfaz, no el registro de cada intento (FR-024, Casos límite).

## 4. Invariantes del flujo

1. La identificación facial **siempre** precede a la validación de membresía (FR-021).
2. Una coincidencia facial por sí sola **nunca** autoriza el acceso (HU7 esc. 3).
3. Todo intento (autorizado o rechazado) queda registrado con fecha, hora, tipo, resultado y, si
   aplica, motivo (FR-024, SC-003).
4. Si MySQL no está disponible, el backend responde con error controlado **sin autorizar** el
   acceso (Casos límite).
5. Los registros de acceso no se eliminan de forma ordinaria (FR-025).
