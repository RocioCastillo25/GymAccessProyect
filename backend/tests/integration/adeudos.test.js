// T021 - Pruebas de integración de consulta de adeudos (005-FR-009 a 005-FR-013).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcrypt';
import request from 'supertest';
import app from '../../src/app.js';
import { consultar, ejecutar, cerrarPool } from '../../src/config/baseDatos.js';
import { usuarioYToken, obtenerToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';

const idsClientes = [];
const idsUsuarios = [];
let tokenAdmin = '';
let tokenRecepcionista = '';
let tokenEntrenador = '';

async function crearCliente() {
  const correo = `saldo.cliente.${randomUUID()}@pruebas.local`;
  const resultado = await ejecutar(
    'INSERT INTO clientes (nombre, apellido, correo, estado) VALUES (?, ?, ?, ?);',
    ['Cliente', 'Saldo', correo, 'activo']
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
  return { token: await obtenerToken(correo, password) };
}

async function crearPago(idCliente, monto, fechaPago, estado = 'pendiente') {
  await ejecutar(
    'INSERT INTO pagos (id_cliente, id_membresia, monto, fecha_pago, metodo_pago, estado) VALUES (?, NULL, ?, ?, ?, ?);',
    [idCliente, monto, fechaPago, 'efectivo', estado]
  );
}

function consultarAdeudos(token, consulta = '') {
  const peticion = request(app).get(`/api/pagos/adeudos${consulta}`);
  return token ? peticion.set('Authorization', `Bearer ${token}`) : peticion;
}

function consultarAdeudosPropios(token, consulta = '') {
  const peticion = request(app).get(`/api/pagos/adeudos/mios${consulta}`);
  return token ? peticion.set('Authorization', `Bearer ${token}`) : peticion;
}

beforeAll(async () => {
  tokenAdmin = (await usuarioYToken('administrador')).token;
  tokenRecepcionista = (await usuarioYToken('recepcionista')).token;
  tokenEntrenador = (await usuarioYToken('entrenador')).token;
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
  await limpiarUsuariosPrueba();
  await cerrarPool();
});

describe('Consulta general de adeudos', () => {
  it('suma solo los pagos pendientes y agrupa por cliente', async () => {
    const clienteUno = await crearCliente();
    const clienteDos = await crearCliente();
    await crearPago(clienteUno.id, 200, '2026-11-11 10:00:00');
    await crearPago(clienteUno.id, 100, '2026-11-12 10:00:00');
    await crearPago(clienteUno.id, 999, '2026-11-13 10:00:00', 'completado');
    await crearPago(clienteUno.id, 888, '2026-11-14 10:00:00', 'cancelado');
    await crearPago(clienteDos.id, 50, '2026-11-15 10:00:00');

    const respuesta = await consultarAdeudos(tokenAdmin, `?idCliente=${clienteUno.id}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBe(1);
    expect(respuesta.body.adeudos).toHaveLength(1);
    expect(respuesta.body.adeudos[0].totalAdeudado).toBe(300);
    expect(respuesta.body.adeudos[0].cliente).toEqual({
      id: clienteUno.id,
      nombre: 'Cliente',
      apellido: 'Saldo',
      correo: clienteUno.correo,
    });
    expect(respuesta.body.adeudos[0].pagos).toHaveLength(2);
    expect(respuesta.body.adeudos[0].pagos.every((pago) => pago.estado === 'pendiente')).toBe(true);
    expect(respuesta.body.adeudos[0].pagos.map((pago) => pago.monto)).toEqual([100, 200]);
  });

  it('ordena los grupos por total adeudado descendente', async () => {
    const clienteUno = await crearCliente();
    const clienteDos = await crearCliente();
    await crearPago(clienteUno.id, 100, '2026-11-01 10:00:00');
    await crearPago(clienteDos.id, 300, '2026-11-02 10:00:00');

    const respuesta = await consultarAdeudos(tokenRecepcionista);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.adeudos.length).toBeGreaterThanOrEqual(2);
    const posicionUno = respuesta.body.adeudos.findIndex((item) => item.cliente.id === clienteUno.id);
    const posicionDos = respuesta.body.adeudos.findIndex((item) => item.cliente.id === clienteDos.id);
    expect(posicionDos).toBeLessThan(posicionUno);
  });

  it('respeta limite y offset de grupos sin alterar el total', async () => {
    const clienteUno = await crearCliente();
    const clienteDos = await crearCliente();
    const clienteTres = await crearCliente();
    await crearPago(clienteUno.id, 10, '2026-11-01 10:00:00');
    await crearPago(clienteDos.id, 20, '2026-11-02 10:00:00');
    await crearPago(clienteTres.id, 30, '2026-11-03 10:00:00');

    const respuesta = await consultarAdeudos(tokenAdmin, '?limite=2&offset=1');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.total).toBeGreaterThanOrEqual(3);
    expect(respuesta.body.adeudos).toHaveLength(2);
    expect(respuesta.body.limite).toBe(2);
    expect(respuesta.body.offset).toBe(1);
  });

  it('devuelve el mensaje de estado vacío para un cliente sin adeudos', async () => {
    const respuesta = await consultarAdeudos(tokenAdmin, '?idCliente=999999');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({
      adeudos: [],
      total: 0,
      limite: 50,
      offset: 0,
      mensaje: 'No hay adeudos registrados.',
    });
  });

  it('rechaza idCliente, limite y offset inválidos', async () => {
    const respuesta = await consultarAdeudos(tokenAdmin, '?idCliente=0&limite=201&offset=-1');

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.codigo).toBe('VALIDACION');
    expect(respuesta.body.errores.map((item) => item.campo)).toEqual(
      expect.arrayContaining(['idCliente', 'limite', 'offset'])
    );
  });

  it('exige token y deniega a cliente y entrenador', async () => {
    const tokenCliente = (await crearUsuario(`saldo.cliente.${randomUUID()}@pruebas.local`)).token;
    const sinToken = await consultarAdeudos('');
    const comoCliente = await consultarAdeudos(tokenCliente);
    const comoEntrenador = await consultarAdeudos(tokenEntrenador);

    expect(sinToken.status).toBe(401);
    expect(comoCliente.status).toBe(403);
    expect(comoEntrenador.status).toBe(403);
  });
});

describe('Consulta de adeudos propios', () => {
  it('devuelve solo el adeudo del cliente del token e ignora idCliente ajeno', async () => {
    const cliente = await crearCliente();
    const token = (await crearUsuario(cliente.correo)).token;
    const ajeno = await crearCliente();
    await crearPago(cliente.id, 300, '2026-11-10 10:00:00');
    await crearPago(cliente.id, 900, '2026-11-11 10:00:00', 'completado');
    await crearPago(ajeno.id, 777, '2026-11-12 10:00:00');

    const respuesta = await consultarAdeudosPropios(token, `?idCliente=${ajeno.id}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.cliente.id).toBe(cliente.id);
    expect(Object.keys(respuesta.body.cliente).sort()).toEqual(
      ['apellido', 'correo', 'id', 'nombre'].sort()
    );
    expect(respuesta.body.totalAdeudado).toBe(300);
    expect(respuesta.body.pagos).toHaveLength(1);
    expect(respuesta.body.pagos[0].monto).toBe(300);
    expect(respuesta.body.pagos[0].estado).toBe('pendiente');
  });

  it('devuelve cero y mensaje vacío cuando el cliente no tiene adeudos', async () => {
    const cliente = await crearCliente();
    const token = (await crearUsuario(cliente.correo)).token;
    await crearPago(cliente.id, 400, '2026-11-13 10:00:00', 'cancelado');

    const respuesta = await consultarAdeudosPropios(token);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toMatchObject({
      cliente: { id: cliente.id },
      totalAdeudado: 0,
      pagos: [],
      mensaje: 'No hay adeudos registrados.',
    });
  });

  it('ignora un idCliente no numérico sin responder 400', async () => {
    const cliente = await crearCliente();
    const token = (await crearUsuario(cliente.correo)).token;

    const respuesta = await consultarAdeudosPropios(token, '?idCliente=abc');

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.cliente.id).toBe(cliente.id);
  });

  it('exige token, deniega a entrenador y responde 404 sin cliente asociado', async () => {
    const sinCliente = await crearUsuario(`saldo.sincliente.${randomUUID()}@pruebas.local`);
    const sinToken = await consultarAdeudosPropios('');
    const comoEntrenador = await consultarAdeudosPropios(tokenEntrenador);
    const sinClienteAsociado = await consultarAdeudosPropios(sinCliente.token);

    expect(sinToken.status).toBe(401);
    expect(comoEntrenador.status).toBe(403);
    expect(sinClienteAsociado.status).toBe(404);
    expect(sinClienteAsociado.body.mensaje).toBe('No se encontró el cliente asociado a la sesión.');
  });
});
