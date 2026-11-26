// T058 - Pruebas de integración de renovación de membresías (HU3, FR-008, FR-037).

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
  const correo = `renovacion.cliente.${randomUUID()}@pruebas.local`;
  const resultado = await ejecutar(
    'INSERT INTO clientes (nombre, apellido, correo, estado) VALUES (?, ?, ?, ?);',
    ['Cliente', 'Renovación', correo, 'activo']
  );
  idsClientes.push(resultado.insertId);
  return resultado.insertId;
}

async function crearTipo(duracion, estado = 'activo') {
  const resultado = await ejecutar(
    'INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado) VALUES (?, ?, ?, ?, ?);',
    [`Renovación ${randomUUID()}`, null, duracion, 350, estado]
  );
  idsTipos.push(resultado.insertId);
  return resultado.insertId;
}

async function crearMembresia(idCliente, idTipo, inicio, fin, estado = 'activa') {
  const resultado = await ejecutar(
    'INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado) VALUES (?, ?, ?, ?, ?);',
    [idCliente, idTipo, inicio, fin, estado]
  );
  return resultado.insertId;
}

function renovar(token, idMembresia, cuerpo = {}) {
  return request(app)
    .post(`/api/membresias/${idMembresia}/renovar`)
    .set('Authorization', `Bearer ${token}`)
    .send(cuerpo);
}

async function contarMembresias(idCliente) {
  const filas = await consultar(
    'SELECT COUNT(*) AS total FROM membresias WHERE id_cliente = ?;',
    [idCliente]
  );
  return Number(filas[0].total);
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

describe('HU3 - Renovación de membresía', () => {
  it('el recepcionista extiende desde la fecha de fin anterior y conserva el historial', async () => {
    const idCliente = await crearCliente();
    const idTipo = await crearTipo(30);
    const finAnterior = sumarDias(hoyIso(), 5);
    const anterior = await crearMembresia(
      idCliente,
      idTipo,
      sumarDias(hoyIso(), -25),
      finAnterior
    );

    const respuesta = await renovar(tokenRecepcionista, anterior, { idTipoMembresia: idTipo });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.membresia.id).toBeGreaterThan(anterior);
    expect(respuesta.body.membresia.idCliente).toBe(idCliente);
    expect(respuesta.body.membresia.fechaInicio).toBe(finAnterior);
    expect(respuesta.body.membresia.fechaFin).toBe(sumarDias(finAnterior, 30));
    expect(respuesta.body.membresia.estado).toBe('activa');
    expect(await contarMembresias(idCliente)).toBe(2);

    const original = await consultar(
      'SELECT fecha_fin FROM membresias WHERE id_membresia = ?;',
      [anterior]
    );
    expect(original[0].fecha_fin.slice(0, 10)).toBe(finAnterior);
  });

  it('renueva una membresía vencida iniciando el periodo hoy', async () => {
    const idCliente = await crearCliente();
    const idTipo = await crearTipo(15);
    const anterior = await crearMembresia(
      idCliente,
      idTipo,
      sumarDias(hoyIso(), -45),
      sumarDias(hoyIso(), -1)
    );

    const respuesta = await renovar(tokenAdmin, anterior, { idTipoMembresia: idTipo });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.membresia.fechaInicio).toBe(hoyIso());
    expect(respuesta.body.membresia.fechaFin).toBe(sumarDias(hoyIso(), 15));
    expect(await contarMembresias(idCliente)).toBe(2);
  });

  it('devuelve 404 al renovar una membresía inexistente', async () => {
    const idTipo = await crearTipo(30);
    const respuesta = await renovar(tokenAdmin, 999999, { idTipoMembresia: idTipo });

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.mensaje).toBe('Membresía no encontrada.');
  });

  it('rechaza un tipo inactivo sin persistir la renovación', async () => {
    const idCliente = await crearCliente();
    const activo = await crearTipo(30);
    const inactivo = await crearTipo(30, 'inactivo');
    const anterior = await crearMembresia(
      idCliente,
      activo,
      hoyIso(),
      sumarDias(hoyIso(), 30)
    );

    const respuesta = await renovar(tokenAdmin, anterior, { idTipoMembresia: inactivo });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores).toEqual(
      expect.arrayContaining([expect.objectContaining({ campo: 'idTipoMembresia' })])
    );
    expect(await contarMembresias(idCliente)).toBe(1);
  });

  it('deniega la renovación al entrenador y al cliente', async () => {
    const idCliente = await crearCliente();
    const idTipo = await crearTipo(30);
    const anterior = await crearMembresia(
      idCliente,
      idTipo,
      hoyIso(),
      sumarDias(hoyIso(), 30)
    );

    const comoEntrenador = await renovar(tokenEntrenador, anterior, {
      idTipoMembresia: idTipo,
    });
    const comoCliente = await renovar(tokenCliente, anterior, { idTipoMembresia: idTipo });

    expect(comoEntrenador.status).toBe(403);
    expect(comoCliente.status).toBe(403);
    expect(await contarMembresias(idCliente)).toBe(1);
  });
});
