# Base de datos del Sistema de Gestión para Gimnasio

MySQL local con motor `InnoDB` y codificación `utf8mb4`. Los scripts son la única fuente de
verdad de la estructura (FR-023, SC-004).

## Estructura

```text
database/
├── migrations/   # Scripts SQL numerados y versionados
├── seeds/        # Semillas (administrador, demostración y rendimiento)
├── scripts/      # Aplicador de migraciones y medición de rendimiento (ES Modules)
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
| `002_sprint2_facial_accesos.sql` | Tablas `rostros`, `accesos` y `auditoria` del Sprint 2 |
| `003_sprint3_entrenadores_rutinas.sql` | Tablas `entrenadores`, `asignaciones_entrenador`, `rutinas`, `ejercicios_rutina`, `objetivos_entrenamiento` y `progresos_clientes` del Sprint 3 |
| `004_sprint4_optimizacion_reportes.sql` | Índices simples para reportes del Sprint 4 |
| `005_tipos_membresia_iniciales.sql` | Seis tipos de membresía iniciales (Diario, Semanal, Mensual, Trimestral, Semestral y Anual); reejecutable |
| `006_sprint4_indices_compuestos.sql` | Índices compuestos reejecutables sobre `pagos`, `accesos`, `membresias`, `rostros` y `clientes` |

Los cambios de estructura futuros se agregan como **nuevos** archivos numerados; nunca se editan
migraciones ya aplicadas.

## Semillas

- `seeds/semilla-administrador.js`: crea el usuario administrador inicial con hash `bcrypt`.
  Usa `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` (mínimo 8 caracteres) y `SEED_ADMIN_NAME`.
- `seeds/semilla-demo-sprint3.js`: datos de demostración del Sprint 3 (entrenador, asignación y
  rutina). Es idempotente y usa `SEED_TRAINER_EMAIL`, `SEED_TRAINER_PASSWORD` y `SEED_TRAINER_NAME`;
  se omite si no se define la contraseña. No está cableada en `aplicar-migraciones.js`.
- `seeds/semilla-rendimiento-sprint4.js`: crea o renueva 200 clientes, 10,000 pagos y 50,000 accesos
  de prueba distribuidos en un mes. Es reejecutable y limpia solo los datos que crea.

## Scripts

- `scripts/aplicar-migraciones.js`: crea la base si no existe, aplica las migraciones pendientes y
  siembra el administrador inicial.
- `scripts/medir-rendimiento.js`: ejecuta las consultas del reporte financiero, del reporte de
  accesos y de la validación facial; muestra tiempos y el plan `EXPLAIN` de cada una.

## Reglas

- Los archivos físicos de MySQL **no** se suben al repositorio (`.gitignore`).
- Las credenciales viven en `.env`, nunca en el código (FR-025, FR-026).
- Los scripts de `scripts/` usan ES Modules (FR-030).
- Las tablas `tipos_membresia`, `membresias` y `pagos` son solo estructura en el Sprint 1
  (FR-027); sus datos funcionales llegan en el Sprint 2.
- La base completa se reconstruye aplicando `001` a `006` en orden.
- Las variables `FACIAL_UMBRAL` y `FACIAL_MAX_INTENTOS` de `.env` ajustan el reconocimiento facial
  creado por la migración `002`; el frontend lee `VITE_FACIAL_MAX_INTENTOS`.
