// T026 - Pruebas de integración de registro de pagos (HU4, FR-011, FR-014, FR-029).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import app from '../../src/app.js';
import { consultar, ejecutar, cerrarPool } from '../../src/config/baseDatos.js';
import { usuarioYToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';
import { hoyIso, sumarDias } from '../../src/utils/fechas.js';

let tokenAdmin = '';
let tokenRecepcionista = '';
let tokenEntrenador = '';
let tokenCliente = '';

const idsClientes = [];
const idsTipos = [];
const idsMembresias = [];

async function crearCliente() {
  const correo = `pago.cliente.${randomUUID()}@pruebas.local`;
  const resultado = await ejecutar(
    'INSERT INTO clientes (nombre, apellido, correo, estado) VALUES (?, ?, ?, ?);',
    ['Cliente', 'Pago', correo, 'activo']
  );
  idsClientes.push(resultado.insertId);
  return resultado.insertId;
}

async function crearMembresia(idCliente) {
  const nombre = `Prueba Pago ${randomUUID()}`;
  const tipo = await ejecutar(
    'INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado) VALUES (?, ?, ?, ?, ?);',
    [nombre, null, 30, 300, 'activo']
  );
  idsTipos.push(tipo.insertId);
  const inicio = hoyIso();
  const membresia = await ejecutar(
    'INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado) VALUES (?, ?, ?, ?, ?);',
    [idCliente, tipo.insertId, inicio, sumarDias(hoyIso(), 30), 'activa']
  );
  idsMembresias.push(membresia.insertId);
  return membresia.insertId;
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
    await consultar(`DELETE FROM membresias WHERE id_cliente IN (${marcadores});`, idsClientes);
    await consultar(`DELETE FROM clientes WHERE id_cliente IN (${marcadores});`, idsClientes);
  }
  if (idsTipos.length > 0) {
    const marcadores = idsTipos.map(() => '?').join(', ');
    await consultar(`DELETE FROM tipos_membresia WHERE id_tipo_membresia IN (${marcadores});`, idsTipos);
  }
  await limpiarUsuariosPrueba();
  await cerrarPool();
});

function registrarPago(token, cuerpo) {
  return request(app)
    .post('/api/pagos')
    .set('Authorization', `Bearer ${token}`)
    .send(cuerpo);
}

describe('HU4 - Registro de pagos', () => {
  it('el recepcionista registra un pago válido y aparece en el historial', async () => {
    const idCliente = await crearCliente();
    const idMembresia = await crearMembresia(idCliente);

    const respuesta = await registrarPago(tokenRecepcionista, {
      idCliente,
      idMembresia,
      monto: 350,
      metodoPago: 'efectivo',
      estado: 'completado',
    });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.pago.id).toBeGreaterThan(0);
    expect(Number(respuesta.body.pago.monto)).toBe(350);
    expect(respuesta.body.pago.metodoPago).toBe('efectivo');
    expect(respuesta.body.pago.fechaPago).toBeTruthy();

    const filas = await consultar('SELECT COUNT(*) AS total FROM pagos WHERE id_cliente = ?;', [
      idCliente,
    ]);
    expect(Number(filas[0].total)).toBe(1);
  });

  it('el administrador también puede registrar un pago', async () => {
    const idCliente = await crearCliente();
    const idMembresia = await crearMembresia(idCliente);
    const respuesta = await registrarPago(tokenAdmin, {
      idCliente,
      idMembresia,
      monto: 200,
      metodoPago: 'tarjeta',
    });
    expect(respuesta.status).toBe(201);
  });

  it('rechaza un monto inválido o ausente sin persistir', async () => {
    const idCliente = await crearCliente();
    const idMembresia = await crearMembresia(idCliente);

    const cero = await registrarPago(tokenAdmin, {
      idCliente,
      idMembresia,
      monto: 0,
      metodoPago: 'efectivo',
    });
    const ausente = await registrarPago(tokenAdmin, {
      idCliente,
      idMembresia,
      metodoPago: 'efectivo',
    });

    expect(cero.status).toBe(400);
    expect(ausente.status).toBe(400);
    expect(ausente.body.errores.some((error) => error.campo === 'monto')).toBe(true);

    const filas = await consultar('SELECT COUNT(*) AS total FROM pagos WHERE id_cliente = ?;', [
      idCliente,
    ]);
    expect(Number(filas[0].total)).toBe(0);
  });

  it('rechaza un método de pago fuera del catálogo', async () => {
    const idCliente = await crearCliente();
    const idMembresia = await crearMembresia(idCliente);
    const respuesta = await registrarPago(tokenAdmin, {
      idCliente,
      idMembresia,
      monto: 100,
      metodoPago: 'bitcoin',
    });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores.some((error) => error.campo === 'metodoPago')).toBe(true);
  });

  it('rechaza una membresía que no pertenece al cliente', async () => {
    const idCliente = await crearCliente();
    const otroCliente = await crearCliente();
    const idMembresia = await crearMembresia(otroCliente);

    const respuesta = await registrarPago(tokenAdmin, {
      idCliente,
      idMembresia,
      monto: 150,
      metodoPago: 'transferencia',
    });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores.some((error) => error.campo === 'idMembresia')).toBe(true);
  });

  it('rechaza un cliente inexistente', async () => {
    const respuesta = await registrarPago(tokenAdmin, {
      idCliente: 999999,
      monto: 100,
      metodoPago: 'efectivo',
    });
    expect(respuesta.status).toBe(404);
  });

  it('evita duplicar un pago completado de la misma membresía', async () => {
    const idCliente = await crearCliente();
    const idMembresia = await crearMembresia(idCliente);
    const cuerpo = { idCliente, idMembresia, monto: 300, metodoPago: 'efectivo' };

    const primero = await registrarPago(tokenAdmin, cuerpo);
    const duplicado = await registrarPago(tokenRecepcionista, cuerpo);

    expect(primero.status).toBe(201);
    expect(duplicado.status).toBe(409);

    const filas = await consultar(
      'SELECT COUNT(*) AS total FROM pagos WHERE id_cliente = ? AND estado = ?;',
      [idCliente, 'completado']
    );
    expect(Number(filas[0].total)).toBe(1);
  });

  it('deniega el registro al entrenador y al cliente', async () => {
    const idCliente = await crearCliente();
    const idMembresia = await crearMembresia(idCliente);

    const comoEntrenador = await registrarPago(tokenEntrenador, {
      idCliente,
      idMembresia,
      monto: 100,
      metodoPago: 'efectivo',
    });
    const comoCliente = await registrarPago(tokenCliente, {
      idCliente,
      idMembresia,
      monto: 100,
      metodoPago: 'efectivo',
    });

    expect(comoEntrenador.status).toBe(403);
    expect(comoCliente.status).toBe(403);
  });
});
