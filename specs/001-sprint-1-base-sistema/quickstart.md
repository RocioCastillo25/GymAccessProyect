# Guía de validación rápida: Sprint 1

**Rama**: `001-sprint-1-base-sistema` | **Fecha**: 2026-10-09 | **Plan**: [plan.md](./plan.md)

Guía de ejecución y validación de extremo a extremo. No incluye código de implementación: los
contratos están en [contracts/api-rest.md](./contracts/api-rest.md) y
[contracts/formato-errores.md](./contracts/formato-errores.md), y el modelo de datos en
[data-model.md](./data-model.md).

## 1. Requisitos previos

| Requisito | Versión mínima | Comprobación |
|-----------|----------------|--------------|
| Node.js | 20 LTS | `node -v` |
| MySQL Server | 8.0 | `mysql --version` |
| npm | 10 | `npm -v` |
| Navegador de escritorio | Chrome/Edge/Firefox actualizado | — |

Se necesita un usuario de MySQL dedicado para la aplicación (no `root`) con permisos sobre la base
de datos del proyecto.

## 2. Configuración inicial

```powershell
# 1. Variables de entorno (raíz del proyecto y backend/, según .env.example)
copy .env.example .env
copy backend\.env.example backend\.env
# Editar .env: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET,
# JWT_EXPIRES_IN=60m, SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD (≥ 8 caracteres)

# 2. Base de datos: crear la base y aplicar migraciones + semilla
node database/scripts/aplicar-migraciones.js

# 3. Dependencias
cd backend; npm install; cd ..
cd frontend; npm install; cd ..
```

**Resultado esperado**: las migraciones crean las 5 tablas (InnoDB/`utf8mb4`) y la semilla crea el
usuario administrador sin duplicarlo si ya existía (SC-004).

## 3. Arranque

```powershell
# Terminal 1: backend (puerto 3000)
cd backend; npm run dev

# Terminal 2: frontend (puerto 5173, con proxy /api → localhost:3000)
cd frontend; npm run dev
```

**Resultado esperado**: `GET http://localhost:3000/api/salud` responde
`{ "estado": "ok", "baseDatos": "conectada" }` y el frontend muestra la pantalla de inicio de
sesión en español.

## 4. Comandos de prueba

```powershell
# Backend: unidad + integración de API (Vitest + supertest)
cd backend; npm test

# Frontend: componentes (Vitest + React Testing Library)
cd frontend; npm test
```

**Resultado esperado**: todas las pruebas pasan, incluyendo la matriz de permisos por rol
(SC-002) y el rechazo de contraseñas con menos de 8 caracteres.

## 5. Escenarios de validación de extremo a extremo

Ejecutar en orden sobre el entorno local. Cada escenario corresponde a una historia de usuario
del [spec.md](./spec.md).

| # | Escenario | Acción esperada | Criterio |
|---|-----------|-----------------|----------|
| 1 | Inicio de sesión (HU1) | Iniciar con `SEED_ADMIN_EMAIL` y su contraseña | Se recibe token JWT (60 min) y el menú muestra solo funciones de administrador |
| 2 | Credenciales inválidas (HU1) | Enviar una contraseña incorrecta | `401` con mensaje genérico que no revela si el correo existe (FR-005) |
| 3 | Token expirado (HU1) | Usar un token con más de 60 minutos, o manipularlo | `401` y redirección al inicio de sesión |
| 4 | Registro de usuarios (HU3) | Administrador crea un usuario con contraseña válida | `201`; el usuario nuevo inicia sesión correctamente |
| 5 | Correo duplicado de usuario (HU3) | Reintentar el mismo correo | `409`, sin duplicar el registro (FR-012) |
| 6 | Contraseña corta (HU3) | Enviar contraseña de 7 caracteres | `400` y el usuario no se crea (FR-011) |
| 7 | Asignación de roles (HU4) | Cambiar el rol de un usuario de entrenador a recepcionista | Las funciones disponibles del usuario cambian |
| 8 | Usuario desactivado (HU4) | Desactivar un usuario e intentar iniciar sesión | `401` con mensaje genérico (FR-010) |
| 9 | Registro de clientes (HU2) | Administrador y recepcionista registran clientes válidos | `201` y los clientes aparecen en la consulta |
| 10 | Correo duplicado de cliente (HU2) | Registrar un correo ya existente | `409`, nada se persiste (FR-020) |
| 11 | Validación de entrada (HU2) | Enviar el formulario con campos obligatorios vacíos | `400` con errores por campo y sin persistencia (FR-018) |
| 12 | Modificación de clientes (HU5) | Cambiar el teléfono de un cliente | La consulta muestra el valor actualizado |
| 13 | Negación por rol (HU2, HU5, HU6) | Entrenador o cliente intentan crear/modificar clientes | `403` desde el backend (SC-002) |
| 14 | Consulta con rol entrenador (HU6) | Entrenador lista los clientes | Solo `nombre`, `apellido` y `estado`; sin correo, teléfono, dirección ni fecha de registro |
| 15 | Información propia (HU7) | Cliente consulta sus datos | Ve solo su registro; al pedir otro cliente → `403` |
| 16 | MySQL no disponible (Casos límite) | Detener MySQL y usar la aplicación | Error controlado, sin stack traces ni credenciales |
| 17 | Reconstrucción completa (SC-004) | Borrar la base y reejecutar `aplicar-migraciones.js` | Base reconstruida solo con scripts de `database/` |
| 18 | Sin secretos en el repositorio (SC-005) | Revisar el repositorio | `.env` ignorado, `.env.example` sin credenciales reales |

## 6. Demostración del flujo (SC-001)

Con el usuario administrador sembrado, completar en menos de 5 minutos: iniciar sesión →
registrar un cliente → modificarlo → consultarlo → cambiar de usuario con rol entrenador y
verificar la lista restringida.

## 7. Criterios de aceptación cubiertos

- Autenticación, roles y permisos: escenarios 1 a 8 y 13 (SC-002, SC-003).
- Clientes: escenarios 9 a 15 (SC-006).
- Base de datos y seguridad del repositorio: escenarios 16 a 18 (SC-004, SC-005, SC-007).
- Convenciones del backend (ES Modules): comprobación estática de
  `backend/package.json` (`"type": "module"`) y ausencia de `require()` (SC-008).
