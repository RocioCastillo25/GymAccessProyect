// T014 - Pruebas de integración del historial del cliente autenticado (005-FR-002, 005-FR-006).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import request from 'supertest';
import app from '../../src/app.js';
import { consultar, ejecutar, cerrarPool } from '../../src/config/baseDatos.js';
import { obtenerToken } from '../helpers/usuarios.js';

const idsClientes = [];
const idsUsuarios = [];
let tokenCliente = '';
let tokenOtroCliente = '';
let tokenEntrenador = '';
let tokenSinCliente = '';

async function crearCliente() {
  const correo = `propio.cliente.${randomUUID()}@pruebas.local`;
  const resultado = await ejecutar(
    'INSERT INTO clientes (nombre, apellido, correo, estado) VALUES (?, ?, ?, ?);',
    ['Cliente', 'Propio', correo, 'activo']
  );
  idsClientes.push(resultado.insertId);
  return { id: resultado.insertId, correo };
}

async function crearUsuario(correo, rol = 'cliente') {
  const password = 'Prueba1234';
  const hash = await bcrypt.hash(password, 10);
  const resultado = await ejecutar(
    'INSERT INTO usuarios (nombre, correo, password, rol, estado) VALUES (?, ?, ?, ?, ?);',
    ['Usuario', correo, hash, rol, 'activo']
  );
  idsUsuarios.push(resultado.insertId);
  return { correo, password, token: await obtenerToken(correo, password) };
}

async function crearPago(idCliente, monto, fechaPago, estado = 'completado') {
  await ejecutar(
    'INSERT INTO pagos (id_cliente, id_membresia, monto, fecha_pago, metodo_pago, estado) VALUES (?, NULL, ?, ?, ?, ?);',
    [idCliente, monto, fechaPago, 'efectivo', estado]
  );
}

function consultarPropios(token, consulta = '') {
  const peticion = request(app).get(`/api/pagos/mios${consulta}`);
  return token ? peticion.set('Authorization', `Bearer ${token}`) : peticion;
}

beforeAll(async () => {
  const cliente = await crearCliente();
  tokenCliente = (await crearUsuario(cliente.correo)).token;
  const otroCliente = await crearCliente();
  tokenOtroCliente = (await crearUsuario(otroCliente.correo)).token;
  tokenEntrenador = (await crearUsuario(`propio.entrenador.${randomUUID()}@pruebas.local`, 'entrenador')).token;
  tokenSinCliente = (await crearUsuario(`propio.sincliente.${randomUUID()}@pruebas.local`)).token;
});

afterAll(async () => {
  if (idsClientes.length > 0) {
    const marcadores = idsClientes.map(() => '?').join(', ');
    await consultar(`DELETE FROM pagos WHERE id_cliente IN (${marcadores});`, idsClientes);
    await consultar(`DELETE FROM clientes WHERE id_cliente IN (${marcadores});`, idsClientes);
  }
  if (idsUsuarios.length > 0) {
    const marcadores = idsUsuarios.map(() => '?').join(', ');
    await consultar(`DELETE FROM auditoria WHERE id_usuario IN (${marcadores});`, idsUsuarios);
    await consultar(`DELETE FROM usuarios WHERE id_usuario IN (${marcadores});`, idsUsuarios);
  }
  await cerrarPool();
});

describe('Historial de pagos propios', () => {
  it('devuelve únicamente los pagos del cliente resuelto por correo', async () => {
    const cliente = await crearCliente();
    const propio = (await crearUsuario(cliente.correo)).token;
    const ajeno = await crearCliente();
    await crearPago(cliente.id, 100, '2026-11-01 08:00:00');
    await crearPago(cliente.id, 200, '2026-11-02 08:00:00');
    await crearPago(ajeno.id, 999, '2026-11-03 08:00:00');

    const respuesta = await consultarPropios(propio);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(2);
    expect(respuesta.body.pagos.every((pago) => pago.idCliente === cliente.id)).toBe(true);
    expect(respuesta.body.pagos.some((pago) => pago.monto === 999)).toBe(false);
  });

  it('aplica filtros de fecha y estado sobre sus propios pagos', async () => {
    const cliente = await crearCliente();
    const propio = (await crearUsuario(cliente.correo)).token;
    await crearPago(cliente.id, 10, '2026-10-31 08:00:00', 'pendiente');
    await crearPago(cliente.id, 20, '2026-11-10 08:00:00', 'pendiente');
    await crearPago(cliente.id, 30, '2026-11-15 08:00:00', 'cancelado');

    const respuesta = await consultarPropios(
      propio,
      '?fechaInicio=2026-11-01&fechaFin=2026-11-30&estado=pendiente'
    );

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(1);
    expect(respuesta.body.pagos[0].monto).toBe(20);
  });

  it('ignora un idCliente ajeno enviado en la consulta', async () => {
    const cliente = await crearCliente();
    const propio = (await crearUsuario(cliente.correo)).token;
    const ajeno = await crearCliente();
    await crearPago(cliente.id, 55, '2026-11-05 08:00:00');

    const respuesta = await consultarPropios(propio, `?idCliente=${ajeno.id}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(1);
    expect(respuesta.body.pagos[0].idCliente).toBe(cliente.id);
  });

  it('devuelve el mensaje de estado vacío cuando el cliente no tiene pagos', async () => {
    const respuesta = await consultarPropios(tokenOtroCliente);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({
      pagos: [],
      total: 0,
      montoTotal: 0,
      mensaje: 'No hay pagos para los filtros seleccionados.',
    });
  });

  it('deniega el historial general al cliente y los propios al entrenador', async () => {
    const general = await request(app)
      .get('/api/pagos')
      .set('Authorization', `Bearer ${tokenCliente}`);
    const propiosEntrenador = await consultarPropios(tokenEntrenador);

    expect(general.status).toBe(403);
    expect(propiosEntrenador.status).toBe(403);
  });

  it('exige token', async () => {
    const respuesta = await consultarPropios('');
    expect(respuesta.status).toBe(401);
  });

  it('responde 404 cuando el correo del token no tiene cliente asociado', async () => {
    const respuesta = await consultarPropios(tokenSinCliente);

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.codigo).toBe('NO_ENCONTRADO');
    expect(respuesta.body.mensaje).toBe('No se encontró el cliente asociado a la sesión.');
  });
});
