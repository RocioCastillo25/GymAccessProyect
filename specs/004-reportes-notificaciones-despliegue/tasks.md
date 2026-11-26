# Tareas: Sprint 4 - Reportes avanzados, alertas y despliegue

**Entrada**: Documentos de diseño en `/specs/004-reportes-notificaciones-despliegue/`

**Prerrequisitos**: `plan.md` (obligatorio), `spec.md` (obligatorio para historias de usuario),
`research.md` (decisiones). Los contratos y el modelo de datos descritos en `plan.md` se materializan
durante la Fase 1 y se validan al implementar cada historia.

**Pruebas**: se incluyen tareas de prueba porque la constitución (principio X) exige probar las
funciones principales antes de considerarlas terminadas y el spec define criterios de éxito
verificables.

**Organización**: las tareas se agrupan por historia de usuario para que cada una pueda
implementarse y probarse de forma independiente. El orden de fases respeta la prioridad del spec:
P1 (US1, US2, US3), luego P2 (US4, US5, US7) y al final P3 (US6).

## Formato: `[ID] [P?] [Story] Descripción`

- **[P]**: puede ejecutarse en paralelo (archivos distintos, sin dependencia de tareas incompletas).
- **[Story]**: historia de usuario a la que pertenece la tarea (`US1` a `US7`).
- Todas las rutas de archivo son relativas a la raíz del repositorio.

## Convenciones de rutas

- Backend: `backend/src/` y `backend/tests/`.
- Frontend: `frontend/src/` y `frontend/src/tests/`.
- Base de datos: `database/migrations/`, `database/seeds/` y `database/scripts/`.
- Documentación del sprint: `docs/` y `specs/004-reportes-notificaciones-despliegue/`.

---

## Fase 1: Configuración inicial (infraestructura compartida)

**Propósito**: dejar listas las piezas comunes que usan todos los reportes y las exportaciones.

- [ ] T001 [P] Crear `backend/src/validators/reporte.validator.js` con validación de `fechaInicio` y
  `fechaFin` (`YYYY-MM-DD`, fechas reales, rango inclusivo, inicio ≤ fin), `idCliente` entero
  positivo, `metodoPago` texto no vacío, `resultado` en `autorizado|rechazado` y `buscar` texto
  opcional.
- [X] T002 [P] Crear `frontend/src/utils/reportes.js` con helpers para construir CSV (BOM UTF-8,
  separador `;`, escape de comillas), descargar `Blob` con `URL.revokeObjectURL`, generar nombres de
  archivo y formatear filtros activos.
- [ ] T003 [P] Crear `backend/src/services/reporteExportacion.service.js` con
  `registrarExportacion({ idUsuario, reporte, formato, filtros })` usando `auditoria.service.js` de
  forma best-effort (un fallo de auditoría no bloquea la descarga).

## Fase 2: Fundamentos (bloquean todas las historias)

**Propósito**: infraestructura mínima que deben compartir los reportes.

**⚠ CRÍTICO**: ninguna historia de usuario comienza hasta completar esta fase.

- [ ] T004 [P] Exponer `POST /api/reports/exports` en `backend/src/routes/reports.routes.js` y
  `registrarExportacion` en `backend/src/controllers/reporte.controller.js`; validar que el rol
  corresponda al reporte (`financiero`/`accesos` solo administrador; `vencidos` administrador y
  recepcionista).
- [X] T005 [P] Agregar en `frontend/src/styles/styles.css` los estilos de reportes, estados vacíos,
  alertas y `@media print` para ocultar navegación, filtros y botones al imprimir.
- [ ] T006 [P] Crear `backend/tests/helpers/reportes.js` con utilidades para crear clientes, tipos de
  membresía, membresías, pagos y accesos de prueba con identificadores únicos y limpieza posterior.
- [ ] T007 Refactorizar `backend/src/services/reporte.service.js` para exponer la validación de
  filtros desde `reporte.validator.js` y una función compartida `registrarGeneracionReporte` que
  registre en auditoría la generación de cada reporte.

**Punto de control**: la validación, la auditoría de exportación, los estilos y los helpers de prueba
están listos.

---

## Fase 3: Historia de usuario 1 - Reporte financiero de ingresos (Prioridad: P1) — MVP

**Meta**: que el administrador consulte y exporte el reporte financiero por rango de fechas y método
de pago, con totales y desgloses correctos.

**Prueba independiente**: un administrador autenticado genera el reporte de un periodo con pagos
completados, pendientes y cancelados; el total solo suma los completados y el desglose por método y
tipo de membresía coincide con los datos de prueba.

### Pruebas de la Historia 1

- [ ] T008 [P] [US1] Agregar pruebas de integración en
  `backend/tests/integration/reportesFinanciero.test.js`: `401` sin token, `403` para recepcionista,
  entrenador y cliente, `400` con rango inválido o incompleto, exclusión de pagos pendientes y
  cancelados, filtro `metodoPago`, desglose por tipo de membresía, periodo vacío y registro en
  auditoría.
- [ ] T009 [P] [US1] Agregar pruebas unitarias en `backend/tests/unit/reporte.validator.test.js` para
  fechas inválidas, rango invertido, `idCliente` inválido, `metodoPago` vacío y `resultado` fuera del
  enum.

### Implementación de la Historia 1

- [ ] T010 [US1] Extender en `backend/src/models/reporte.model.js` las consultas
  `resumenFinanciero`, `ingresosPorMetodoPago` e `ingresosPorTipoMembresia` para aceptar un
  `metodoPago` opcional y aplicarlo con parámetros, manteniendo `estado = 'completado'` y el rango
  inclusivo.
- [ ] T011 [US1] Actualizar en `backend/src/services/reporte.service.js`
  `generarReporteFinanciero` para validar `metodoPago`, pasarlo a las consultas y registrar la
  generación con el rango y el filtro aplicados.
- [ ] T012 [US1] Actualizar `backend/src/controllers/reporte.controller.js` y
  `backend/src/presenters/reporte.presentador.js` para aceptar `metodoPago` y devolver `filtros` con
  el formato `{ fechaInicio, fechaFin, metodoPago }`.
- [ ] T013 [US1] Actualizar la sección financiera de `frontend/src/pages/Reportes.jsx` con un selector
  opcional de método de pago, envío del parámetro `metodoPago`, visualización de filtros activos,
  totales, desgloses y el mensaje "No hay registros para este periodo".
- [ ] T014 [P] [US1] Agregar pruebas de componente en
  `frontend/src/tests/ReportesFinanciero.test.jsx` para el filtro por método, el estado vacío, los
  totales y el mensaje de error de permisos.

**Punto de control**: el reporte financiero funciona de extremo a extremo y constituye el MVP del
sprint.

---

## Fase 4: Historia de usuario 2 - Reporte de accesos y concurrencia (Prioridad: P1)

**Meta**: que el administrador consulte el historial de accesos por rango de fechas, cliente y
resultado, con distribución por franja horaria y motivos de rechazo.

**Prueba independiente**: un administrador genera el reporte de un periodo con accesos autorizados y
rechazados; los totales, las franjas horarias y los motivos de rechazo coinciden con los datos de
prueba.

### Pruebas de la Historia 2

- [ ] T015 [P] [US2] Agregar pruebas de integración en
  `backend/tests/integration/reportesAccesos.test.js`: `403` para roles no administradores, filtro por
  `resultado`, filtro por `idCliente`, suma de franjas horarias igual al total, motivos de rechazo,
  periodo vacío y ausencia de datos biométricos en la respuesta.

### Implementación de la Historia 2

- [ ] T016 [US2] Extender en `backend/src/models/reporte.model.js` `accesosAgrupados` para aceptar
  `resultado` y agregar `motivosRechazo` agrupando por `motivo_rechazo` cuando el resultado sea
  rechazado.
- [ ] T017 [US2] Actualizar en `backend/src/services/reporte.service.js`
  `generarReporteAccesos` para validar `resultado`, calcular `porMotivoRechazo` y garantizar que la
  suma de `porHora` sea igual a `resumen.totalAccesos`.
- [ ] T018 [US2] Actualizar `backend/src/presenters/reporte.presentador.js` y
  `backend/src/controllers/reporte.controller.js` para incluir `filtros.resultado` y
  `porMotivoRechazo` sin exponer descriptores faciales.
- [ ] T019 [US2] Actualizar la sección de accesos de `frontend/src/pages/Reportes.jsx` con filtro por
  resultado, tabla por hora, tabla de motivos de rechazo y mensaje de periodo sin registros.
- [ ] T020 [P] [US2] Agregar pruebas de componente en
  `frontend/src/tests/ReportesAccesos.test.jsx` para el filtro por resultado, la tabla por hora, los
  motivos de rechazo y el estado vacío.

**Punto de control**: el reporte de accesos funciona de extremo a extremo y es independiente del
reporte financiero.

---

## Fase 5: Historia de usuario 3 - Alertas de membresías por vencer (Prioridad: P1)

**Meta**: que el administrador y el recepcionista vean las membresías activas que vencen en los
próximos 5 días, con cliente, tipo, fecha y días restantes, resaltadas visualmente.

**Prueba independiente**: con membresías que vencen hoy, en 5 días, en 6 días, vencidas y suspendidas,
el panel muestra solo las de 0 a 5 días y ningún otro rol ve datos de clientes.

### Pruebas de la Historia 3

- [ ] T021 [P] [US3] Agregar pruebas de integración en
  `backend/tests/integration/alertasVencimiento.test.js`: administrador y recepcionista reciben `200`;
  entrenador y cliente reciben `403`; se incluyen hoy y el día 5; se excluyen el día 6, las vencidas y
  las suspendidas; la respuesta no contiene `descriptorFacial`; sin alertas devuelve lista vacía.

### Implementación de la Historia 3

- [ ] T022 [US3] Revisar en `backend/src/models/reporte.model.js` `membresiasPorVencer` para usar
  `estado = 'activa' AND DATEDIFF(fecha_fin, CURDATE()) BETWEEN 0 AND 5`, ordenar por `fecha_fin` y
  devolver cliente, correo, teléfono, tipo, `fecha_fin` y `dias_restantes`.
- [ ] T023 [US3] Revisar en `backend/src/services/reporte.service.js` y
  `backend/src/presenters/reporte.presentador.js` que las alertas calculen `diasRestantes` y no
  incluyan datos biométricos.
- [ ] T024 [US3] Ajustar `frontend/src/pages/Dashboard.jsx` y `frontend/src/pages/Membresias.jsx` para
  mostrar la tabla de alertas, el color de advertencia, el mensaje "No hay membresías por vencer en
  los próximos 5 días" y el acceso del recepcionista.
- [ ] T025 [P] [US3] Agregar pruebas de componente en
  `frontend/src/tests/AlertasVencimiento.test.jsx` para la tabla de alertas, el estado vacío y la
  visibilidad por rol.

**Punto de control**: las alertas funcionan de forma independiente y cubren el caso límite del día 5.

---

## Fase 6: Historia de usuario 4 - Exportación de reportes a PDF y CSV (Prioridad: P2)

**Meta**: que el administrador descargue los reportes financiero y de accesos en CSV y PDF con los
mismos filtros, totales y filas que ve en pantalla, sin archivos temporales ni descargas duplicadas.

**Prueba independiente**: con un reporte generado, el administrador exporta CSV y PDF; el archivo CSV
contiene los mismos totales y filtros y el PDF impreso conserva encabezado, rango y tablas.

### Pruebas de la Historia 4

- [X] T026 [P] [US4] Agregar pruebas unitarias en `frontend/src/tests/reportesUtils.test.js` para el
  CSV (BOM, separador `;`, escape de comillas, metadatos y nombre de archivo) y para la ausencia de
  tokens o datos biométricos.
- [ ] T027 [P] [US4] Agregar pruebas de integración en
  `backend/tests/integration/reportesExportacion.test.js` para `POST /api/reports/exports`: `401` sin
  token, `403` por rol incorrecto, `200` con registro en auditoría y validación de `reporte`/`formato`.

### Implementación de la Historia 4

- [X] T028 [US4] Implementar en `frontend/src/pages/Reportes.jsx` la exportación CSV del reporte
  financiero y del reporte de accesos usando los helpers de `frontend/src/utils/reportes.js`, con
  metadatos, filtros activos y totales.
- [X] T029 [US4] Implementar la exportación PDF con `window.print()` y los estilos de impresión de
  `frontend/src/styles/styles.css`, asegurando encabezado "GymAccess", rango, filtros y totales.
- [X] T030 [US4] Deshabilitar los botones de exportación mientras hay una descarga en curso y evitar
  descargas duplicadas o archivos temporales, en `frontend/src/pages/Reportes.jsx`.
- [X] T031 [US4] Invocar `POST /api/reports/exports` después de iniciar cada exportación desde
  `frontend/src/pages/Reportes.jsx`, sin bloquear la descarga si la auditoría falla.
- [ ] T032 [P] [US4] Agregar pruebas de componente en
  `frontend/src/tests/ReportesExportacion.test.jsx` para exportar con datos, exportar un periodo vacío
  y verificar que no se duplica la descarga al presionar dos veces.

**Punto de control**: las exportaciones respetan los filtros y no dejan archivos ni descargas
duplicadas.

---

## Fase 7: Historia de usuario 5 - Optimización de base de datos e índices (Prioridad: P2)

**Meta**: que las consultas de reportes y la validación de acceso facial usen índices y cumplan los
tiempos objetivo en el entorno local de demostración.

**Prueba independiente**: se reconstruye la base solo con migraciones, se cargan datos
representativos, `EXPLAIN` muestra uso de índices y las consultas de reportes y acceso facial cumplen
los tiempos objetivo.

### Pruebas de la Historia 5

- [ ] T033 [P] [US5] Agregar pruebas de integración en
  `backend/tests/integration/indicesRendimiento.test.js` que verifiquen la existencia de los índices
  compuestos en `information_schema.statistics` y que `EXPLAIN` de las consultas de reportes no
  devuelva `ALL` en las tablas filtradas.

### Implementación de la Historia 5

- [ ] T034 [P] [US5] Crear `database/migrations/006_sprint4_indices_compuestos.sql` reejecutable con
  los índices `pagos (estado, fecha_pago)`, `pagos (estado, fecha_pago, metodo_pago)`,
  `accesos (fecha_hora, resultado)`, `accesos (fecha_hora, id_cliente, resultado)`,
  `membresias (id_cliente, estado, fecha_fin)`, `membresias (estado, fecha_fin)`,
  `rostros (estado)` y `clientes (apellido, nombre)`, comprobando `information_schema.statistics`
  antes de crear cada uno.
- [ ] T035 [P] [US5] Crear `database/seeds/semilla-rendimiento-sprint4.js` con al menos 10,000 pagos y
  50,000 accesos distribuidos en un mes, más clientes, tipos de membresía y membresías asociadas;
  debe ser reejecutable y limpiar solo los datos que crea.
- [ ] T036 [US5] Crear `database/scripts/medir-rendimiento.js` para ejecutar las consultas del
  reporte financiero, del reporte de accesos y de la validación de acceso facial, medir tiempos y
  mostrar el plan `EXPLAIN` de cada consulta.
- [ ] T037 [US5] Ejecutar migraciones, semilla de rendimiento y `medir-rendimiento.js`; documentar en
  `docs/reporte-sprint-4.md` los índices usados, los tiempos obtenidos y el cumplimiento de < 200 ms
  para acceso facial y < 3 s para reportes.
- [ ] T038 [US5] Si la validación facial supera 200 ms de forma sostenida, agregar una caché en
  memoria de descriptores activos en `backend/src/models/rostro.model.js` invalidada al registrar o
  actualizar un rostro, sin cambiar el contrato de `backend/src/services/acceso.service.js`.

**Punto de control**: la base se reconstruye con migraciones versionadas y las consultas usan índices
con tiempos demostrables.

---

## Fase 8: Historia de usuario 7 - Reporte de clientes vencidos (Prioridad: P2)

**Meta**: que el administrador y el recepcionista consulten y exporten los clientes con membresía
vencida o sin membresía activa, sin calcular adeudos.

**Prueba independiente**: con clientes con membresía vigente, vencida, varias vencidas y sin
membresía, el reporte muestra una fila por cliente vencido o sin membresía, excluye a los vigentes y
no contiene montos de adeudo.

### Pruebas de la Historia 7

- [ ] T039 [P] [US7] Agregar pruebas de integración en
  `backend/tests/integration/reportesVencidos.test.js`: administrador y recepcionista reciben `200`;
  entrenador y cliente reciben `403`; una fila por cliente; se excluyen clientes con membresía activa
  vigente; se incluyen clientes sin membresía; filtros por rango de `fecha_fin` y por `buscar`;
  ausencia de campos de adeudo; leyenda de reporte vacío; auditoría de generación.

### Implementación de la Historia 7

- [X] T040 [US7] Agregar en `backend/src/models/reporte.model.js` la consulta `clientesVencidos` con
  una subconsulta que obtenga la membresía vencida más reciente por cliente (`fecha_fin DESC,
  id_membresia DESC`) y un `NOT EXISTS` que excluya a los clientes con membresía `activa` y
  `fecha_fin >= CURDATE()`; incluir clientes sin membresía con `LEFT JOIN`.
- [X] T041 [US7] Agregar en `backend/src/services/reporte.service.js` `generarReporteVencidos` con
  validación de fechas y `buscar`, auditoría de generación y sin cálculos de adeudo.
- [X] T042 [US7] Agregar `presentarReporteVencidos` en
  `backend/src/presenters/reporte.presentador.js` y el controlador/ruta
  `GET /api/reports/expired-clients` en `backend/src/controllers/reporte.controller.js` y
  `backend/src/routes/reports.routes.js` con roles administrador y recepcionista.
- [X] T043 [US7] Agregar en `frontend/src/pages/Reportes.jsx` la sección de clientes vencidos con
  filtros de fecha y búsqueda, tabla de cliente, contacto, tipo, fecha de fin y estado, y el mensaje
  "No hay clientes vencidos para este periodo".
- [X] T044 [US7] Habilitar el acceso del recepcionista al reporte de vencidos en
  `frontend/src/App.jsx` y `frontend/src/components/Navbar.jsx`, manteniendo los reportes financiero
  y de accesos solo para administrador.
- [X] T045 [US7] Implementar la exportación CSV y PDF del reporte de clientes vencidos en
  `frontend/src/pages/Reportes.jsx`, con los mismos filtros y sin datos biométricos ni adeudos, y
  registrar la exportación en `POST /api/reports/exports`.
- [ ] T046 [P] [US7] Agregar pruebas de componente en
  `frontend/src/tests/ReportesVencidos.test.jsx` para la tabla, los filtros, el estado vacío y la
  visibilidad por rol.

**Punto de control**: el reporte de vencidos funciona para administrador y recepcionista y no
introduce cálculos financieros.

---

## Fase 9: Historia de usuario 6 - Preparación del entorno para despliegue (Prioridad: P3)

**Meta**: que el frontend compile y el backend arranque con variables de entorno documentadas, sin
secretos versionados.

**Prueba independiente**: en un entorno nuevo se copian los `.env.example`, se completa la
configuración, se compila el frontend y se inicia el backend sin errores; el repositorio no contiene
`.env` ni credenciales reales.

### Pruebas de la Historia 6

- [ ] T047 [P] [US6] Agregar una verificación de configuración en
  `backend/tests/integration/configuracion.test.js` que compruebe que `entorno.js` exige las
  variables obligatorias en desarrollo y que acepta `CORS_ORIGIN` opcional.

### Implementación de la Historia 6

- [X] T048 [US6] Actualizar `.env.example` de la raíz y `backend/.env.example` con `NODE_ENV`,
  `CORS_ORIGIN` y las variables de reportes/rendimiento necesarias, sin credenciales reales.
- [ ] T049 [US6] Actualizar `backend/src/config/entorno.js` para leer `CORS_ORIGIN` y
  `backend/src/app.js` para restringir CORS cuando la variable esté definida, manteniendo el
  comportamiento actual en desarrollo.
- [X] T050 [US6] Actualizar `README.md` con los pasos de compilación del frontend, arranque del
  backend, variables de entorno, reconstrucción de la base y verificación de ausencia de secretos.
- [ ] T051 [US6] Ejecutar `frontend: npm run build` y `backend: npm start` con la configuración
  documentada; registrar el resultado en `docs/reporte-sprint-4.md`.
- [ ] T052 [US6] Ejecutar la revisión de secretos con `git ls-files` y búsqueda de `.env`,
  contraseñas y claves; documentar en `docs/reporte-sprint-4.md` que `.env` no está versionado y que
  los `.env.example` no contienen valores reales.

**Punto de control**: el sistema se compila y arranca de forma reproducible sin secretos en el
repositorio.

---

## Fase 10: Pulido y aspectos transversales

**Propósito**: cerrar documentación, pruebas completas y consistencia del sprint.

- [X] T053 [P] Actualizar la tabla de módulos y endpoints del Sprint 4 en `README.md` con reportes de
  vencidos y exportaciones.
- [X] T054 [P] Actualizar `docs/reporte-sprint-4.md` con las nuevas funciones, los índices, los
  resultados de rendimiento y la validación de despliegue.
- [ ] T055 [P] Revisar que `backend/package.json` y `frontend/package.json` no tengan dependencias
  nuevas y que todos los comentarios y mensajes visibles estén en español.
- [ ] T056 Ejecutar `npm test` en `backend/package.json` y `frontend/package.json`; corregir
  regresiones y dejar todas las pruebas en verde.
- [ ] T057 Ejecutar los escenarios de validación de extremo a extremo del plan (reportes, alertas,
  exportaciones, vencidos, índices y despliegue) y registrar el resultado en
  `docs/reporte-sprint-4.md`.
- [ ] T058 Revisar que ninguna respuesta de `backend/src/controllers/reporte.controller.js` o
  `frontend/src/pages/Reportes.jsx` incluya credenciales, tokens, rutas internas o descriptores
  faciales, y que no queden archivos temporales en el servidor.

**Punto de control final**: las 7 historias de usuario están implementadas, probadas y documentadas.

---

## Dependencias y orden de ejecución

### Dependencias por fase

- **Fase 1 (Configuración inicial)**: puede comenzar de inmediato.
- **Fase 2 (Fundamentos)**: depende de la Fase 1 y bloquea todas las historias.
- **Fase 3 (US1, P1)**: depende de la Fase 2; es el MVP.
- **Fase 4 (US2, P1)**: depende de la Fase 2; puede ejecutarse en paralelo con US1 si se coordinan
  los cambios en `reporte.model.js`, `reporte.service.js` y `Reportes.jsx`.
- **Fase 5 (US3, P1)**: depende de la Fase 2; es independiente de US1 y US2.
- **Fase 6 (US4, P2)**: depende de US1 y US2 porque exporta sus reportes.
- **Fase 7 (US5, P2)**: depende de la Fase 2; los índices benefician a todas las historias, pero la
  medición de reportes requiere US1 y US2.
- **Fase 8 (US7, P2)**: depende de la Fase 2; reutiliza los helpers de exportación y auditoría de
  US4.
- **Fase 9 (US6, P3)**: depende de que el resto de funcionalidades estén integradas para validar el
  arranque final.
- **Fase 10 (Pulido)**: depende de todas las historias completadas.

### Dependencias internas relevantes

- T007 depende de T001.
- T010, T011 y T012 dependen de T001 y T007.
- T016, T017 y T018 dependen de T001 y T007.
- T022 y T023 dependen de T007.
- T028 a T031 dependen de T002, T004 y de que US1/US2 estén implementadas.
- T034 y T035 dependen de la estructura de índices definida en `plan.md` y `research.md`.
- T040 a T042 dependen de T001, T002, T004 y T007.
- T043 a T045 dependen de T040 a T042 y de T028 a T031.
- T049 depende de T048.
- T051 y T052 dependen de T048 y T049.

---

## Oportunidades de ejecución en paralelo

### Fase 1

```text
T001 (validador backend) | T002 (helpers frontend) | T003 (auditoría de exportación)
```

### Fase 2

```text
T004 (ruta de exportación) | T005 (estilos) | T006 (helpers de prueba)
T007 (servicio compartido) debe esperar a T001.
```

### Historia 1

```text
T008 (pruebas de integración) | T009 (pruebas unitarias)
T010 → T011 → T012 → T013 → T014
```

### Historia 2

```text
T015 (pruebas de integración) en paralelo con T016 (modelo)
T017 → T018 → T019 → T020
```

### Historia 3

```text
T021 (pruebas de integración) en paralelo con T022 (modelo)
T023 → T024 → T025
```

### Historia 4

```text
T026 (pruebas de helpers) | T027 (pruebas de auditoría)
T028 → T029 → T030 → T031 → T032
```

### Historia 5

```text
T033 (pruebas de índices) | T034 (migración) | T035 (semilla)
T036 → T037 → T038
```

### Historia 7

```text
T039 (pruebas de integración) en paralelo con T040 (modelo)
T041 → T042 → T043 → T044 → T045 → T046
```

### Historia 6

```text
T047 (prueba de configuración) | T048 (env.example)
T049 → T050 → T051 → T052
```

---

## Estrategia de implementación

### MVP primero (solo US1)

1. Completar Fase 1 y Fase 2.
2. Completar Fase 3 (reporte financiero).
3. **DETENERSE y VALIDAR**: generar el reporte financiero con pagos completados, pendientes y
   cancelados, aplicar el filtro por método y verificar los totales.
4. Demostrar el MVP si está listo.

### Entrega incremental

1. Fase 1 + Fase 2 → base lista.
2. US1 → probar y demostrar el reporte financiero (MVP).
3. US2 → probar y demostrar el reporte de accesos.
4. US3 → probar y demostrar las alertas de vencimiento.
5. US4 → probar y demostrar las exportaciones CSV/PDF.
6. US5 → medir y demostrar índices y rendimiento.
7. US7 → probar y demostrar el reporte de clientes vencidos.
8. US6 → validar compilación, arranque y ausencia de secretos.
9. Fase 10 → cerrar documentación y pruebas completas.

### Estrategia con varios desarrolladores

1. Todo el equipo completa Fase 1 y Fase 2.
2. Después del punto de control:
   - Desarrollador A: US1 y US4 (financiero y su exportación).
   - Desarrollador B: US2 y US3 (accesos y alertas).
   - Desarrollador C: US5 y US7 (índices/rendimiento y clientes vencidos).
   - Desarrollador D: US6 y documentación final.
3. Coordinar los cambios compartidos en `backend/src/models/reporte.model.js`,
   `backend/src/services/reporte.service.js`, `backend/src/presenters/reporte.presentador.js`,
   `frontend/src/pages/Reportes.jsx` y `frontend/src/styles/styles.css` para evitar conflictos.

---

## Notas

- `[P]` indica tareas en archivos distintos y sin dependencias pendientes.
- Cada historia deja una prueba independiente y un punto de control verificable.
- Las pruebas se escriben antes de la implementación correspondiente y deben fallar primero.
- No se agregan dependencias nuevas; si una tarea parece requerirlo, se debe justificar y actualizar
  la constitución antes de continuar.
- Los reportes son de solo lectura: ninguna tarea debe modificar pagos, accesos, membresías ni
  clientes.
- No se versionan secretos ni archivos `.env`; las exportaciones no contienen datos biométricos.
- Confirmar cada tarea o grupo lógico con un commit pequeño siguiendo Conventional Commits en
  español.
