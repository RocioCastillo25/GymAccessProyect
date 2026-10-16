# Guía de validación rápida: Sprint 2

**Rama**: `002-membresias-pagos-acceso-facial` | **Fecha**: 2026-10-15 | **Plan**: [plan.md](./plan.md)

Ejecución y validación de extremo a extremo. No incluye código de implementación: los contratos
están en [contracts/api-rest.md](./contracts/api-rest.md),
[contracts/formato-errores.md](./contracts/formato-errores.md) y
[contracts/control-acceso.md](./contracts/control-acceso.md), y el modelo de datos en
[data-model.md](./data-model.md).

## 1. Requisitos previos

| Requisito | Versión mínima | Comprobación |
|-----------|----------------|--------------|
| Node.js | 20 LTS | `node -v` |
| MySQL Server | 8.0 | `mysql --version` |
| npm | 10 | `npm -v` |
| Navegador de escritorio | Chrome/Edge/Firefox actualizado, con cámara | — |

Además del Sprint 1, se necesita una **cámara web** para el registro e identificación facial, y
acceso a internet **una sola vez** para instalar dependencias (los modelos faciales se sirven
localmente, R13).

## 2. Configuración inicial

```powershell
# 1. Variables de entorno (raíz y backend/, según .env.example). Se añaden, con valores por defecto:
#    FACIAL_UMBRAL=0.6, FACIAL_MAX_INTENTOS=3
copy .env.example .env
copy backend\.env.example backend\.env

# 2. Base de datos: aplicar migraciones (001 + 002) y semilla
node database/scripts/aplicar-migraciones.js

# 3. Dependencias (incluye la librería de reconocimiento facial en frontend/)
cd backend; npm install; cd ..
cd frontend; npm install; cd ..
```

**Resultado esperado**: las migraciones crean/actualizan las tablas `tipos_membresia`, `membresias`,
`pagos`, `rostros`, `accesos` y `auditoria` (InnoDB/`utf8mb4`) y reconstruyen la base solo con los
scripts de `database/` (SC-007). Los pesos del modelo facial quedan disponibles en
`frontend/public/models/` (R13).

## 3. Arranque

```powershell
# Terminal 1: backend (puerto 3000)
cd backend; npm run dev

# Terminal 2: frontend (puerto 5173, proxy /api → localhost:3000)
cd frontend; npm run dev
```

**Resultado esperado**: `GET http://localhost:3000/api/salud` responde
`{ "estado": "ok", "baseDatos": "conectada" }` y el frontend muestra la pantalla de inicio de
sesión en español.

## 4. Comandos de prueba

```powershell
# Backend: unidad (comparación facial, estados de membresía, adeudos) + integración de API
cd backend; npm test

# Frontend: componentes y captura facial (Vitest + React Testing Library)
cd frontend; npm test
```

**Resultado esperado**: pasan las pruebas de la lógica de comparación facial (distancia euclídea y
umbral con descriptores sintéticos, R14), de la autorización/rechazo de acceso y de la matriz de
permisos por rol (SC-002).

## 4.1 Prueba de la lógica facial sin cámara (R14)

Las pruebas unitarias cubren, con descriptores sintéticos, los casos: coincidencia válida dentro del
umbral, rostro sin coincidencia, y selección del mejor candidato cuando hay varios rostros
similares (FR-018, FR-019).

## 5. Escenarios de validación de extremo a extremo

Ejecutar en orden sobre el entorno local. Cada escenario corresponde a una historia de usuario del
[spec.md](./spec.md).

| # | Escenario | Acción esperada | Criterio |
|---|-----------|-----------------|----------|
| 1 | Registro de tipos de membresía (HU1) | Administrador crea un tipo con duración y precio válidos | `201`; aparece en la consulta (FR-001) |
| 2 | Modificación de tipo (HU1) | Cambiar el precio de un tipo ya usado | El tipo se actualiza; las membresías ya generadas no cambian (FR-003) |
| 3 | Tipo sin permiso (HU1) | Recepcionista o entrenador intentan crear/modificar | `403` (FR-028, SC-002) |
| 4 | Consulta restringida (HU1) | Entrenador lista tipos | Solo `nombre` y `duracion`, sin precio (FR-002) |
| 5 | Asignación de membresía (HU2) | Recepcionista asigna un tipo válido a un cliente existente | `201` con fechas de inicio y fin calculadas (FR-005, FR-006) |
| 6 | Asignación inválida (HU2) | Usar un cliente inexistente o un tipo `inactivo` | `400`/`404`, sin persistir (FR-005) |
| 7 | Renovación (HU3) | Renovar la membresía de un cliente con historial | Nueva vigencia y la anterior se conserva (FR-008) |
| 8 | Renovación sin membresía (HU3) | Renovar un cliente sin membresía | `404` con mensaje claro (HU3 esc. 2) |
| 9 | Registro de pago (HU4) | Recepcionista registra un pago válido | `201`; el pago aparece en el historial del cliente (FR-011) |
| 10 | Pago inválido (HU4) | Enviar monto `0`, negativo o método fuera del catálogo | `400`, sin persistir (FR-011, FR-029) |
| 11 | Pago sin permiso (HU4) | Entrenador o cliente intentan registrar un pago | `403` (FR-028) |
| 12 | Historial y adeudos (HU5) | Administrador consulta pagos y adeudos | Se listan pagos y los clientes con membresía activa sin pago (FR-012, FR-015) |
| 13 | Pagos propios (HU5) | Cliente consulta sus pagos y adeudos | Solo ve su información (FR-013) |
| 14 | Registro facial (HU6) | Recepcionista captura el rostro de un cliente existente con la cámara | `201`; el rostro queda asociado sin duplicar al cliente (FR-016, FR-017) |
| 15 | Registro facial duplicado (HU6) | Volver a registrar el mismo cliente | Actualiza la información existente (HU6 esc. 3) |
| 16 | Descriptor protegido (HU6) | Consultar cualquier endpoint | Ninguna respuesta incluye `descriptorFacial` (FR-020, SC-004) |
| 17 | Identificación correcta (HU7) | Un cliente registrado se presenta ante la cámara | El sistema lo identifica correctamente (FR-018, SC-005) |
| 18 | Rostro no reconocido (HU7) | Presentar un rostro no registrado | No identifica a nadie; se reporta no reconocido (FR-019) |
| 19 | Acceso autorizado (HU8) | Identificar a un cliente con membresía vigente | `resultado: autorizado` y acceso registrado (FR-021, FR-024) |
| 20 | Acceso con membresía vencida (HU8) | Identificar a un cliente con membresía vencida | Rechazo con motivo y registro del intento (FR-023, SC-006) |
| 21 | Acceso sin membresía (HU8) | Identificar a un cliente sin membresía | Rechazo con motivo y registro (FR-023) |
| 22 | Todo intento se registra (HU8) | Revisar `accesos` tras los casos anteriores | 100 % de intentos con resultado y, si rechazado, con motivo (FR-024, SC-003) |
| 23 | Consulta de accesos (HU9) | Recepcionista lista accesos autorizados y rechazados | Se muestran fecha, hora, resultado y motivo del rechazo (FR-026) |
| 24 | Accesos propios (HU9) | Cliente consulta su historial de accesos | Solo ve sus propios accesos (FR-027) |
| 25 | Cámara sin rostro (Casos límite) | Capturar una imagen sin rostro | Se registra como no reconocido; no se autoriza (FR-019) |
| 26 | MySQL no disponible (Casos límite) | Detener MySQL e intentar validar un acceso | Error controlado, sin autorizar y sin stack traces |
| 27 | Reconstrucción completa (SC-007) | Borrar la base y reejecutar `aplicar-migraciones.js` | Base reconstruida solo con scripts de `database/` |
| 28 | Sin secretos en el repositorio (SC-008) | Revisar el repositorio | `.env` ignorado, `.env.example` sin credenciales reales |
| 29 | Frontend sin acceso a MySQL (SC-009) | Revisar `frontend/` | Sin conexión directa a MySQL ni credenciales de base de datos |
| 30 | Auditoría (FR-036) | Administrador consulta `GET /api/auditoria` | Se registran las acciones del sprint; solo el administrador accede |

## 6. Demostración del flujo (SC-001)

Con el administrador sembrado, completar en menos de 5 minutos: registrar un tipo de membresía →
asignar la membresía a un cliente → registrar el pago → registrar el rostro del cliente →
identificar al cliente con la cámara → validar el acceso (autorizado) → consultar el registro de
accesos.

## 7. Criterios de aceptación cubiertos

- Tipos de membresía y membresías: escenarios 1 a 8 (FR-001 a FR-010).
- Pagos y adeudos: escenarios 9 a 13 (FR-011 a FR-015).
- Reconocimiento facial: escenarios 14 a 18 y 25 (FR-016 a FR-020, SC-004, SC-005).
- Control de acceso: escenarios 19 a 22 (FR-021 a FR-025, SC-003, SC-006).
- Consulta de accesos: escenarios 23 y 24 (FR-026, FR-027).
- Seguridad, base de datos y arquitectura: escenarios 26 a 30 (FR-028 a FR-037, SC-002, SC-007 a SC-009).
- Cobertura total de las 9 historias de usuario: SC-010.
