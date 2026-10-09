// T069 - Pruebas de consulta de clientes por rol (HU6, FR-016, FR-017, SC-002).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import app from '../../src/app.js';
import { consultar, cerrarPool } from '../../src/config/baseDatos.js';
import { usuarioYToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';

let tokenAdmin = '';
let tokenRecepcionista = '';
let tokenEntrenador = '';
let tokenCliente = '';
let clienteDePrueba = null;

describe('Consulta de clientes (HU6)', () => {
  beforeAll(async () => {
    tokenAdmin = (await usuarioYToken('administrador')).token;
    tokenRecepcionista = (await usuarioYToken('recepcionista')).token;
    tokenEntrenador = (await usuarioYToken('entrenador')).token;
    tokenCliente = (await usuarioYToken('cliente')).token;
    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Consulta',
        apellido: 'Prueba',
        correo: `cliente.consulta.${randomUUID()}@pruebas.local`,
        telefono: '55 4444 4444',
        direccion: 'Calle Consulta 1',
      });
    clienteDePrueba = respuesta.body.cliente;
  });

  afterAll(async () => {
    await consultar('DELETE FROM clientes WHERE correo LIKE ?', ['cliente.consulta.%']);
    await limpiarUsuariosPrueba();
    await cerrarPool();
  });

  it('devuelve todos los campos al administrador y al recepcionista', async () => {
    for (const token of [tokenAdmin, tokenRecepcionista]) {
      const respuesta = await request(app)
        .get('/api/clientes')
        .set('Authorization', `Bearer ${token}`);

      expect(respuesta.status).toBe(200);
      const primero = respuesta.body.clientes.find(
        (cliente) => cliente.id === clienteDePrueba.id
      );
      expect(primero).toBeTruthy();
      expect(primero).toHaveProperty('correo');
      expect(primero).toHaveProperty('telefono');
      expect(primero).toHaveProperty('direccion');
      expect(primero).toHaveProperty('fecha_registro');
    }
  });

  it('limita la respuesta del entrenador a nombre, apellido y estado', async () => {
    const respuesta = await request(app)
      .get('/api/clientes')
      .set('Authorization', `Bearer ${tokenEntrenador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.clientes.length).toBeGreaterThan(0);

    for (const cliente of respuesta.body.clientes) {
      expect(Object.keys(cliente).sort()).toEqual(['apellido', 'estado', 'id', 'nombre']);
      expect(cliente).not.toHaveProperty('correo');
      expect(cliente).not.toHaveProperty('telefono');
      expect(cliente).not.toHaveProperty('direccion');
      expect(cliente).not.toHaveProperty('fecha_registro');
    }
  });

  it('niega al entrenador el detalle completo de un cliente', async () => {
    const respuesta = await request(app)
      .get(`/api/clientes/${clienteDePrueba.id}`)
      .set('Authorization', `Bearer ${tokenEntrenador}`);

    expect(respuesta.status).toBe(403);
  });

  it('niega a un cliente consultar el listado de otros clientes', async () => {
    const respuesta = await request(app)
      .get('/api/clientes')
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.codigo).toBe('AUTORIZACION');
  });

  it('responde 404 ante un cliente inexistente', async () => {
    const respuesta = await request(app)
      .get('/api/clientes/999999')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.mensaje).toContain('no encontrado');
  });
});
