// T059 - Pruebas de activación y desactivación de usuarios (HU4, FR-010).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { consultar, cerrarPool } from '../../src/config/baseDatos.js';
import { crearUsuarioPrueba, obtenerToken, usuarioYToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';

let tokenAdmin = '';

describe('Activación y desactivación de usuarios (HU4)', () => {
  beforeAll(async () => {
    tokenAdmin = (await usuarioYToken('administrador')).token;
  });

  afterAll(async () => {
    await limpiarUsuariosPrueba();
    await cerrarPool();
  });

  it('impide el inicio de sesión de un usuario desactivado y lo permite al reactivarlo', async () => {
    const usuario = await crearUsuarioPrueba('recepcionista');

    // Se desactiva desde la API.
    const desactivar = await request(app)
      .patch(`/api/usuarios/${usuario.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'inactivo' });

    expect(desactivar.status).toBe(200);
    expect(desactivar.body.usuario.estado).toBe('inactivo');

    // El usuario desactivado no puede iniciar sesión (mensaje genérico).
    const loginBloqueado = await request(app)
      .post('/api/auth/login')
      .send({ correo: usuario.correo, password: usuario.password });
    expect(loginBloqueado.status).toBe(401);
    expect(loginBloqueado.body.mensaje).toBe('Credenciales incorrectas.');

    // Se reactiva y vuelve a poder iniciar sesión.
    const reactivar = await request(app)
      .patch(`/api/usuarios/${usuario.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'activo' });
    expect(reactivar.status).toBe(200);

    const loginPermitido = await request(app)
      .post('/api/auth/login')
      .send({ correo: usuario.correo, password: usuario.password });
    expect(loginPermitido.status).toBe(200);
  });

  it('rechaza un estado que no sea activo o inactivo', async () => {
    const usuario = await crearUsuarioPrueba('entrenador');

    const respuesta = await request(app)
      .patch(`/api/usuarios/${usuario.id}/estado`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'suspendido' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores.some((error) => error.campo === 'estado')).toBe(true);
  });

  it('niega el cambio de estado a quien no sea administrador', async () => {
    const recepcionista = await usuarioYToken('recepcionista');
    const objetivo = await crearUsuarioPrueba('entrenador');

    const respuesta = await request(app)
      .patch(`/api/usuarios/${objetivo.id}/estado`)
      .set('Authorization', `Bearer ${recepcionista.token}`)
      .send({ estado: 'inactivo' });

    expect(respuesta.status).toBe(403);

    const filas = await consultar('SELECT estado FROM usuarios WHERE id_usuario = ?;', [
      objetivo.id,
    ]);
    expect(filas[0].estado).toBe('activo');
  });
});
