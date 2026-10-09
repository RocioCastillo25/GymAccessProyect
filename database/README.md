# Base de datos del Sistema de Gestión para Gimnasio

MySQL local con motor `InnoDB` y codificación `utf8mb4`. Los scripts son la única fuente de
verdad de la estructura (FR-023, SC-004).

## Estructura

```text
database/
├── migrations/   # Scripts SQL numerados y versionados
├── seeds/        # Semillas (usuario administrador inicial)
├── scripts/      # Aplicador de migraciones (ES Modules)
└── README.md
```

## Uso

```powershell
# Aplica las migraciones pendientes, crea la base si no existe y siembra al administrador
node database/scripts/aplicar-migraciones.js
```

El aplicador:

1. Se conecta con las variables de entorno `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` y
   `DB_NAME`.
2. Crea la base de datos con `utf8mb4` si no existe.
3. Ejecuta en orden los archivos de `migrations/` que aún no se hayan aplicado y los registra en
   la tabla `_migraciones_aplicadas`.
4. Ejecuta la semilla del usuario administrador (idempotente).

## Migraciones

| Archivo | Contenido |
|---------|-----------|
| `001_crear_estructura.sql` | Tablas `usuarios`, `clientes`, `tipos_membresia`, `membresias` y `pagos` con llaves primarias, foráneas e índices únicos |

Los cambios de estructura futuros se agregan como **nuevos** archivos numerados
(`002_*.sql`, `003_*.sql`); nunca se editan migraciones ya aplicadas.

## Semillas

- `seeds/semilla-administrador.js`: crea el usuario administrador inicial con hash `bcrypt`.
  Usa `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` (mínimo 8 caracteres) y `SEED_ADMIN_NAME`.

## Reglas

- Los archivos físicos de MySQL **no** se suben al repositorio (`.gitignore`).
- Las credenciales viven en `.env`, nunca en el código (FR-025, FR-026).
- Los scripts de `scripts/` usan ES Modules (FR-030).
- Las tablas `tipos_membresia`, `membresias` y `pagos` son solo estructura en el Sprint 1
  (FR-027); sus datos funcionales llegan en el Sprint 2.
