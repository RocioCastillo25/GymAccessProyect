# Guía rápida de validación: Consulta de pagos y adeudos

**Rama**: `005-consulta-pagos-adeudos` | **Fecha**: 2026-11-20 | **Plan**:
[plan.md](./plan.md)

Esta guía permite verificar la funcionalidad de extremo a extremo (interfaz → API → base de datos).
No incluye código de implementación: los contratos están en
[contracts/api-rest.md](./contracts/api-rest.md) y las estructuras en
[data-model.md](./data-model.md).

## 1. Requisitos previos

- Node.js 20 o superior.
- MySQL 8 local en ejecución, con las variables `DB_*` configuradas en `backend/.env`.
- Archivos `.env` creados desde `.env.example` y `backend/.env.example`, sin secretos versionados.
- Dependencias instaladas en `backend/` y `frontend/`.

## 2. Preparación

Desde la raíz del repositorio:

```powershell
node database/scripts/aplicar-migraciones.js
cd backend; npm install; cd ..
cd frontend; npm install; cd ..
```

El aplicador de migraciones es reejecutivo y omite los scripts ya aplicados. Esta funcionalidad no
requiere ninguna migración nueva. El script siembra el usuario administrador inicial si no existe;
las credenciales se toman de `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` y
`SEED_ADMIN_NAME`.

Para obtener tokens de prueba, inicie sesión con `POST /api/auth/login`. Para las pruebas con rol
`cliente`, use un usuario con ese rol cuyo correo coincida con un cliente registrado; en las pruebas
automáticas se usa el helper `backend/tests/helpers/usuarios.js` (`usuarioYToken`).

## 3. Ejecución

```powershell
# Terminal 1: API REST en http://localhost:3000
cd backend; npm run dev

# Terminal 2: interfaz en http://localhost:5173
cd frontend; npm run dev
```

## 4. Pruebas automáticas

```powershell
cd backend; npm test
cd frontend; npm test
```

Resultado esperado: todas las pruebas de `pagosConsulta.test.js`,
`pagoConsulta.validator.test.js` y las pruebas de componentes nuevas pasan, y no se registran
regresiones en las pruebas de `pagosRegistro.test.js` ni en las del Sprint 4.

## 5. Validación funcional

### 5.1 Historial general

1. Inicie sesión como administrador o recepcionista y abra **Pagos → Historial**.
2. Compruebe que cada fila muestra identificador, cliente, membresía, monto, fecha, método y estado.
3. Filtre por rango de fechas, cliente y estado: deben mostrarse solo los pagos que cumplen todos
   los filtros, ordenados por fecha descendente.
4. Compruebe que `total` refleja todas las coincidencias y que la primera página contiene como
   máximo 50 pagos; solicite la siguiente página con `offset` y verifique que no se repiten filas.
5. Filtre por un periodo sin pagos: debe aparecer "No hay pagos para los filtros seleccionados.",
   con lista vacía y totales en cero.
6. Envíe `fechaInicio` posterior a `fechaFin`, `estado` desconocido, `idCliente = 0`,
   `limite = 201` u `offset = -1`: cada caso debe responder `400` con un mensaje claro.

### 5.2 Adeudos generales

1. En **Pagos → Adeudos**, verifique una fila por cliente con adeudo, con su resumen, total y
   detalle de pagos pendientes.
2. Cree o use pagos en los tres estados: solo los `pendientes` deben sumar al total y aparecer en el
   detalle; los `completados` y `cancelados` no.
3. Compruebe que un pago pendiente sin membresía aparece igualmente en el adeudo.
4. Filtre por un cliente sin adeudos: debe devolver `totalAdeudado = 0`, detalle vacío y el mensaje
   "No hay adeudos registrados.".
5. Solicite `idCliente` inexistente: debe devolver la lista vacía, sin revelar si el cliente existe.

### 5.3 Consultas del cliente

1. Inicie sesión como cliente y abra **Mis pagos**: solo deben aparecer sus pagos, con los mismos
   filtros y paginación del historial general.
2. Abra **Mis adeudos**: debe mostrar solo su total pendiente y su detalle, o el mensaje de estado
   vacío cuando no haya adeudos.
3. Envíe `idCliente` de otro cliente en la consulta: el resultado no debe cambiar.
4. Con el token del cliente, solicite `GET /api/pagos` y `GET /api/pagos/adeudos`: ambos deben
   responder `403`.

### 5.4 Seguridad

1. Sin cabecera `Authorization`, `GET /api/pagos` debe responder `401`.
2. Con token de entrenador, los cuatro endpoints de consulta deben responder `403`.
3. Revise las respuestas: no deben contener contraseñas, secretos ni descriptores faciales.
4. Compruebe que no existe acceso directo del frontend a MySQL: todas las vistas usan
   `services/api.js`.

### 5.5 Rendimiento

```powershell
# Volumen de prueba: 200 clientes y 10,000 pagos
node database/seeds/semilla-rendimiento-sprint4.js
```

1. Repita las consultas de historial y adeudos con el volumen de prueba y mida el tiempo de
   respuesta: el objetivo es menos de 500 ms.
2. Verifique con `EXPLAIN` que las consultas usan índices, por ejemplo:

```sql
EXPLAIN SELECT id_pago, id_cliente, monto, fecha_pago, estado
FROM pagos
WHERE estado = 'pendiente'
ORDER BY fecha_pago DESC
LIMIT 50;
```

El plan debe mostrar uso de `idx_pagos_estado_fecha` o `idx_fecha_pago` en lugar de un escaneo
completo de la tabla.

## 6. Criterios de aceptación verificados

| Criterio | Verificación |
|----------|--------------|
| SC-001 | Los pagos mostrados coinciden con los filtros y el rango solicitado. |
| SC-002 | El cliente ve solo sus pagos y adeudos, aunque envíe otro `idCliente`. |
| SC-003 | Sin token hay `401`; con rol no autorizado hay `403`. |
| SC-004 | Los totales de adeudos coinciden con la suma de pagos `pendientes`. |
| SC-005 | Los estados vacíos muestran el mensaje y totales en cero. |
| SC-006 | Las consultas responden en menos de 500 ms con 10,000 pagos. |
| SC-007 | Ninguna respuesta contiene credenciales, secretos ni datos biométricos. |
| SC-008 | Las tres historias funcionan de extremo a extremo en el entorno local. |
