// T007 - Pruebas de integración del historial general de pagos (005-FR-001, 005-FR-003 a 005-FR-008).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import app from '../../src/app.js';
import { consultar, ejecutar, cerrarPool } from '../../src/config/baseDatos.js';
import { usuarioYToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';

let tokenAdmin = '';
let tokenRecepcionista = '';
let tokenEntrenador = '';
let tokenCliente = '';

const idsClientes = [];

async function crearCliente() {
  const correo = `historial.cliente.${randomUUID()}@pruebas.local`;
  const resultado = await ejecutar(
    'INSERT INTO clientes (nombre, apellido, correo, estado) VALUES (?, ?, ?, ?);',
    ['Cliente', 'Historial', correo, 'activo']
  );
  idsClientes.push(resultado.insertId);
  return resultado.insertId;
}

async function crearPago(idCliente, monto, fechaPago, estado = 'completado') {
  await ejecutar(
    'INSERT INTO pagos (id_cliente, id_membresia, monto, fecha_pago, metodo_pago, estado) VALUES (?, NULL, ?, ?, ?, ?);',
    [idCliente, monto, fechaPago, 'efectivo', estado]
  );
}

function consultarHistorial(token, consulta = '') {
  const peticion = request(app).get(`/api/pagos${consulta}`);
  return token ? peticion.set('Authorization', `Bearer ${token}`) : peticion;
}

function consultaCon(parametros) {
  return `?${new URLSearchParams(parametros).toString()}`;
}

beforeAll(async () => {
  tokenAdmin = (await usuarioYToken('administrador')).token;
  tokenRecepcionista = (await usuarioYToken('recepcionista')).token;
  tokenEntrenador = (await usuarioYToken('entrenador')).token;
  tokenCliente = (await usuarioYToken('cliente')).token;
});

afterAll(async () => {
  if (idsClientes.length > 0) {
    const marcadores = idsClientes.map(() => '?').join(', ');
    await consultar(`DELETE FROM pagos WHERE id_cliente IN (${marcadores});`, idsClientes);
    await consultar(`DELETE FROM clientes WHERE id_cliente IN (${marcadores});`, idsClientes);
  }
  await limpiarUsuariosPrueba();
  await cerrarPool();
});

describe('Historial general de pagos', () => {
  it('el administrador recibe pagos con el formato del contrato y orden descendente', async () => {
    const idCliente = await crearCliente();
    await crearPago(idCliente, 100, '2026-11-08 10:00:00');
    await crearPago(idCliente, 200, '2026-11-10 10:00:00', 'pendiente');

    const respuesta = await consultarHistorial(tokenAdmin, consultaCon({ idCliente }));

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.limite).toBe(50);
    expect(respuesta.body.offset).toBe(0);
    expect(respuesta.body.total).toBe(2);
    expect(respuesta.body.montoTotal).toBe(300);
    expect(respuesta.body.pagos).toHaveLength(2);
    expect(respuesta.body.pagos[0]).toMatchObject({
      idCliente,
      monto: 200,
      metodoPago: 'efectivo',
      estado: 'pendiente',
    });
    expect(Object.keys(respuesta.body.pagos[0]).sort()).toEqual(
      ['estado', 'fechaPago', 'id', 'idCliente', 'idMembresia', 'metodoPago', 'monto'].sort()
    );
    expect(respuesta.body.pagos[0].id).toBeGreaterThan(respuesta.body.pagos[1].id);
  });

  it('el recepcionista también consulta el historial', async () => {
    const idCliente = await crearCliente();
    await crearPago(idCliente, 75, '2026-11-09 12:00:00');

    const respuesta = await consultarHistorial(tokenRecepcionista, consultaCon({ idCliente }));

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.pagos).toHaveLength(1);
    expect(respuesta.body.pagos[0].monto).toBe(75);
  });

  it('combina filtros de fecha, cliente y estado', async () => {
    const idCliente = await crearCliente();
    await crearPago(idCliente, 10, '2026-11-01 08:00:00', 'pendiente');
    await crearPago(idCliente, 20, '2026-11-15 08:00:00', 'pendiente');
    await crearPago(idCliente, 30, '2026-11-20 08:00:00', 'cancelado');
    await crearPago(idCliente, 40, '2026-12-01 08:00:00', 'pendiente');

    const respuesta = await consultarHistorial(
      tokenAdmin,
      consultaCon({ idCliente, fechaInicio: '2026-11-01', fechaFin: '2026-11-30', estado: 'pendiente' })
    );

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(2);
    expect(respuesta.body.pagos.map((pago) => pago.monto)).toEqual([20, 10]);
  });

  it('respeta limite y offset sin alterar el total general', async () => {
    const idCliente = await crearCliente();
    await crearPago(idCliente, 10, '2026-11-01 08:00:00');
    await crearPago(idCliente, 20, '2026-11-02 08:00:00');
    await crearPago(idCliente, 30, '2026-11-03 08:00:00');

    const primera = await consultarHistorial(
      tokenAdmin,
      consultaCon({ idCliente, limite: 2, offset: 0 })
    );
    const segunda = await consultarHistorial(
      tokenAdmin,
      consultaCon({ idCliente, limite: 2, offset: 2 })
    );

    expect(primera.status).toBe(200);
    expect(primera.body.total).toBe(3);
    expect(primera.body.pagos).toHaveLength(2);
    expect(primera.body.montoTotal).toBe(50);
    expect(segunda.body.total).toBe(3);
    expect(segunda.body.pagos).toHaveLength(1);
    expect(segunda.body.pagos[0].monto).toBe(10);
  });

  it('devuelve estado vacío con totales en cero para un cliente sin pagos', async () => {
    const respuesta = await consultarHistorial(tokenAdmin, consultaCon({ idCliente: 999999 }));

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({
      pagos: [],
      total: 0,
      montoTotal: 0,
      limite: 50,
      offset: 0,
      mensaje: 'No hay pagos para los filtros seleccionados.',
    });
  });

  it('rechaza un rango de fechas invertido con error de validación', async () => {
    const respuesta = await consultarHistorial(
      tokenAdmin,
      consultaCon({ fechaInicio: '2026-11-20', fechaFin: '2026-11-19' })
    );

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.codigo).toBe('VALIDACION');
    expect(respuesta.body.errores.some((item) => item.campo === 'fechaFin')).toBe(true);
  });

  it('rechaza limite mayor que 200 y offset negativo', async () => {
    const respuesta = await consultarHistorial(tokenAdmin, '?limite=201&offset=-1');

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores.map((item) => item.campo)).toEqual(
      expect.arrayContaining(['limite', 'offset'])
    );
  });

  it('exige token y deniega a entrenador y cliente', async () => {
    const sinToken = await consultarHistorial('');
    const comoEntrenador = await consultarHistorial(tokenEntrenador);
    const comoCliente = await consultarHistorial(tokenCliente);

    expect(sinToken.status).toBe(401);
    expect(comoEntrenador.status).toBe(403);
    expect(comoCliente.status).toBe(403);
  });

  it('conserva intacto el registro de pagos mediante POST', async () => {
    const idCliente = await crearCliente();
    const respuesta = await request(app)
      .post('/api/pagos')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ idCliente, monto: 125, metodoPago: 'efectivo' });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.pago.monto).toBe(125);

    const filas = await consultar('SELECT COUNT(*) AS total FROM pagos WHERE id_cliente = ?;', [
      idCliente,
    ]);
    expect(Number(filas[0].total)).toBe(1);
  });
});
