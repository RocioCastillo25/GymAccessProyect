# Modelo de datos: Sprint 3 - Entrenadores, rutinas y dashboard administrativo

**Rama**: `003-entrenadores-rutinas-dashboard` | **Fecha**: 2026-10-15 | **Plan**: [plan.md](./plan.md)

Documento de la Fase 1. Amplía el modelo de los Sprints 1 y 2
([`../001-sprint-1-base-sistema/data-model.md`](../001-sprint-1-base-sistema/data-model.md),
[`../002-membresias-pagos-acceso-facial/data-model.md`](../002-membresias-pagos-acceso-facial/data-model.md))
sin redefinir `usuarios` ni `clientes`. Fuentes: sección "Entidades clave" y FR-001 a FR-031 del
[spec.md](./spec.md), `docs/project-context.md`, `docs/sprint-3.md` y las decisiones de
[research.md](./research.md). MySQL 8 local, motor InnoDB, codificación `utf8mb4`, llaves primarias
y foráneas con integridad referencial.

## 1. Alcance de tablas

| Tabla | Origen | Estado en Sprint 3 |
|-------|--------|--------------------|
| `entrenadores` | **Nueva** en migración 003 | Se implementa funcionalmente (FR-001 a FR-004) |
| `asignaciones_entrenador` | **Nueva** en migración 003 | Se implementa funcionalmente (FR-005 a FR-008) |
| `rutinas` | **Nueva** en migración 003 | Se implementa funcionalmente (FR-009 a FR-012) |
| `ejercicios_rutina` | **Nueva** en migración 003 | Se implementa funcionalmente (FR-011) |
| `objetivos_entrenamiento` | **Nueva** en migración 003 | Se implementa funcionalmente (FR-013, FR-015) |
| `progresos_clientes` | **Nueva** en migración 003 | Se implementa funcionalmente (FR-014, FR-015) |
| `usuarios`, `clientes` | Creadas en migración 001 | Se reutilizan; solo se referencian por clave foránea |
| `membresias`, `accesos`, `pagos` | Creadas en migración 001/002 | Se consultan para el dashboard (FR-019); no se modifican |
| `estadisticas_dashboard` | Mencionada orientativamente en `docs/sprint-3.md` | **No se crea**; el dashboard usa consultas agregadas (R18) |

La migración `003` crea las seis tablas nuevas y sus índices; no altera las tablas de los sprints
anteriores. La base se reconstruye con `001` + `002` + `003` (SC-007, FR-027).

## 1.1 Entrenadores (nueva)

| Campo | Tipo | Restricciones | Origen |
|-------|------|---------------|--------|
| `id_entrenador` | `INT UNSIGNED` | `PRIMARY KEY AUTO_INCREMENT` | spec Entidades clave |
| `id_usuario` | `INT UNSIGNED` | `NOT NULL`, `UNIQUE`, `FOREIGN KEY → usuarios` | FR-001, FR-003 |
| `especialidad` | `VARCHAR(100)` | `NULL` permitido | spec Entidades clave |
| `telefono` | `VARCHAR(30)` | `NULL` permitido (formato validado si se informa) | spec Entidades clave |
| `fecha_registro` | `DATETIME` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | spec Entidades clave |
| `estado` | `ENUM('activo','inactivo')` | `NOT NULL`, `DEFAULT 'activo'` | FR-002 |

**Reglas**: solo `administrador` crea y modifica (FR-001, FR-002). `id_usuario` debe existir, estar
`activo` y tener rol `entrenador`; otro caso → rechazo sin persistir (FR-003, FR-004). `UNIQUE`
sobre `id_usuario` evita duplicar el mismo usuario como entrenador (FR-003). Un entrenador
`inactivo` no recibe nuevas asignaciones.

**Transiciones de estado**

```text
activo ──(admin: desactivar)──▶ inactivo ──(admin: activar)──▶ activo
```

### Asignaciones de entrenador (nueva)

| Campo | Tipo | Restricciones | Origen |
|-------|------|---------------|--------|
| `id_asignacion` | `INT UNSIGNED` | `PRIMARY KEY AUTO_INCREMENT` | spec Entidades clave |
| `id_cliente` | `INT UNSIGNED` | `NOT NULL`, `FOREIGN KEY → clientes` | FR-005 |
| `id_entrenador` | `INT UNSIGNED` | `NOT NULL`, `FOREIGN KEY → entrenadores` | FR-005 |
| `fecha_asignacion` | `DATETIME` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | spec Entidades clave |
| `es_principal` | `TINYINT(1)` | `NOT NULL`, `DEFAULT 1` | FR-006 |
| `estado` | `ENUM('activa','finalizada')` | `NOT NULL`, `DEFAULT 'activa'` | spec Entidades clave |
| `cliente_principal_activo` | `INT UNSIGNED GENERATED` | `id_cliente` si `es_principal = 1 AND estado = 'activa'`, si no `NULL`; `UNIQUE` | FR-006 (R15) |

**Reglas**: `administrador` y `recepcionista` crean y finalizan asignaciones y consultan (FR-005,
FR-008). Debe existir el cliente y estar `activo`, y el entrenador debe existir y estar `activo`
(FR-007). La columna generada `cliente_principal_activo` con índice `UNIQUE` garantiza **como máximo
un entrenador principal activo por cliente** (FR-006, R15); reasignar finaliza la anterior y crea la
nueva en una transacción. El historial no se elimina.

### Rutinas (nueva)

| Campo | Tipo | Restricciones | Origen |
|-------|------|---------------|--------|
| `id_rutina` | `INT UNSIGNED` | `PRIMARY KEY AUTO_INCREMENT` | spec Entidades clave |
| `id_cliente` | `INT UNSIGNED` | `NOT NULL`, `FOREIGN KEY → clientes` | FR-010 |
| `id_entrenador` | `INT UNSIGNED` | `NOT NULL`, `FOREIGN KEY → entrenadores` | FR-010 |
| `nombre` | `VARCHAR(100)` | `NOT NULL` | spec Entidades clave |
| `descripcion` | `VARCHAR(255)` | `NULL` permitido | spec Entidades clave |
| `fecha_creacion` | `DATETIME` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | spec Entidades clave |
| `estado` | `ENUM('activa','archivada')` | `NOT NULL`, `DEFAULT 'activa'` | FR-031 (R16) |

**Reglas**: solo el `entrenador` crea y modifica rutinas (FR-009, FR-012), y **solo de clientes
asignados a su carga** activa (FR-012, R20); el `administrador` y el `recepcionista` no crean ni
editan rutinas (FR-012). El cliente y el entrenador deben existir (FR-010). Al crear una rutina
activa nueva para un cliente, la activa anterior pasa a `archivada` conservando el historial (FR-031,
R16). El cliente consulta solo su rutina vigente (FR-017).

### Ejercicios de rutina (nueva)

| Campo | Tipo | Restricciones | Origen |
|-------|------|---------------|--------|
| `id_ejercicio` | `INT UNSIGNED` | `PRIMARY KEY AUTO_INCREMENT` | spec Entidades clave |
| `id_rutina` | `INT UNSIGNED` | `NOT NULL`, `FOREIGN KEY → rutinas` | FR-011 |
| `nombre` | `VARCHAR(100)` | `NOT NULL` | FR-011 |
| `series` | `INT` | `NULL` permitido, `> 0` si se informa | FR-011 |
| `repeticiones` | `VARCHAR(50)` | `NULL` permitido (admite rangos, R17) | FR-011 |
| `peso` | `VARCHAR(50)` | `NULL` permitido | FR-011 (R17) |
| `descanso` | `VARCHAR(50)` | `NULL` permitido | FR-011 (R17) |
| `instrucciones` | `VARCHAR(255)` | `NULL` permitido | FR-011 |
| `orden` | `INT` | `NOT NULL`, `DEFAULT 0` | orden de presentación |

**Reglas**: cada ejercicio pertenece a una rutina y solo se gestiona por el entrenador de la rutina
(FR-012). Se eliminan/actualizan lógicamente al reemplazar la lista de ejercicios de la rutina; el
historial se preserva archivando la rutina (R16).

### Objetivos de entrenamiento (nueva)

| Campo | Tipo | Restricciones | Origen |
|-------|------|---------------|--------|
| `id_objetivo` | `INT UNSIGNED` | `PRIMARY KEY AUTO_INCREMENT` | spec Entidades clave |
| `id_cliente` | `INT UNSIGNED` | `NOT NULL`, `FOREIGN KEY → clientes` | FR-013 |
| `id_entrenador` | `INT UNSIGNED` | `NOT NULL`, `FOREIGN KEY → entrenadores` | FR-013 |
| `descripcion` | `VARCHAR(255)` | `NOT NULL` | FR-013 |
| `valor_objetivo` | `DECIMAL(10,2)` | `NULL` permitido, `> 0` si se informa | FR-013 (R19) |
| `unidad` | `VARCHAR(20)` | `NULL` permitido (kg, cm, repeticiones, minutos) | R19 |
| `fecha_objetivo` | `DATE` | `NULL` permitido | spec Entidades clave |
| `estado` | `ENUM('en_progreso','cumplido','cancelado')` | `NOT NULL`, `DEFAULT 'en_progreso'` | spec Entidades clave |
| `fecha_creacion` | `DATETIME` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | spec Entidades clave |

**Reglas**: solo el `entrenador` registra objetivos de clientes a su cargo (FR-013, FR-016); el
`recepcionista` y el `administrador` no (FR-016). `id_cliente` y `id_entrenador` deben existir
(FR-010 por analogía). El objetivo conserva su historial y su estado (FR-015).

### Progresos del cliente (nueva)

| Campo | Tipo | Restricciones | Origen |
|-------|------|---------------|--------|
| `id_progreso` | `INT UNSIGNED` | `PRIMARY KEY AUTO_INCREMENT` | spec Entidades clave |
| `id_cliente` | `INT UNSIGNED` | `NOT NULL`, `FOREIGN KEY → clientes` | FR-014 |
| `id_entrenador` | `INT UNSIGNED` | `NOT NULL`, `FOREIGN KEY → entrenadores` | FR-014 |
| `id_objetivo` | `INT UNSIGNED` | `NULL` permitido, `FOREIGN KEY → objetivos_entrenamiento` (mismo cliente) | FR-014 |
| `valor` | `DECIMAL(10,2)` | `NOT NULL` | FR-014 |
| `unidad` | `VARCHAR(20)` | `NULL` permitido | FR-014 (R19) |
| `observaciones` | `VARCHAR(255)` | `NULL` permitido | FR-014 |
| `fecha_registro` | `DATETIME` | `NOT NULL`, `DEFAULT CURRENT_TIMESTAMP` | FR-015 |

**Reglas**: solo el `entrenador` registra progresos de clientes a su cargo (FR-014, R20); el
recepcionista y el administrador no (FR-016). Si se asocia `id_objetivo`, este debe pertenecer al
mismo cliente. El historial completo se conserva y se muestra en orden cronológico (FR-015, FR-017).

### Dashboard (sin tabla propia)

- **No** se crea `estadisticas_dashboard`; los indicadores se calculan con consultas agregadas
  (R18). Campos del resumen: `clientesActivos`, `clientesInactivos`, `entrenadoresActivos`,
  `clientesConEntrenador`, `clientesSinEntrenador`, `rutinasActivas`, `objetivosEnProgreso`,
  `membresiasActivas`, `membresiasVencidas`, `accesosRecientes`, `accesosRechazados`. El dashboard
  del recepcionista omite la información financiera y los indicadores reservados al administrador
  (FR-020).

## 2. Relaciones

```text
usuarios
   │  (1:1)
   └── entrenadores
          │
          ├──< asignaciones_entrenador >── clientes
          ├──< rutinas >── clientes
          │        │
          │        └──< ejercicios_rutina
          ├──< objetivos_entrenamiento >── clientes
          └──< progresos_clientes >── clientes
                       │
                       └── (id_objetivo) objetivos_entrenamiento
```

- Todas las llaves foráneas usan `ON DELETE RESTRICT` (se conserva el historial).
- Índices únicos:
  - `entrenadores.id_usuario` (FR-003).
  - `asignaciones_entrenador.cliente_principal_activo` (FR-006, R15).
- Índices de apoyo: `asignaciones_entrenador.id_cliente`, `.id_entrenador`,
  `rutinas.id_cliente`, `.id_entrenador`, `.estado`, `ejercicios_rutina.id_rutina`,
  `objetivos_entrenamiento.id_cliente`, `.id_entrenador`, `.estado`,
  `progresos_clientes.id_cliente`, `.id_objetivo`, `.fecha_registro`.

## 3. Migración y semilla

| Script | Contenido |
|--------|-----------|
| `database/migrations/001_crear_estructura.sql` | Existente (Sprint 1) |
| `database/migrations/002_sprint2_facial_accesos.sql` | Existente (Sprint 2) |
| `database/migrations/003_sprint3_entrenadores_rutinas.sql` | **Nueva**: `entrenadores`, `asignaciones_entrenador`, `rutinas`, `ejercicios_rutina`, `objetivos_entrenamiento`, `progresos_clientes` con llaves foráneas, columna generada e índices |
| `database/seeds/semilla-administrador.js` | Existente |
| `database/seeds/semilla-demo-sprint3.js` | **Opcional**: un entrenador de ejemplo, una asignación y una rutina para la demostración local |

La migración es reejecutable a través del registro `_migraciones_aplicadas` del aplicador
(`database/scripts/aplicar-migraciones.js`).

## 4. Decisiones de modelo derivadas de la investigación

- La unicidad del entrenador principal activo se garantiza con la columna generada
  `cliente_principal_activo` + índice `UNIQUE` (R15).
- Las rutinas se archivan al crear una nueva, conservando el historial (R16, FR-031).
- Los ejercicios admiten series numéricas y repeticiones/peso/descanso como texto (R17).
- El dashboard no tiene tabla propia: se calcula con consultas agregadas (R18).
- Los objetivos y progresos usan valores decimales con unidad flexible (R19).
- El recepcionista gestiona asignaciones pero no rutinas ni progresos; el entrenador solo gestiona
  sus clientes asignados (R20).
- `progresos_clientes.id_objetivo` referencia un objetivo del mismo cliente (FR-014).
