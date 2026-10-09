// T050 - Pruebas de restablecimiento de contraseña (HU3, FR-011).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../src/app.js';
import { consultar, cerrarPool } from '../../src/config/baseDatos.js';
import { crearUsuarioPrueba, obtenerToken, usuarioYToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';

let admin = null;
let tokenAdmin = '';

describe('Restablecimiento de contraseña (HU3)', () => {
  beforeAll(async () => {
    const creado = await usuarioYToken('administrador');
    admin = creado.usuario;
    tokenAdmin = creado.token;
  });

  afterAll(async () => {
    await limpiarUsuariosPrueba();
    await cerrarPool();
  });

  it('restablece la contraseña, invalida la anterior y almacena el hash', async () => {
    const usuario = await crearUsuarioPrueba('recepcionista');

    const respuesta = await request(app)
      .patch(`/api/usuarios/${usuario.id}/password`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ password: 'NuevaClave456' });

    expect(respuesta.status).toBe(200);

    // La contraseña anterior deja de ser válida.
    const loginViejo = await request(app)
      .post('/api/auth/login')
      .send({ correo: usuario.correo, password: usuario.password });
    expect(loginViejo.status).toBe(401);

    // La nueva contraseña funciona y está hasheada.
    const loginNuevo = await request(app)
      .post('/api/auth/login')
      .send({ correo: usuario.correo, password: 'NuevaClave456' });
    expect(loginNuevo.status).toBe(200);

    const filas = await consultar('SELECT password FROM usuarios WHERE id_usuario = ?;', [
      usuario.id,
    ]);
    expect(filas[0].password).not.toBe('NuevaClave456');
    expect(await bcrypt.compare('NuevaClave456', filas[0].password)).toBe(true);
  });

  it('rechaza una contraseña nueva con menos de 8 caracteres', async () => {
    const usuario = await crearUsuarioPrueba('entrenador');

    const respuesta = await request(app)
      .patch(`/api/usuarios/${usuario.id}/password`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ password: 'corta' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores.some((error) => error.campo === 'password')).toBe(true);
  });

  it('responde 404 cuando el usuario no existe', async () => {
    const respuesta = await request(app)
      .patch('/api/usuarios/999999/password')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ password: 'NuevaClave456' });

    expect(respuesta.status).toBe(404);
  });
});
