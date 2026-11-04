<!--
Plantilla de insumo para /speckit.specify.
-->

# Insumo de especificación - Sprint 4: Reportes avanzados, notificaciones automáticas y optimización para despliegue

> **Referencias obligatorias para el agente:**
> - Contexto maestro: `docs/project-context.md`
> - Constitución: `docs/reglas.md` (y `.specify/memory/constitution.md` una vez ratificada)
> - Sprints anteriores: `docs/sprint-1.md`, `docs/sprint-2.md`, `docs/sprint-3.md`
> - Este documento describe únicamente el alcance de este sprint.

---

## 1. Contexto del sprint

Este sprint finaliza el ciclo de desarrollo de **GymAccess** cerrando la brecha entre la operación en vivo y la toma de decisiones estratégicas del negocio. Se implementará el módulo de reportes analíticos exportables (ingresos por periodo, asistencias por horario, clientes morosos/vencidos), el sistema de notificaciones en tiempo real/alertas visuales para avisar sobre membresías a punto de expirar y la preparación del entorno para despliegue (optimización de consultas MySQL con índices, variables de entorno de producción y scripts de compilación).

La aplicación mantendrá la arquitectura estándar establecida:
- `frontend/`: Aplicación React con JavaScript y Vite.
- `backend/`: Servidor Node.js + Express en **ES Modules** (`"type": "module"`).
- `database/`: Scripts de migración, semillas e índices optimizados de MySQL.

Toda la comunicación continúa realizándose vía API REST y las reglas de seguridad/permisos de backend aplicarán estrictamente para restringir el acceso a reportes financieros al rol de **Administrador**.

---

## 2. Objetivo

Desarrollar el módulo de reportería exportable y alertas de vencimiento, además de realizar las optimizaciones de rendimiento y configuraciones necesarias para garantizar la estabilidad del sistema GymAccess antes de su despliegue en un entorno de producción.

---

## 3. Historias de usuario del sprint

### US-S4-01 — Generación de reporte financiero de ingresos
Como administrador, quiero consultar y exportar un reporte detallado de ingresos por rangos de fecha y método de pago para auditar las finanzas del gimnasio.

### US-S4-02 — Reporte de accesos y concurrencia
Como administrador, quiero consultar el historial consolidado de accesos autorizados y rechazados con filtros por cliente y fecha para analizar horas pico y patrones de asistencia.

### US-S4-03 — Notificación de membresías por vencer
Como recepcionista o administrador, quiero visualizar un panel de alertas con los clientes cuya membresía vencerá en los próximos 5 días para gestionar su renovación oportuna.

### US-S4-04 — Exportación de reportes a PDF/Excel
Como administrador, quiero descargar los reportes de finanzas y asistencias en formato PDF y/o Excel (CSV) para archivado o presentación externa.

### US-S4-05 — Optimización de base de datos e índices
Como sistema/desarrollador, quiero implementar índices SQL y consultas optimizadas para garantizar respuestas rápidas (<200ms) en la validación de acceso facial y reportes.

---

## 4. Flujo demostrable al cierre del sprint

1. El administrador ingresa al módulo de **Reportes y Analítica**.
2. Selecciona un rango de fechas (ej. Mes actual) y hace clic en "Generar Reporte Financiero".
3. El backend procesa las consultas agregadas sobre las tablas `pagos` y `membresias` y devuelve el desglose de ingresos.
4. El administrador presiona "Exportar a PDF" y descarga la vista formateada.
5. El recepcionista ingresa al panel principal y observa la lista de **Alertas de Vencimiento Próximo** (clientes a vencer en $\le 5$ días).
6. El sistema procesa la autenticación facial en el punto de acceso ejecutando consultas indexadas sobre `rostros` y `membresias` en menos de 200 ms.

---

## 5. Entidades y tablas que toca este sprint

| Tabla / Entidad | Operaciones principales en este sprint |
|---|---|
| `pagos` | Consultar con agregaciones (`SUM`, `GROUP BY`), crear índices en `fecha_pago` |
| `accesos` | Consultar con agregaciones por fecha y hora, crear índices en `fecha_hora` |
| `membresias` | Consultar estados por vencimiento (`fecha_fin`), crear índices en `estado` y `fecha_fin` |
| `clientes` | Consultar información asociada a notificaciones y reportes |
| `auditoria` | Registrar la generación de reportes sensibles y configuraciones |

---

## 6. Reglas de negocio aplicables

- **RN-S4-01**: Solo los usuarios con rol `administrador` pueden consultar o exportar información financiera (pagos e ingresos).
- **RN-S4-02**: Las alertas de vencimiento considerarán únicamente las membresías activas cuyo vencimiento sea igual o menor a 5 días respecto a la fecha actual (`DATEDIFF(fecha_fin, CURDATE()) <= 5`).
- **RN-S4-03**: Toda exportación de archivos (PDF/Excel) debe realizarse del lado del cliente o backend sin almacenar archivos temporales permanentes en el servidor.
- **RN-S4-04**: Todas las claves foráneas y columnas de filtrado frecuente (`cliente_id`, `fecha_pago`, `fecha_hora`, `estado`) deben contar con un índice explícito en MySQL.
- **RN-S4-05**: El backend no debe retornar credenciales, secretos ni datos biométricos crudos en las respuestas de reportes.

---

## 7. Criterios de aceptación (Patrones EARS)

### 7.1 Reportes y Exportación
- **Event-driven**: CUANDO el administrador solicita el reporte de ingresos filtrado por rango de fechas, EL SISTEMA DEBE calcular el total recaudado, desglosado por tipo de membresía y método de pago.
- **Event-driven**: CUANDO el administrador pulsa el botón "Exportar PDF", EL SISTEMA DEBE generar y descargar un documento estructurado con el encabezado de GymAccess y los totales correspondientes.
- **Unwanted behavior**: SI un usuario con rol `recepcionista` o `entrenador` intenta acceder al endpoint de reportes financieros `/api/reports/financial`, ENTONCES EL SISTEMA DEBE responder con un código de estado `403 Forbidden`.

### 7.2 Notificaciones y Rendimiento
- **Event-driven**: CUANDO el recepcionista abre el dashboard o módulo de membresías, EL SISTEMA DEBE destacar visualmente (color amarillo/alerta) a los clientes con membresías que vencen en 5 días o menos.
- **Event-driven**: CUANDO se realiza una consulta de validación de acceso por reconocimiento facial, EL SISTEMA DEBE resolver la búsqueda del cliente y el estado de su membresía en un tiempo de respuesta menor a 200 milisegundos.
- **Unwanted behavior**: SI el rango de fechas seleccionado para un reporte no contiene registros, ENTONCES EL SISTEMA DEBE mostrar una tabla vacía con la leyenda "No hay registros para este periodo", sin romper la interfaz.

---

## 8. Fuera de alcance de este sprint

- Envío de correos electrónicos SMS o WhatsApp automáticos (se limita a alertas en interfaz/panel).
- Pasarelas de pago en línea (Stripe, PayPal, MercadoPago).
- App nativa móvil iOS/Android.

---

## 9. Decisiones pendientes para `/speckit.clarify`

- ¿Se utilizará una librería como `jspdf` / `pdfmake` en el frontend o se generará el PDF mediante un stream desde Express en el backend?
- ¿El cálculo de horas pico en el reporte de accesos se agrupará por horas exactas (ej. 08:00 - 09:00) o por turnos (Mañana, Tarde, Noche)?

---

## 10. Restricciones técnicas heredadas

- Mantenimiento estricto de **ES Modules** en el backend (`import`/`export`).
- React + Vite en el frontend.
- Cero consultas directas a MySQL desde el cliente.
- Manejo de variables de entorno mediante `.env` para producción y desarrollo.