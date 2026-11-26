// Pruebas de integración de rostros y control de acceso (HU6 a HU9).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'node:crypto';
import app from '../../src/app.js';
import { consultar, ejecutar, cerrarPool } from '../../src/config/baseDatos.js';
import { usuarioYToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';
import { crearCliente, limpiarSprint3 } from '../helpers/sprint3.js';
import { hoyIso, sumarDias } from '../../src/utils/fechas.js';

const descriptor = (valor) => Array.from({ length: 128 }, () => valor);

let tokenAdmin = '';
let tokenRecepcionista = '';
let tokenEntrenador = '';
let tokenCliente = '';
let clienteConMembresia = null;
let clienteSinMembresia = null;
let clientePropio = null;
let idTipoMembresia = null;
const idsAccesos = [];

async function registrarRostro(token, idCliente, descriptorFacial) {
  return request(app)
    .post('/api/rostros')
    .set('Authorization', `Bearer ${token}`)
    .send({ idCliente, descriptorFacial });
}

async function validarAcceso(token, descriptorFacial) {
  const respuesta = await request(app)
    .post('/api/accesos/validar')
    .set('Authorization', `Bearer ${token}`)
    .send({ descriptorFacial });
  if (respuesta.body?.acceso?.id) {
    idsAccesos.push(respuesta.body.acceso.id);
  }
  return respuesta;
}

beforeAll(async () => {
  tokenAdmin = (await usuarioYToken('administrador')).token;
  tokenRecepcionista = (await usuarioYToken('recepcionista')).token;
  tokenEntrenador = (await usuarioYToken('entrenador')).token;

  const sesionCliente = await usuarioYToken('cliente');
  tokenCliente = sesionCliente.token;

  clienteConMembresia = await crearCliente();
  clienteSinMembresia = await crearCliente();
  clientePropio = await crearCliente({ correo: sesionCliente.usuario.correo });

  const tipo = await ejecutar(
    'INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado) VALUES (?, ?, ?, ?, ?);',
    [`Prueba acceso ${randomUUID()}`, 'Tipo para pruebas de acceso', 30, 500, 'activo']
  );
  idTipoMembresia = tipo.insertId;

  const hoy = hoyIso();
  await ejecutar(
    'INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado) VALUES (?, ?, ?, ?, ?);',
    [clienteConMembresia.id, idTipoMembresia, hoy, sumarDias(hoy, 30), 'activa']
  );

  await registrarRostro(tokenRecepcionista, clienteConMembresia.id, descriptor(0.1));
  await registrarRostro(tokenRecepcionista, clienteSinMembresia.id, descriptor(0.9));
  await registrarRostro(tokenRecepcionista, clientePropio.id, descriptor(0.5));
});

afterAll(async () => {
  if (idsAccesos.length > 0) {
    const marcadores = idsAccesos.map(() => '?').join(', ');
    await consultar(`DELETE FROM accesos WHERE id_acceso IN (${marcadores});`, idsAccesos);
  }

  const idsClientes = [clienteConMembresia, clienteSinMembresia, clientePropio]
    .filter(Boolean)
    .map((cliente) => cliente.id);
  if (idsClientes.length > 0) {
    const marcadores = idsClientes.map(() => '?').join(', ');
    await consultar(`DELETE FROM rostros WHERE id_cliente IN (${marcadores});`, idsClientes);
    await consultar(`DELETE FROM membresias WHERE id_cliente IN (${marcadores});`, idsClientes);
  }
  if (idTipoMembresia) {
    await consultar('DELETE FROM tipos_membresia WHERE id_tipo_membresia = ?;', [idTipoMembresia]);
  }

  await limpiarSprint3();
  await limpiarUsuariosPrueba();
  await cerrarPool();
});

describe('Rostros y control de acceso', () => {
  it('registra un rostro sin devolver el descriptor facial', async () => {
    const nuevoCliente = await crearCliente();
    const respuesta = await registrarRostro(tokenRecepcionista, nuevoCliente.id, descriptor(0.3));

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.rostro.idCliente).toBe(nuevoCliente.id);
    expect(JSON.stringify(respuesta.body)).not.toContain('descriptorFacial');

    const estado = await request(app)
      .get(`/api/rostros/${nuevoCliente.id}`)
      .set('Authorization', `Bearer ${tokenRecepcionista}`);

    expect(estado.status).toBe(200);
    expect(estado.body.tieneRostro).toBe(true);
    expect(JSON.stringify(estado.body)).not.toContain('descriptorFacial');

    await consultar('DELETE FROM rostros WHERE id_cliente = ?;', [nuevoCliente.id]);
  });

  it('rechaza un descriptor facial con formato inválido', async () => {
    const respuesta = await request(app)
      .post('/api/accesos/validar')
      .set('Authorization', `Bearer ${tokenRecepcionista}`)
      .send({ descriptorFacial: [1, 2, 3] });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.codigo).toBe('DESCRIPTOR_INVALIDO');
  });

  it('autoriza el acceso de un cliente con membresía vigente y lo registra', async () => {
    const respuesta = await validarAcceso(tokenRecepcionista, descriptor(0.1));

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.resultado).toBe('autorizado');
    expect(respuesta.body.cliente.id).toBe(clienteConMembresia.id);
    expect(respuesta.body.membresia.estado).toBe('activa');
    expect(respuesta.body.acceso.id).toBeGreaterThan(0);

    const detalle = await request(app)
      .get(`/api/accesos/${respuesta.body.acceso.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(detalle.status).toBe(200);
    expect(detalle.body.acceso.idCliente).toBe(clienteConMembresia.id);
    expect(detalle.body.acceso.resultado).toBe('autorizado');
  });

  it('rechaza un rostro no reconocido y registra el intento sin cliente', async () => {
    const respuesta = await validarAcceso(tokenRecepcionista, descriptor(0.99));

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.resultado).toBe('rechazado');
    expect(respuesta.body.cliente).toBeNull();
    expect(respuesta.body.motivo).toBe('Rostro no reconocido.');

    const detalle = await request(app)
      .get(`/api/accesos/${respuesta.body.acceso.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(detalle.status).toBe(200);
    expect(detalle.body.acceso.idCliente).toBeNull();
    expect(detalle.body.acceso.motivoRechazo).toBe('Rostro no reconocido.');
  });

  it('rechaza a un cliente identificado que no tiene membresía', async () => {
    const respuesta = await validarAcceso(tokenRecepcionista, descriptor(0.9));

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.resultado).toBe('rechazado');
    expect(respuesta.body.cliente.id).toBe(clienteSinMembresia.id);
    expect(respuesta.body.motivo).toBe('El cliente no tiene una membresía registrada.');
  });

  it('el entrenador solo recibe campos operativos de los accesos', async () => {
    const respuesta = await request(app)
      .get('/api/accesos')
      .set('Authorization', `Bearer ${tokenEntrenador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.accesos.length).toBeGreaterThan(0);
    for (const acceso of respuesta.body.accesos) {
      expect(acceso).toHaveProperty('idCliente');
      expect(acceso).toHaveProperty('fechaHora');
      expect(acceso).toHaveProperty('tipo');
      expect(acceso).toHaveProperty('resultado');
      expect(acceso).not.toHaveProperty('cliente');
      expect(acceso).not.toHaveProperty('motivoRechazo');
    }
  });

  it('el cliente solo consulta sus propios accesos', async () => {
    await validarAcceso(tokenRecepcionista, descriptor(0.5));

    const respuesta = await request(app)
      .get('/api/accesos/yo')
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.accesos.length).toBeGreaterThan(0);
    for (const acceso of respuesta.body.accesos) {
      expect(acceso.idCliente).toBe(clientePropio.id);
    }
  });

  it('impide que el entrenador valide accesos', async () => {
    const respuesta = await validarAcceso(tokenEntrenador, descriptor(0.1));
    expect(respuesta.status).toBe(403);
  });
});
