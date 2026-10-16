// T018 - Pruebas de integración de asignación de membresías (HU2, FR-005 a FR-007, FR-010).

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

async function crearCliente() {
  const correo = `membresia.cliente.${randomUUID()}@pruebas.local`;
  const resultado = await ejecutar(
    'INSERT INTO clientes (nombre, apellido, correo, estado) VALUES (?, ?, ?, ?);',
    ['Cliente', 'Membresía', correo, 'activo']
  );
  idsClientes.push(resultado.insertId);
  return resultado.insertId;
}

async function crearTipo(duracion, estado = 'activo') {
  const nombre = `Prueba Membresía ${randomUUID()}`;
  const resultado = await ejecutar(
    'INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado) VALUES (?, ?, ?, ?, ?);',
    [nombre, null, duracion, 300, estado]
  );
  idsTipos.push(resultado.insertId);
  return resultado.insertId;
}

beforeAll(async () => {
  tokenAdmin = (await usuarioYToken('administrador')).token;
  tokenRecepcionista = (await usuarioYToken('recepcionista')).token;
  tokenEntrenador = (await usuarioYToken('entrenador')).token;
  tokenCliente = (await usuarioYToken('cliente')).token;
});

afterAll(async () => {
  const marcadoresClientes = idsClientes.map(() => '?').join(', ');
  if (idsClientes.length > 0) {
    await consultar(`DELETE FROM membresias WHERE id_cliente IN (${marcadoresClientes});`, idsClientes);
    await consultar(`DELETE FROM clientes WHERE id_cliente IN (${marcadoresClientes});`, idsClientes);
  }
  const marcadoresTipos = idsTipos.map(() => '?').join(', ');
  if (idsTipos.length > 0) {
    await consultar(`DELETE FROM tipos_membresia WHERE id_tipo_membresia IN (${marcadoresTipos});`, idsTipos);
  }
  await limpiarUsuariosPrueba();
  await cerrarPool();
});

function asignar(token, cuerpo) {
  return request(app)
    .post('/api/membresias')
    .set('Authorization', `Bearer ${token}`)
    .send(cuerpo);
}

describe('HU2 - Asignación de membresía', () => {
  it('el recepcionista asigna una membresía y calcula la fecha de fin', async () => {
    const idCliente = await crearCliente();
    const idTipo = await crearTipo(30);

    const respuesta = await asignar(tokenRecepcionista, { idCliente, idTipoMembresia: idTipo });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.membresia.id).toBeGreaterThan(0);
    expect(respuesta.body.membresia.estado).toBe('activa');
    expect(respuesta.body.membresia.fechaInicio).toBe(hoyIso());
    expect(respuesta.body.membresia.fechaFin).toBe(sumarDias(hoyIso(), 30));
  });

  it('el administrador también puede asignar', async () => {
    const idCliente = await crearCliente();
    const idTipo = await crearTipo(15);
    const respuesta = await asignar(tokenAdmin, { idCliente, idTipoMembresia: idTipo });
    expect(respuesta.status).toBe(201);
  });

  it('rechaza un cliente inexistente sin persistir', async () => {
    const idTipo = await crearTipo(30);
    const respuesta = await asignar(tokenAdmin, { idCliente: 999999, idTipoMembresia: idTipo });
    expect(respuesta.status).toBe(404);

    const filas = await consultar('SELECT COUNT(*) AS total FROM membresias WHERE id_cliente = ?;', [
      999999,
    ]);
    expect(Number(filas[0].total)).toBe(0);
  });

  it('rechaza un tipo inactivo sin persistir', async () => {
    const idCliente = await crearCliente();
    const idTipo = await crearTipo(30, 'inactivo');
    const respuesta = await asignar(tokenAdmin, { idCliente, idTipoMembresia: idTipo });
    expect(respuesta.status).toBe(400);

    const filas = await consultar('SELECT COUNT(*) AS total FROM membresias WHERE id_cliente = ?;', [
      idCliente,
    ]);
    expect(Number(filas[0].total)).toBe(0);
  });

  it('exige idCliente e idTipoMembresia', async () => {
    const respuesta = await asignar(tokenAdmin, {});
    expect(respuesta.status).toBe(400);
    const campos = respuesta.body.errores.map((error) => error.campo);
    expect(campos).toContain('idCliente');
    expect(campos).toContain('idTipoMembresia');
  });

  it('deniega la asignación al entrenador y al cliente', async () => {
    const idCliente = await crearCliente();
    const idTipo = await crearTipo(30);
    const comoEntrenador = await asignar(tokenEntrenador, {
      idCliente,
      idTipoMembresia: idTipo,
    });
    const comoCliente = await asignar(tokenCliente, { idCliente, idTipoMembresia: idTipo });

    expect(comoEntrenador.status).toBe(403);
    expect(comoCliente.status).toBe(403);
  });

  it('reporta vencida una membresía activa con fecha de fin pasada', async () => {
    const idCliente = await crearCliente();
    const idTipo = await crearTipo(30);
    const ayer = sumarDias(hoyIso(), -1);
    const inicioPasado = sumarDias(hoyIso(), -31);
    const resultado = await ejecutar(
      'INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado) VALUES (?, ?, ?, ?, ?);',
      [idCliente, idTipo, inicioPasado, ayer, 'activa']
    );

    const respuesta = await request(app)
      .get(`/api/membresias/${resultado.insertId}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.membresia.estado).toBe('vencida');
  });

  it('permite al administrador suspender una membresía', async () => {
    const idCliente = await crearCliente();
    const idTipo = await crearTipo(30);
    const creada = await asignar(tokenAdmin, { idCliente, idTipoMembresia: idTipo });

    const respuesta = await request(app)
      .patch(`/api/membresias/${creada.body.membresia.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'suspendida' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.membresia.estado).toBe('suspendida');
  });
});
