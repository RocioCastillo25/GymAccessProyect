# Investigación: Sprint 3 - Entrenadores, rutinas y dashboard administrativo

**Rama**: `003-entrenadores-rutinas-dashboard` | **Fecha**: 2026-10-15 | **Plan**: [plan.md](./plan.md)

Documento de la Fase 0 de `/speckit.plan`. Resuelve las decisiones técnicas que dejó abiertas la
especificación y las "Preguntas abiertas para `/speckit.clarify`". Cada entrada sigue el formato:
**Decisión**, **Justificación**, **Alternativas consideradas**. La numeración continúa la serie del
proyecto (el Sprint 2 usó R1–R14), por lo que este sprint comienza en R15.

---

## R15. Definición de "entrenador principal" y reasignación

- **Decisión**: la relación cliente–entrenador se modela en `asignaciones_entrenador` como un
  histórico. Un cliente puede tener **como máximo una** asignación con `es_principal = 1` y
  `estado = 'activa'`. Para reforzarlo en la base de datos se usa una columna generada
  `cliente_principal_activo` (`id_cliente` cuando `es_principal = 1 AND estado = 'activa'`, en caso
  contrario `NULL`) con índice `UNIQUE` (MySQL permite múltiples `NULL`). Reasignar consiste en
  finalizar la asignación principal vigente (`estado = 'finalizada'`) y crear una nueva dentro de
  una transacción; el historial anterior se conserva.
- **Justificación**: cumple RN del sprint ("un cliente puede tener un solo entrenador principal
  asignado en el periodo activo") y conserva la evolución; el índice generado garantiza la regla a
  nivel de base de datos, no solo en el servicio.
- **Alternativas consideradas**:
  - *Columna `id_entrenador` directamente en `clientes`*: rechazada porque pierde el historial de
    asignaciones que el sprint exige conservar.
  - *Comprobación solo en el servicio*: insuficiente ante condiciones de carrera; se combina con la
    restricción de base de datos.
  - *Índice único parcial*: MySQL 8 no admite índices parciales; se sustituye por una columna
    generada con índice único.

## R16. Modelo de rutinas e historial

- **Decisión**: cada rutina es una fila en `rutinas` con `estado ENUM('activa','archivada')`. Un
  cliente puede acumular varias rutinas a lo largo del tiempo; al crear una nueva rutina activa para
  un cliente, la rutina activa anterior se marca como `archivada` dentro de una transacción. La
  rutina "vigente" de un cliente es la de estado `activa` más reciente.
- **Justificación**: cumple "la información de rutinas... deberá mantenerse histórica para poder
  evaluar evolución y cumplimiento" y evita ambigüedad sobre cuál es la rutina actual.
- **Alternativas consideradas**:
  - *Una sola rutina por cliente (sobrescribir)*: rechazada por perder historial.
  - *Sin estado, mostrar siempre la última*: menos explícito para el usuario y para el dashboard.

## R17. Ejercicios de rutina: detalle y campos

- **Decisión**: los ejercicios viven en `ejercicios_rutina` con `nombre` (obligatorio),
  `series` (`INT`, opcional), `repeticiones` (`VARCHAR(50)`, opcional, admite rangos o texto como
  "10-12"), `peso` (`VARCHAR(50)`, opcional), `descanso` (`VARCHAR(50)`, opcional) e
  `instrucciones` (`VARCHAR(255)`, opcional). Se permite crear la rutina con su lista de ejercicios
  en una sola petición.
- **Justificación**: cubre "ejercicios, series, repeticiones o instrucciones" (FR-011) sin forzar
  unidades rígidas; deja flexibilidad para rutinas de fuerza (peso) o cardiovasculares (tiempo).
- **Alternativas consideradas**:
  - *Repeticiones solo numéricas*: rechazada porque muchas rutinas usan rangos ("8-10") o tiempo.
  - *Catálogo cerrado de ejercicios*: fuera de alcance; añade administración no prevista.

## R18. Dashboard: sin tabla propia, consultas agregadas

- **Decisión**: **no** se crea la tabla `estadisticas_dashboard` mencionada de forma orientativa en
  `docs/sprint-3.md`. El dashboard se alimenta de consultas agregadas (`COUNT`, `SUM`, `GROUP BY`)
  sobre `clientes`, `entrenadores`, `asignaciones_entrenador`, `rutinas`, `progresos_clientes`,
  `membresias` y `accesos`. Opcionalmente puede exponerse una vista SQL de solo lectura, sin
  almacenamiento adicional.
- **Justificación**: el propio documento de sprint indica que el dashboard "se alimentará
  principalmente de consultas y agregados... sin requerir almacenamiento adicional complejo más allá
  de vistas o consultas consolidadas". Evita duplicar estado y desincronización.
- **Alternativas consideradas**:
  - *Tabla materializada actualizada por job*: rechazada por complejidad e infraestructura fuera del
    MVP.
  - *Vista SQL*: aceptable como apoyo, pero el cálculo se centraliza en el servicio para poder
    filtrar por rol y probar la lógica.

## R19. Objetivos y progresos: unidades y validación

- **Decisión**: `objetivos_entrenamiento` guarda `descripcion`, `valor_objetivo` (`DECIMAL(10,2)`,
  opcional), `unidad` (`VARCHAR(20)`, opcional: kg, cm, repeticiones, minutos, etc.),
  `fecha_objetivo` (`DATE`, opcional) y `estado ENUM('en_progreso','cumplido','cancelado')`.
  `progresos_clientes` guarda `valor` (`DECIMAL(10,2)`, obligatorio), `unidad` (`VARCHAR(20)`),
  `id_objetivo` (opcional, del mismo cliente) y `observaciones` (`VARCHAR(255)`, opcional). El
  sistema conserva todos los progresos en orden cronológico y calcula el avance comparando el último
  valor con el objetivo.
- **Justificación**: FR-013 a FR-015 exigen objetivos medibles e historial; valores decimales con
  unidad flexible permiten peso, medidas o tiempos sin un esquema rígido.
- **Alternativas consideradas**:
  - *Solo texto libre*: rechazado por no permitir medir avance.
  - *Esquema de unidades cerrado*: rechazado por limitar el tipo de seguimiento del gimnasio.

## R20. Permisos del recepcionista sobre asignaciones, rutinas y progresos

- **Decisión**: el recepcionista puede **crear, consultar y finalizar** asignaciones de entrenador y
  consultar el estado general del personal. **No** puede crear ni editar rutinas, objetivos ni
  progresos (solo el entrenador a cargo). El administrador puede consultar asignaciones y el estado
  general, y tampoco crea ni edita rutinas ni progresos (coherente con FR-012 y FR-016).
- **Justificación**: sigue las reglas del sprint ("el recepcionista puede consultar información de
  asignación y estado general del personal, pero no puede editar rutinas ni progresos médicos o
  deportivos").
- **Alternativas consideradas**:
  - *Permitir al recepcionista solo crear asignaciones sin finalizarlas*: rechazado por dejar
    asignaciones obsoletas sin gestión.
  - *Permitir al administrador editar rutinas*: rechazado por la regla del sprint; la gestión de
    rutinas es responsabilidad del entrenador.

## R21. Endpoints y formato de errores del sprint

- **Decisión**: se añaden recursos REST coherentes con los sprints previos
  (`/api/entrenadores`, `/api/asignaciones`, `/api/rutinas`, `/api/objetivos`, `/api/progresos`,
  `/api/dashboard`) con los métodos y roles del [contrato](./contracts/api-rest.md). Se reutiliza el
  formato de errores `{ mensaje, codigo, errores? }` y se añaden códigos nuevos
  (`ENTRENADOR_INVALIDO`, `ENTRENADOR_YA_ASIGNADO`, `CLIENTE_SIN_ENTRENADOR`,
  `RUTINA_INVALIDA`, `RUTINA_FUERA_DE_CARGA`, `PROGRESO_INVALIDO`, `OBJETIVO_INVALIDO`).
- **Justificación**: consistencia con los Sprints 1 y 2 y con el principio de manejo centralizado de
  errores; el frontend ya interpreta el campo `codigo`.
- **Alternativas consideradas**:
  - *Nuevo formato de errores*: rechazado por inconsistencia innecesaria.
  - *Rutas anidadas profundamente* (p. ej. `/clientes/:id/rutinas`): se prefieren rutas planas con
    filtros por recurso para mantener consistencia con los sprints previos.

## R22. Navegación y estado en el frontend

- **Decisión**: se mantiene la navegación por estado (sin router). `App.jsx` gana las nuevas
  `VISTAS` (`entrenadores`, `asignaciones`, `rutinas`, `progresos`, `dashboard`, `mi-entrenamiento`)
  y `components/MenuPrincipal.jsx` añade las `OPCIONES` filtradas por rol. El acceso a la API se hace
  con el helper `pedir` de `services/api.js`; la sesión y el rol provienen de `SesionContext`.
- **Justificación**: consistencia con los Sprints 1 y 2 y con la constitución (sin router ni librería
  de estado adicional).
- **Alternativas consideradas**:
  - *React Router*: rechazado por ser una dependencia nueva no aprobada y por la convención vigente.

## R22 bis. Reportes básicos (alcance del dashboard)

- **Decisión**: los "reportes básicos" del MVP se cubren con el dashboard y las consultas por rol
  (asignaciones por entrenador, progreso por cliente). No se implementa exportación (PDF/CSV) en este
  sprint.
- **Justificación**: mantiene el alcance acotado; la exportación no aparece en el flujo demostrable
  del Sprint 3.
- **Alternativas consideradas**: *Exportación CSV*: diferida como mejora futura.

## R23. Estrategia de pruebas del sprint

- **Decisión**: pruebas de **integración** con `vitest` + `supertest` para entrenadores,
  asignaciones (incluida la unicidad del entrenador principal), rutinas, objetivos, progresos y
  dashboard, más la matriz de permisos por rol; pruebas de **componentes** con React Testing Library
  para las pantallas nuevas. La validación E2E se documenta en `quickstart.md`. Estas pruebas
  requieren MySQL disponible en `127.0.0.1:3307` (misma dependencia que el Sprint 2).
- **Justificación**: replica el principio X de la constitución y la estrategia del Sprint 2; las
  reglas de negocio (unicidad, permisos, historial) son deterministas y verificables por API.
- **Alternativas consideradas**:
  - *Solo pruebas manuales*: rechazado por la constitución.
  - *Mocks de base de datos*: rechazados para las pruebas de integración porque el equipo quiere
    verificar el comportamiento real de MySQL.

## R24. Registro de auditoría del sprint

- **Decisión**: se reutiliza `services/auditoria.service.js` (`registrarAccion`, best-effort) para
  registrar: registro y modificación de entrenadores, activación/desactivación, creación y
  finalización de asignaciones, creación/archivado de rutinas, creación de objetivos y registro de
  progresos. Módulos: `entrenadores`, `asignaciones`, `rutinas`, `objetivos`, `progresos`.
- **Justificación**: cumple FR-030 y la regla de auditoría del sprint ("registrar cambios relevantes
  en la asignación del entrenador, creación de rutinas y actualizaciones de progreso").
- **Alternativas consideradas**:
  - *Auditoría solo en algunos controladores*: rechazado por inconsistencia; se centraliza.

---

## Ítems que permanecen diferidos (no bloquean este sprint)

| Ítem | Motivo del diferimiento |
|------|--------------------------|
| Exportación de reportes (CSV/PDF) | Mejora futura fuera del flujo demostrable del Sprint 3. |
| Clases grupales, horarios y asistencia compleja | Fuera del alcance definido en `docs/sprint-3.md`. |
| Seguimiento médico o nutricional | Fuera del MVP. |
| Notificaciones o recordatorios automáticos | No previstos en el alcance. |
| Tabla materializada de estadísticas | Sustituida por consultas agregadas (R18). |
