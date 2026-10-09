// T040 - Pruebas de permisos sobre clientes (HU2, FR-014, SC-002).
// El backend debe rechazar la operación aunque la interfaz oculte la opción.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { consultar, cerrarPool } from '../../src/config/baseDatos.js';
import { usuarioYToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';

let tokenEntrenador = '';
let tokenCliente = '';

describe('Permisos de registro de clientes (HU2)', () => {
  beforeAll(async () => {
    tokenEntrenador = (await usuarioYToken('entrenador')).token;
    tokenCliente = (await usuarioYToken('cliente')).token;
  });

  afterAll(async () => {
    await limpiarUsuariosPrueba();
    await cerrarPool();
  });

  const clienteNuevo = {
    nombre: 'No',
    apellido: 'Autorizado',
    correo: 'cliente.no.autorizado@pruebas.local',
  };

  it('niega a un entrenador el registro de clientes', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send(clienteNuevo);

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.codigo).toBe('AUTORIZACION');

    const existentes = await consultar('SELECT id_cliente FROM clientes WHERE correo = ?;', [
      clienteNuevo.correo,
    ]);
    expect(existentes.length).toBe(0);
  });

  it('niega a un cliente el registro de otros clientes', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ ...clienteNuevo, correo: 'cliente.autorizado.no@pruebas.local' });

    expect(respuesta.status).toBe(403);
  });
});
