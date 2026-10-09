# Modelo de datos: Sprint 1 - Base del sistema, autenticación, usuarios, roles y clientes

**Rama**: `001-sprint-1-base-sistema` | **Fecha**: 2026-10-09 | **Plan**: [plan.md](./plan.md)

Documento de la Fase 1 de `/speckit.plan`. Fuente de entidades: `spec.md` (Entidades clave,
FR-020 a FR-027) y `docs/project-context.md` (sección 14). Motor **InnoDB**, codificación
**`utf8mb4`**, nombres de tablas en minúsculas.

## 1. Alcance de tablas en el Sprint 1

| Tabla | Origen | Operaciones en Sprint 1 |
|-------|--------|--------------------------|
| `usuarios` | FR-021 | Crear, consultar, modificar (incluye rol, estado y restablecer contraseña) |
| `clientes` | FR-021 | Crear, consultar, modificar |
| `tipos_membresia` | FR-021, FR-027 | Solo estructura inicial (sin endpoints funcionales) |
| `membresias` | FR-021, FR-027 | Solo estructura inicial (sin endpoints funcionales) |
| `pagos` | FR-021, FR-027 | Solo estructura inicial (sin endpoints funcionales) |

Las tablas `rostros`, `accesos` y `auditoria` de la constitución **no se crean en este sprint**:
pertenecen al Sprint 2 (FR-035, FR-036 y "Fuera del alcance del Sprint 1").

## 2. Entidades

### 2.1 `usuarios`

Cuentas de acceso al sistema.

| Campo | Tipo | Restricciones | Origen |
|-------|------|---------------|--------|
| `id_usuario` | `INT UNSIGNED` | `PRIMARY KEY AUTO_INCREMENT` | project-context 14.3 |
| `nombre` | `VARCHAR(100)` | `NOT NULL` | spec Entidades clave |
| `correo` | `VARCHAR(150)` | `NOT NULL`, `UNIQUE` (índice único) | FR-012 |
| `password` | `VARCHAR(255)` | `NOT NULL` — hash `bcrypt`, nunca texto plano | FR-002, SC-003 |
| `rol` | `ENUM('administrador','recepcionista','entrenador','cliente')` | `NOT NULL` | FR-008 |
| `estado` | `ENUM('activo','inactivo')` | `NOT NULL`, `DEFAULT 'activo'` | FR-010, clarify 2026-10-09 |

**Reglas de validación**

- `correo` con formato válido y único en todo el sistema; duplicado → error 409 sin persistir.
- `password` con al menos 8 caracteres, sin exigir otros caracteres (clarify 2026-10-09); se
  almacena siempre como hash `bcrypt` (costo por defecto).
- `rol` debe pertenecer a los cuatro valores definidos; cualquier otro valor → 400.
- Operaciones de gestión disponibles únicamente para el rol `administrador` (FR-007, FR-013).

**Transiciones de estado**

```text
activo ──(admin: desactivar)──▶ inactivo ──(admin: activar)──▶ activo
```

- `inactivo` no puede iniciar sesión (FR-010, HU4 escenario 4 y Casos límite).
- Nunca se elimina el registro en el Sprint 1 (FR-019).

### 2.2 `clientes`

Información de los clientes del gimnasio.

| Campo | Tipo | Restricciones | Origen |
|-------|------|---------------|--------|
| `id_cliente` | `INT UNSIGNED` | `PRIMARY KEY AUTO_INCREMENT` | project-context 14.3 |
| `nombre` | `VARCHAR(100)` | `NOT NULL` | spec Entidades clave, FR-018 |
| `apellido` | `VARCHAR(100)` | `NOT NULL` | spec Entidades clave, FR-018 |
| `correo` | `VARCHAR(150)` | `NOT NULL`, `UNIQUE` (índice único) | FR-020, clarify 2026-10-09 |
| `telefono` | `VARCHAR(30)` | `NULL` permitido (formato validado si se informa) | project-context 14.3 |
| `direccion` | `VARCHAR(200)` | `NULL` permitido | project-context 14.3 |
| `fecha_registro` | `DATETIME` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | spec Entidades clave |
| `estado` | `ENUM('activo','inactivo')` | `NOT NULL`, `DEFAULT 'activo'` | FR-010, clarify 2026-10-09 |

**Reglas de validación**

- Obligatorios: `nombre`, `apellido` y `correo` (correo obligatorio y único en todo el sistema,
  FR-020). Opcionales: `telefono`, `direccion`.
- `correo` duplicado → 409 sin persistir el registro (Casos límite, clarify 2026-10-09).
- Formato de correo y de teléfono validados en backend antes de almacenar (FR-018).
- Solo `administrador` y `recepcionista` pueden crear y modificar (FR-014, FR-015).
- `entrenador` solo recibe `nombre`, `apellido` y `estado` en las respuestas de consulta
  (FR-016, clarify 2026-10-09); `cliente` solo accede a su propio registro (FR-017).
- Nunca se elimina físicamente en el Sprint 1 (FR-019).

**Transiciones de estado**: mismas que `usuarios`
(`activo ⇄ inactivo`, sin borrado físico).

### 2.3 `tipos_membresia` (solo estructura)

| Campo | Tipo | Restricciones | Origen |
|-------|------|---------------|--------|
| `id_tipo_membresia` | `INT UNSIGNED` | `PRIMARY KEY AUTO_INCREMENT` | project-context 14.3 |
| `nombre` | `VARCHAR(100)` | `NOT NULL` | project-context 14.3 |
| `descripcion` | `VARCHAR(255)` | `NULL` permitido | project-context 14.3 |
| `duracion` | `INT` | `NOT NULL` (días del plan) | project-context 14.3 |
| `precio` | `DECIMAL(10,2)` | `NOT NULL`, `>= 0` | project-context 14.3 |
| `estado` | `ENUM('activo','inactivo')` | `NOT NULL`, `DEFAULT 'activo'` | project-context 14.3 |

Sin endpoints funcionales en el Sprint 1 (FR-027).

### 2.4 `membresias` (solo estructura)

| Campo | Tipo | Restricciones | Origen |
|-------|------|---------------|--------|
| `id_membresia` | `INT UNSIGNED` | `PRIMARY KEY AUTO_INCREMENT` | project-context 14.3 |
| `id_cliente` | `INT UNSIGNED` | `NOT NULL`, `FOREIGN KEY → clientes(id_cliente)` | RN-01, RN-02 |
| `id_tipo_membresia` | `INT UNSIGNED` | `NOT NULL`, `FOREIGN KEY → tipos_membresia(id_tipo_membresia)` | RN-02 |
| `fecha_inicio` | `DATE` | `NOT NULL` | RN-03 |
| `fecha_fin` | `DATE` | `NOT NULL`, `>= fecha_inicio` | RN-03 |
| `estado` | `ENUM('activa','vencida','suspendida','cancelada')` | `NOT NULL`, `DEFAULT 'activa'` | RN-04 |

Los estados de membresía se calculan/aplican en el Sprint 2; aquí solo existe la estructura.

### 2.5 `pagos` (solo estructura)

| Campo | Tipo | Restricciones | Origen |
|-------|------|---------------|--------|
| `id_pago` | `INT UNSIGNED` | `PRIMARY KEY AUTO_INCREMENT` | project-context 14.3 |
| `id_cliente` | `INT UNSIGNED` | `NOT NULL`, `FOREIGN KEY → clientes(id_cliente)` | RN-05 |
| `id_membresia` | `INT UNSIGNED` | `NULL` permitido, `FOREIGN KEY → membresias(id_membresia)` | RN-05 |
| `monto` | `DECIMAL(10,2)` | `NOT NULL`, `> 0` | project-context 14.3 |
| `fecha_pago` | `DATETIME` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | project-context 14.3 |
| `metodo_pago` | `VARCHAR(50)` | `NOT NULL` | project-context 14.3 |
| `estado` | `ENUM('pendiente','completado','cancelado')` | `NOT NULL`, `DEFAULT 'completado'` | project-context 14.3 |

Sin endpoints funcionales en el Sprint 1 (FR-027); los pagos forman historial financiero y no se
eliminan de manera ordinaria (RN-06).

## 3. Relaciones

```text
clientes
   │
   ├──< membresias >── tipos_membresia
   │
   ├──< pagos
   │
   └── (Sprint 2: rostros, accesos)

usuarios
   │
   └── (Sprint 2: auditoria)
```

- Integridad referencial activa (`FOREIGN KEY` con `ON DELETE RESTRICT`) en todas las relaciones:
  un cliente con registros relacionados no puede borrarse (coherente con FR-019 y RN-06).
- Índices únicos: `usuarios.correo`, `clientes.correo`.
- Índices de apoyo: `membresias.id_cliente`, `pagos.id_cliente`.

## 4. Semilla de datos (`database/seeds/`)

| Registro | Contenido | Condición |
|----------|-----------|-----------|
| Usuario administrador inicial | Rol `administrador`, estado `activo`, correo de `SEED_ADMIN_EMAIL`, contraseña de `SEED_ADMIN_PASSWORD` con hash `bcrypt` calculado en ejecución | Idempotente: no se duplica si ya existe |
| Datos de demostración (opcional) | 3 a 5 clientes con `estado = 'activo'` | Solo para pruebas y demostración |

## 5. Decisiones de modelo derivadas de la investigación

- Sin campos de auditoría (`creado_por`, `actualizado_por`) en el Sprint 1: la tabla `auditoria`
  corresponde al Sprint 2 (ver `research.md`, R11).
- Fechas con zonas horarias del servidor local; no se almacena UTC adicional para no exceder el
  alcance.
- No se crea tabla de sesiones: la sesión está representada por el JWT firmado (R6).
