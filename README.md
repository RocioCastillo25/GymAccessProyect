# Sistema de Gestión para Gimnasio

Plataforma web para administrar clientes, membresías, pagos y accesos mediante reconocimiento
facial. Proyecto académico desarrollado en cuatro sprints.

**Estado actual**: Sprint 4 completado (reportes financieros y de accesos, exportación CSV/PDF,
alertas de vencimiento próximo y optimización de índices), sobre la base de los Sprints 1, 2 y 3,
más la consulta operativa de pagos y adeudos de la funcionalidad 005.

## Estructura del proyecto

```text
├── frontend/    # Aplicación React (JavaScript)
├── backend/     # API REST con Node.js, Express y ES Modules
├── database/    # Migraciones, semillas y scripts SQL de MySQL local
├── docs/        # Contexto maestro, reglas y alcance de cada sprint
└── specs/       # Especificación, plan y tareas de cada funcionalidad
```

## Alcance por sprint

- **Sprint 1**: autenticación con JWT, usuarios, roles, clientes y estructura base.
- **Sprint 2**: membresías, pagos y control de acceso con reconocimiento facial.
- **Sprint 3**: entrenadores, asignación de entrenador a cliente, rutinas con ejercicios,
  objetivos y progresos, consulta del cliente, dashboard administrativo y personal asignado.
- **Sprint 4**: reportes financieros y de accesos por rango de fechas, exportación a CSV/PDF,
  alertas de membresías por vencer e índices de optimización en MySQL.

El detalle de cada sprint está en `docs/sprint-1.md`, `docs/sprint-2.md`, `docs/sprint-3.md` y
`docs/sprint-4.md`. El reporte explicativo del Sprint 4 está en `docs/reporte-sprint-4.md`.

### Módulos del Sprint 3

| Módulo | Pantalla | Endpoints principales | Roles |
|--------|----------|-----------------------|-------|
| Entrenadores | `Entrenadores.jsx` | `/api/entrenadores` | administrador (gestión), recepcionista (consulta) |
| Asignaciones | `Asignaciones.jsx` | `/api/asignaciones` | administrador, recepcionista |
| Rutinas | `Rutinas.jsx` | `/api/rutinas` | entrenador |
| Objetivos y progresos | `Progreso.jsx` | `/api/objetivos`, `/api/progresos` | entrenador (gestión), administrador y recepcionista (consulta) |
| Mi entrenamiento | `MiEntrenamiento.jsx` | `/api/rutinas/yo`, `/api/objetivos/yo`, `/api/progresos/yo` | cliente |
| Dashboard | `Dashboard.jsx` | `/api/dashboard`, `/api/dashboard/personal` | administrador, recepcionista (resumen operativo) |
| Personal asignado | `PersonalAsignado.jsx` | `/api/asignaciones/entrenador/:idEntrenador` | administrador, recepcionista, entrenador (carga propia) |

La migración del sprint es `database/migrations/003_sprint3_entrenadores_rutinas.sql` y crea las
tablas `entrenadores`, `asignaciones_entrenador`, `rutinas`, `ejercicios_rutina`,
`objetivos_entrenamiento` y `progresos_clientes` en InnoDB con `utf8mb4`.

### Módulos del Sprint 4

| Módulo | Pantalla | Endpoints principales | Roles |
|--------|----------|-----------------------|-------|
| Reportes financieros y de accesos | `Reportes.jsx` | `/api/reports/financial`, `/api/reports/access` | administrador |
| Clientes vencidos | `Reportes.jsx` | `/api/reports/expired-clients` | administrador, recepcionista |
| Exportaciones | `Reportes.jsx` | `POST /api/reports/exports` | administrador (financiero/accesos), administrador y recepcionista (vencidos) |
| Alertas de vencimiento | `Dashboard.jsx`, `Membresias.jsx` | `/api/reports/expiring-memberships` | administrador, recepcionista |

Las migraciones del sprint son `004_sprint4_optimizacion_reportes.sql` y
`006_sprint4_indices_compuestos.sql`. La primera agrega índices simples y la segunda índices
compuestos reejecutables sobre `pagos` (`estado`, `fecha_pago`, `metodo_pago`), `accesos`
(`fecha_hora`, `resultado`, `id_cliente`), `membresias` (`estado`, `fecha_fin`, `id_cliente`),
`rostros` (`estado`) y `clientes` (`apellido`, `nombre`).

Además, `database/migrations/005_tipos_membresia_iniciales.sql` carga seis tipos de membresía
iniciales (Diario, Semanal, Mensual, Trimestral, Semestral y Anual) para poder asignarlos desde el
módulo de Membresías. La migración es reejecutable y no duplica los tipos existentes.

### Consulta de pagos y adeudos (funcionalidad 005)

Operaciones de solo lectura sobre el historial existente: no crean migraciones, no modifican
`POST /api/pagos` y resuelven al cliente de las consultas propias desde el correo del token JWT.

| Endpoint | Consulta | Roles autorizados |
|----------|----------|-------------------|
| `GET /api/pagos` | Historial general con filtros de fecha, cliente y estado, y paginación | administrador, recepcionista |
| `GET /api/pagos/mios` | Pagos del cliente autenticado, con los mismos filtros y paginación | cliente |
| `GET /api/pagos/adeudos` | Adeudos agrupados por cliente, con filtro opcional de cliente y paginación | administrador, recepcionista |
| `GET /api/pagos/adeudos/mios` | Adeudo del cliente autenticado, sin paginación | cliente |

El adeudo es la suma de los pagos con estado `pendiente`; los pagos `completados` y `cancelados` no
cuentan. Las consultas propias ignoran cualquier `idCliente` enviado: el resultado siempre corresponde
al cliente de la sesión. La paginación usa `limite` (50 por defecto, 200 como máximo) y `offset` (0
por defecto).

| Vista | Ruta | Roles autorizados |
|-------|------|-------------------|
| Registro de pagos | `/payments` | administrador, recepcionista |
| Historial de pagos | `/payments/historial` | administrador, recepcionista |
| Adeudos por cliente | `/payments/adeudos` | administrador, recepcionista |
| Mis pagos | `/me/payments` | cliente |
| Mis adeudos | `/me/payments/adeudos` | cliente |

Sin token las respuestas son `401`; con un rol no autorizado, `403`. Los entrenadores no pueden
consultar pagos ni adeudos. La validación detallada está en
`specs/005-consulta-pagos-adeudos/quickstart.md`.

## Requisitos previos

- Node.js 20 o superior
- MySQL 8 o superior ejecutándose en local (host y puerto configurados en `backend/.env` mediante
  `DB_HOST` y `DB_PORT`)

## Instalación

```powershell
# 1. Dependencias
cd backend; npm install; cd ..
cd frontend; npm install; cd ..

# 2. Variables de entorno
copy .env.example .env
copy backend\.env.example backend\.env
# Editar .env y backend\.env con las credenciales reales de MySQL y un JWT_SECRET propio
# Configurar también SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD (mínimo 8 caracteres) y SEED_ADMIN_NAME

# 3. Base de datos: crearla, migrar y sembrar el administrador inicial
node database/scripts/aplicar-migraciones.js
```

## Ejecución del Sprint 4

```powershell
# 1. Aplicar las migraciones 004 a 006 (son reejecutables; omiten lo ya aplicado)
node database/scripts/aplicar-migraciones.js

# 2. Terminal 1: backend (http://localhost:3000)
cd backend; npm run dev

# 3. Terminal 2: frontend (http://localhost:5173)
cd frontend; npm run dev
```

Abrir `http://localhost:5173`, iniciar sesión como administrador y entrar a **Reportes**. El panel
de **Dashboard** muestra las membresías que vencen en los próximos 5 días. El recepcionista también
puede consultar y exportar el reporte de clientes vencidos.

La configuración de CORS es opcional. Si se define `CORS_ORIGIN`, se aceptan uno o varios orígenes
separados por comas, por ejemplo `CORS_ORIGIN=http://localhost:5173`. Si queda vacío, el entorno de
desarrollo mantiene el comportamiento abierto.

## Pruebas

```powershell
cd backend; npm test
cd frontend; npm test
```

Resultado actual: 210 pruebas del backend y 59 pruebas del frontend, todas aprobadas.

## Rendimiento

```powershell
# Crea o renueva 200 clientes, 10,000 pagos y 50,000 accesos de prueba
node database/seeds/semilla-rendimiento-sprint4.js

# Mide las consultas de reportes y validación facial, y muestra EXPLAIN
node database/scripts/medir-rendimiento.js
```

Con la semilla local, el reporte financiero promedia menos de 15 ms, el reporte de accesos menos de
200 ms y la consulta de descriptores faciales menos de 5 ms, por debajo de los objetivos de 3 s y
200 ms.

## Validación del Sprint 4

1. Como administrador, abrir **Reportes**, elegir un rango de fechas y consultar el reporte
   financiero: debe mostrar ingresos totales, cantidad de pagos y desglose por método de pago.
2. Consultar el reporte de accesos: debe mostrar permitidos, rechazados, total y desglose por tipo.
3. Exportar ambos reportes a CSV y comprobar que el archivo se descarga con los datos filtrados.
4. Usar **Imprimir / PDF** y verificar que solo se imprime el reporte, sin el menú de navegación.
5. Consultar y exportar el reporte de clientes vencidos; debe mostrar una fila por cliente, sin
   adeudos monetarios ni datos biométricos.
6. En **Dashboard**, confirmar la lista de membresías por vencer (5 días) y su enlace a
   **Membresías**, donde las filas próximas a vencer aparecen resaltadas.
7. Iniciar sesión como recepcionista: debe ver las alertas y el reporte de clientes vencidos, pero
   no los reportes financieros ni de accesos. Un entrenador o cliente tampoco debe acceder a
   `/api/reports/*`.

Las guías de los sprints anteriores siguen disponibles en
`specs/001-sprint-1-base-sistema/quickstart.md`,
`specs/002-membresias-pagos-acceso-facial/quickstart.md` y
`specs/003-entrenadores-rutinas-dashboard/quickstart.md`.

## Convenciones

- Backend y scripts de `database/scripts/` con ES Modules (`"type": "module"`).
- Frontend sin acceso directo a MySQL: toda consulta pasa por la API REST.
- Comentarios, documentación y mensajes para la persona usuaria en español.
- Commits con Conventional Commits: `tipo(alcance): descripción en español`.

## Integración con Jira mediante MCP

El proyecto incluye una configuración de workspace para conectar VS Code y GitHub Copilot con el
servidor remoto oficial de Atlassian. Esta integración es para las herramientas de desarrollo; no
agrega dependencias ni modifica la aplicación web.

1. Abrir el proyecto en VS Code con GitHub Copilot habilitado.
2. Abrir `.vscode/mcp.json` y elegir **Start** para el servidor `atlassian` (o ejecutar
   **MCP: List Servers** desde la paleta de comandos y arrancarlo).
3. Completar el inicio de sesión de Atlassian en el navegador y aprobar la autorización OAuth.
4. Usar Copilot para consultar o administrar Jira. Las acciones disponibles respetan los permisos
   de la cuenta autenticada.

No se guardan credenciales ni tokens en el repositorio. La autenticación se realiza mediante OAuth
2.1; revisa las acciones que modifiquen Jira antes de confirmarlas. Consulta la
[guía oficial de Atlassian](https://support.atlassian.com/atlassian-ai-gateway/docs/get-started-with-the-atlassian-remote-mcp-server/)
si necesitas solucionar problemas de conexión.
