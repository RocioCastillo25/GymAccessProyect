// T074 - Pruebas de consulta de información propia (HU7, FR-017, RN-14).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import app from '../../src/app.js';
import { consultar, cerrarPool } from '../../src/config/baseDatos.js';
import { usuarioYToken, obtenerToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';

let tokenCliente = '';
let tokenOtroCliente = '';
let clientePropio = null;
let clienteAjeno = null;

describe('Consulta de información propia (HU7)', () => {
  beforeAll(async () => {
    // Cliente con cuenta de usuario que coincide con su registro en `clientes`.
    const primero = await usuarioYToken('cliente');
    tokenCliente = primero.token;
    const correoPropio = `cliente.propio.${randomUUID()}@pruebas.local`;
    await consultar('UPDATE usuarios SET correo = ? WHERE id_usuario = ?;', [
      correoPropio,
      primero.usuario.id,
    ]);
    const creado = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${(await usuarioYToken('administrador')).token}`)
      .send({ nombre: 'Cliente', apellido: 'Propio', correo: correoPropio });
    clientePropio = creado.body.cliente;
    // Se vuelve a iniciar sesión para que el token lleve el correo nuevo.
    tokenCliente = await obtenerToken(correoPropio, primero.usuario.password);

    // Segundo cliente distinto, ajeno al primero.
    const segundo = await usuarioYToken('cliente');
    tokenOtroCliente = segundo.token;
    const correoAjeno = `cliente.ajeno.${randomUUID()}@pruebas.local`;
    await consultar('UPDATE usuarios SET correo = ? WHERE id_usuario = ?;', [
      correoAjeno,
      segundo.usuario.id,
    ]);
    const creadoAjeno = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${(await usuarioYToken('administrador')).token}`)
      .send({ nombre: 'Cliente', apellido: 'Ajeno', correo: correoAjeno });
    clienteAjeno = creadoAjeno.body.cliente;
    // Se vuelve a iniciar sesión para que el token lleve el correo nuevo.
    tokenOtroCliente = await obtenerToken(correoAjeno, segundo.usuario.password);
  });

  afterAll(async () => {
    await consultar('DELETE FROM clientes WHERE correo LIKE ?', ['cliente.propio.%']);
    await consultar('DELETE FROM clientes WHERE correo LIKE ?', ['cliente.ajeno.%']);
    await limpiarUsuariosPrueba();
    await cerrarPool();
  });

  it('devuelve los datos completos del propio cliente', async () => {
    const respuesta = await request(app)
      .get('/api/clientes/yo')
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.cliente.id).toBe(clientePropio.id);
    expect(respuesta.body.cliente.correo).toBe(clientePropio.correo);
    expect(respuesta.body.cliente).toHaveProperty('telefono');
    expect(respuesta.body.cliente).toHaveProperty('fecha_registro');
  });

  it('responde 401 sin token', async () => {
    const respuesta = await request(app).get('/api/clientes/yo');
    expect(respuesta.status).toBe(401);
  });

  it('niega a un cliente consultar la información de otro cliente', async () => {
    const respuesta = await request(app)
      .get(`/api/clientes/${clienteAjeno.id}`)
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.codigo).toBe('AUTORIZACION');
  });

  it('niega a un cliente el uso de la ruta /yo cuando no tiene registro asociado', async () => {
    const sinRegistro = await usuarioYToken('cliente');
    const respuesta = await request(app)
      .get('/api/clientes/yo')
      .set('Authorization', `Bearer ${sinRegistro.token}`);

    expect(respuesta.status).toBe(404);
  });
});
