// T058 - Pruebas de asignación de roles (HU4, FR-008, FR-009, FR-013).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { consultar, cerrarPool } from '../../src/config/baseDatos.js';
import { crearUsuarioPrueba, usuarioYToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';

let tokenAdmin = '';
let tokenRecepcionista = '';

describe('Asignación de roles (HU4)', () => {
  beforeAll(async () => {
    tokenAdmin = (await usuarioYToken('administrador')).token;
    tokenRecepcionista = (await usuarioYToken('recepcionista')).token;
  });

  afterAll(async () => {
    await limpiarUsuariosPrueba();
    await cerrarPool();
  });

  it('permite al administrador cambiar el rol de un usuario', async () => {
    const usuario = await crearUsuarioPrueba('entrenador');

    const respuesta = await request(app)
      .patch(`/api/usuarios/${usuario.id}/rol`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ rol: 'recepcionista' });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.usuario.rol).toBe('recepcionista');

    const filas = await consultar('SELECT rol FROM usuarios WHERE id_usuario = ?;', [usuario.id]);
    expect(filas[0].rol).toBe('recepcionista');
  });

  it('rechaza un rol fuera de los definidos', async () => {
    const usuario = await crearUsuarioPrueba('entrenador');

    const respuesta = await request(app)
      .patch(`/api/usuarios/${usuario.id}/rol`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ rol: 'superadmin' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores.some((error) => error.campo === 'rol')).toBe(true);
  });

  it('niega la asignación de roles a quien no sea administrador', async () => {
    const usuario = await crearUsuarioPrueba('entrenador');

    const respuesta = await request(app)
      .patch(`/api/usuarios/${usuario.id}/rol`)
      .set('Authorization', `Bearer ${tokenRecepcionista}`)
      .send({ rol: 'administrador' });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.codigo).toBe('AUTORIZACION');
  });

  it('responde 404 cuando el usuario no existe', async () => {
    const respuesta = await request(app)
      .patch('/api/usuarios/999999/rol')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ rol: 'cliente' });

    expect(respuesta.status).toBe(404);
  });
});
