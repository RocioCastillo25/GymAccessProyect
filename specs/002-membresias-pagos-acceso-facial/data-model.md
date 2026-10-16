# Modelo de datos: Sprint 2 - Membresías, pagos, reconocimiento facial y control de acceso

**Rama**: `002-membresias-pagos-acceso-facial` | **Fecha**: 2026-10-15 | **Plan**: [plan.md](./plan.md)

Documento de la Fase 1. Amplía el modelo del Sprint 1
([`../001-sprint-1-base-sistema/data-model.md`](../001-sprint-1-base-sistema/data-model.md)) sin
redefinir `usuarios` ni `clientes`. Fuentes: sección "Entidades clave" y FR-001 a FR-037 del
[spec.md](./spec.md), `docs/project-context.md` y las decisiones de
[research.md](./research.md). MySQL 8 local, motor InnoDB, codificación `utf8mb4`, llaves primarias
y foráneas con integridad referencial.

## 1. Alcance de tablas

| Tabla | Origen | Estado en Sprint 2 |
|-------|--------|--------------------|
| `tipos_membresia` | Creada en migración 001 | Se implementa funcionalmente (FR-001 a FR-004) |
| `membresias` | Creada en migración 001 | Se implementa funcionalmente (FR-005 a FR-010) |
| `pagos` | Creada en migración 001 | Se implementa funcionalmente (FR-011 a FR-015) |
| `rostros` | **Nueva** en migración 002 | Se implementa funcionalmente (FR-016 a FR-020) |
| `accesos` | **Nueva** en migración 002 | Se implementa funcionalmente (FR-021 a FR-027) |
| `auditoria` | **Nueva** en migración 002 | Se implementa funcionalmente (FR-036) |
| `usuarios`, `clientes` | Creadas en migración 001 | Se reutilizan; solo se referencian por clave foránea |

La migración `002` **no recalcula** el esquema de Sprint 1 más que para añadir índices de apoyo si
la revisión de la implementación lo requiriese; su foco son las tres tablas nuevas y la integridad
referencial con `clientes` y `usuarios`. La base se reconstruye con `001` + `002` (SC-007, FR-033).

## 1.1 Tipos de membresía (funcional en este sprint)

| Campo | Tipo | Restricciones | Origen |
|-------|------|---------------|--------|
| `id_tipo_membresia` | `INT UNSIGNED` | `PRIMARY KEY AUTO_INCREMENT` | project-context 14.3 |
| `nombre` | `VARCHAR(100)` | `NOT NULL`, `UNIQUE` recomendado | FR-001 |
| `descripcion` | `VARCHAR(255)` | `NULL` permitido | FR-001 |
| `duracion` | `INT` | `NOT NULL`, `> 0` (días) | FR-004 |
| `precio` | `DECIMAL(10,2)` | `NOT NULL`, `>= 0` | FR-004 |
| `estado` | `ENUM('activo','inactivo')` | `NOT NULL`, `DEFAULT 'activo'` | FR-004 |

**Reglas**: solo `administrador` crea y modifica (FR-001, FR-003); `administrador` y
`recepcionista` consultan todo, `entrenador` solo `nombre` y `duracion` (FR-002, sin precio). Un
tipo en estado `inactivo` no puede usarse para nuevas asignaciones ni renovaciones, pero las
membresías ya generadas no se alteran (FR-003).

### Membresías (funcional en este sprint)

| Campo | Tipo | Restricciones | Origen |
|-------|------|---------------|--------|
| `id_membresia` | `INT UNSIGNED` | `PRIMARY KEY AUTO_INCREMENT` | project-context 14.3 |
| `id_cliente` | `INT UNSIGNED` | `NOT NULL`, `FOREIGN KEY → clientes` | FR-005 |
| `id_tipo_membresia` | `INT UNSIGNED` | `NOT NULL`, `FOREIGN KEY → tipos_membresia` | FR-005 |
| `fecha_inicio` | `DATE` | `NOT NULL` | FR-006 |
| `fecha_fin` | `DATE` | `NOT NULL`, `>= fecha_inicio` | FR-006 |
| `estado` | `ENUM('activa','vencida','suspendida','cancelada')` | `NOT NULL`, `DEFAULT 'activa'` | FR-007 |

**Cálculo de vigencia (FR-006, R5, R6)**

- Al asignar/renovar: `fecha_fin = fecha_inicio + duracion` días del tipo.
- `vencida` se calcula dinámicamente: si `estado = 'activa'` y la fecha actual es posterior a
  `fecha_fin`, se reporta como `vencida`. `suspendida` y `cancelada` solo se persisten
  explícitamente.
- Una membresía es **vigente** si `estado = 'activa'` y `hoy <= fecha_fin` (válida hasta el final
  de su fecha de finalización; sin tolerancia adicional, spec Supuestos).
- Renovación: nueva fila con `fecha_inicio = max(fecha_fin anterior, hoy)`; se conserva la anterior
  (FR-008, FR-037).

**Reglas**: `administrador` y `recepcionista` asignan, renuevan y consultan (FR-005, FR-008,
FR-010); `cliente` consulta solo la propia (FR-009); `entrenador` no gestiona. Cliente o tipo
inexistentes/inactivos → rechazo sin persistir (FR-005, Casos límite).

### Pagos (funcional en este sprint)

| Campo | Tipo | Restricciones | Origen |
|-------|------|---------------|--------|
| `id_pago` | `INT UNSIGNED` | `PRIMARY KEY AUTO_INCREMENT` | project-context 14.3 |
| `id_cliente` | `INT UNSIGNED` | `NOT NULL`, `FOREIGN KEY → clientes` | FR-011 |
| `id_membresia` | `INT UNSIGNED` | `NULL` permitido, `FOREIGN KEY → membresias` | FR-011 |
| `monto` | `DECIMAL(10,2)` | `NOT NULL`, `> 0` | FR-011 |
| `fecha_pago` | `DATETIME` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | FR-011 |
| `metodo_pago` | `VARCHAR(50)` | `NOT NULL`, catálogo {efectivo, tarjeta, transferencia} (R8) | FR-011 |
| `estado` | `ENUM('pendiente','completado','cancelado')` | `NOT NULL`, `DEFAULT 'completado'` | FR-011 |

**Reglas**: solo `administrador` y `recepcionista` registran (FR-011); solo `administrador` consulta
historial y adeudos (FR-012); el `cliente` ve solo lo propio (FR-013); no hay borrado ordinario
(FR-014). Un pago debe referenciar un cliente existente y, cuando se asocie, una membresía del mismo
cliente (Casos límite). **Adeudo** (FR-015, R7): membresía en estado activo/vigente sin al menos un
pago `completado` asociado. Sin pagos parciales (R8).

## 1.4 Rostros (nueva)

| Campo | Tipo | Restricciones | Origen |
|-------|------|---------------|--------|
| `id_rostro` | `INT UNSIGNED` | `PRIMARY KEY AUTO_INCREMENT` | project-context 14.3 |
| `id_cliente` | `INT UNSIGNED` | `NOT NULL`, `UNIQUE`, `FOREIGN KEY → clientes` | FR-017 |
| `descriptor_facial` | `JSON` | `NOT NULL` — arreglo de 128 números (R3) | FR-016, FR-020 |
| `fecha_registro` | `DATETIME` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | spec Entidades clave |
| `estado` | `ENUM('activo','inactivo')` | `NOT NULL`, `DEFAULT 'activo'` | spec Entidades clave |

**Reglas**: solo `administrador` y `recepcionista` registran/actualizan (FR-016); debe existir el
cliente (FR-017); un segundo registro para el mismo cliente **actualiza** la fila existente sin
duplicar (`UNIQUE(id_cliente)`, FR-017, HU6 esc. 3). El descriptor se protege como dato sensible:
**nunca** se devuelve por la API (FR-020, SC-004). No se almacenan imágenes (spec Supuestos).

### Accesos

| Campo | Tipo | Restricciones | Origen |
|-------|------|---------------|--------|
| `id_acceso` | `INT UNSIGNED` | `PRIMARY KEY AUTO_INCREMENT` | project-context 14.3 |
| `id_cliente` | `INT UNSIGNED` | `NULL` permitido, `FOREIGN KEY → clientes` | FR-021, FR-023 |
| `fecha_hora` | `DATETIME` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` (cubre `fecha` y `hora`) | FR-024 |
| `tipo` | `ENUM('entrada','salida')` | `NOT NULL`, `DEFAULT 'entrada'` | project-context 14.3 |
| `resultado` | `ENUM('autorizado','rechazado')` | `NOT NULL` | FR-024 |
| `motivo_rechazo` | `VARCHAR(255)` | `NULL` permitido; obligatorio cuando `resultado = 'rechazado'` | FR-024, SC-003 |

**Reglas**: `id_cliente` es `NULL` cuando el rostro no se identifica (HU8 esc. 4). Todo intento se
registra, autorizado o rechazado (FR-024, SC-003); no hay borrado ordinario (FR-025). Consultan
`administrador`, `recepcionista` y `entrenador` (asistencia) (FR-026); el `cliente` ve solo los
suyos (FR-027).

### Auditoría

| Campo | Tipo | Restricciones | Origen |
|-------|------|---------------|--------|
| `id_auditoria` | `INT UNSIGNED` | `PRIMARY KEY AUTO_INCREMENT` | FR-036 |
| `id_usuario` | `INT UNSIGNED` | `NULL` permitido, `FOREIGN KEY → usuarios` | FR-036 |
| `accion` | `VARCHAR(100)` | `NOT NULL` | FR-036 |
| `modulo` | `VARCHAR(50)` | `NOT NULL` | FR-036 |
| `fecha` | `DATETIME` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | FR-036 |
| `resultado` | `ENUM('exito','error')` | `NOT NULL` | FR-036 |
| `descripcion` | `VARCHAR(255)` | `NULL` permitido | FR-036 |

**Reglas**: registra las acciones relevantes del sprint (tipos de membresía, membresías, pagos,
rostros y accesos) con el usuario que las ejecutó; consulta exclusiva del `administrador` (FR-036).
`id_usuario` es `NULL` cuando la acción no tiene un usuario autenticado (por ejemplo, un acceso no
identificado).

## 2. Relaciones

```text
clientes
   │
   ├──< membresias >── tipos_membresia
   ├──< pagos ─────────┘
   ├──1 rostros                    (UNIQUE(id_cliente))
   └──< accesos                    (id_cliente NULL si no se identifica)

usuarios
   └──< auditoria                  (id_usuario NULL si no hay sesión)
```

- `FOREIGN KEY` con `ON DELETE RESTRICT` en todas las relaciones (historial no borrable, FR-014,
  FR-025, FR-037).
- Índices únicos: `rostros.id_cliente`; `tipos_membresia.nombre` (recomendado).
- Índices de apoyo: `membresias.id_cliente`, `pagos.id_cliente`, `pagos.id_membresia`,
  `accesos.id_cliente`, `accesos.fecha_hora`, `auditoria.fecha`.

## 3. Migración y semilla

| Script | Contenido |
|--------|-----------|
| `database/migrations/001_crear_estructura.sql` | Existente (Sprint 1): `usuarios`, `clientes`, `tipos_membresia`, `membresias`, `pagos` |
| `database/migrations/002_sprint2_facial_accesos.sql` | **Nueva**: `rostros`, `accesos`, `auditoria` con sus llaves foráneas e índices |
| `database/seeds/semilla-administrador.js` | Existente: administrador idempotente |
| `database/seeds/semilla-demo-sprint2.js` | **Opcional**: 2–3 tipos de membresía, un cliente con membresía y pago, y un descriptor facial de prueba para la demostración local |

La migración es reejecutable a través del registro `_migraciones_aplicadas` del aplicador
(`database/scripts/aplicar-migraciones.js`), que ya aplica las migraciones en orden numérico.

## 4. Decisiones de modelo derivadas de la investigación

- El descriptor facial se guarda como `JSON` (128 números) y nunca se expone (R3, FR-020).
- Los estados `vencida`/`vigente` se calculan en lectura; `suspendida`/`cancelada` se persisten
  (R5).
- La renovación inserta una nueva fila conservando el historial (R6, FR-037).
- El adeudo se define como membresía activa/vigente sin un pago `completado` (R7, FR-015).
- `accesos.fecha_hora` (un `DATETIME`) cubre los atributos `fecha` y `hora` de la spec.
- Sin campos de cifrado en reposo en esta versión; la protección se basa en el acceso restringido y
  la no exposición (R3, diferido en `research.md`).
