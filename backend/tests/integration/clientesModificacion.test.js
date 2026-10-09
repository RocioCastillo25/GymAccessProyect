// T064 - Pruebas de modificación de clientes (HU5, FR-015, FR-018).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import app from '../../src/app.js';
import { consultar, cerrarPool } from '../../src/config/baseDatos.js';
import { usuarioYToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';

let tokenAdmin = '';
let tokenRecepcionista = '';
let tokenEntrenador = '';

async function crearCliente(token) {
  const correo = `cliente.modificacion.${randomUUID()}@pruebas.local`;
  const respuesta = await request(app)
    .post('/api/clientes')
    .set('Authorization', `Bearer ${token}`)
    .send({ nombre: 'Cliente', apellido: 'Modificacion', correo, telefono: '55 0000 0000' });
  return respuesta.body.cliente;
}

describe('Modificación de clientes (HU5)', () => {
  beforeAll(async () => {
    tokenAdmin = (await usuarioYToken('administrador')).token;
    tokenRecepcionista = (await usuarioYToken('recepcionista')).token;
    tokenEntrenador = (await usuarioYToken('entrenador')).token;
  });

  afterAll(async () => {
    await consultar('DELETE FROM clientes WHERE correo LIKE ?', ['cliente.modificacion.%']);
    await limpiarUsuariosPrueba();
    await cerrarPool();
  });

  it('permite al recepcionista actualizar el teléfono de un cliente', async () => {
    const cliente = await crearCliente(tokenRecepcionista);

    const respuesta = await request(app)
      .patch(`/api/clientes/${cliente.id}`)
      .set('Authorization', `Bearer ${tokenRecepcionista}`)
      .send({ telefono: '55 9999 8888' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.cliente.telefono).toBe('55 9999 8888');
    expect(respuesta.body.cliente.correo).toBe(cliente.correo);

    const filas = await consultar('SELECT telefono FROM clientes WHERE id_cliente = ?;', [
      cliente.id,
    ]);
    expect(filas[0].telefono).toBe('55 9999 8888');
  });

  it('permite al administrador actualizar datos de un cliente', async () => {
    const cliente = await crearCliente(tokenAdmin);

    const respuesta = await request(app)
      .patch(`/api/clientes/${cliente.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ direccion: 'Avenida Sur 45', apellido: 'Actualizado' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.cliente.direccion).toBe('Avenida Sur 45');
    expect(respuesta.body.cliente.apellido).toBe('Actualizado');
  });

  it('responde 404 con mensaje claro cuando el cliente no existe', async () => {
    const respuesta = await request(app)
      .patch('/api/clientes/999999')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ telefono: '55 1111 1111' });

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.codigo).toBe('NO_ENCONTRADO');
    expect(respuesta.body.mensaje).toContain('no encontrado');
    expect(JSON.stringify(respuesta.body)).not.toContain('SELECT');
  });

  it('rechaza datos inválidos sin persistir cambios', async () => {
    const cliente = await crearCliente(tokenAdmin);

    const respuesta = await request(app)
      .patch(`/api/clientes/${cliente.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ correo: 'correo-invalido' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores.some((error) => error.campo === 'correo')).toBe(true);
  });

  it('niega la modificación a un entrenador y a un cliente', async () => {
    const cliente = await crearCliente(tokenAdmin);

    const respuestaEntrenador = await request(app)
      .patch(`/api/clientes/${cliente.id}`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ telefono: '55 2222 2222' });

    expect(respuestaEntrenador.status).toBe(403);

    const clienteUsuario = await usuarioYToken('cliente');
    const respuestaCliente = await request(app)
      .patch(`/api/clientes/${cliente.id}`)
      .set('Authorization', `Bearer ${clienteUsuario.token}`)
      .send({ telefono: '55 3333 3333' });

    expect(respuestaCliente.status).toBe(403);
  });
});
