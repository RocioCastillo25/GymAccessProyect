// T029 - Pruebas de rutas protegidas con token (HU1, FR-003, FR-004, SC-002).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';
import { cerrarPool } from '../../src/config/baseDatos.js';
import { config } from '../../src/config/entorno.js';
import { usuarioYToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';

let tokenValido = '';
let adminPrueba = null;

describe('Rutas protegidas con token (HU1)', () => {
  beforeAll(async () => {
    // Administrador propio de la prueba: no depende de la contraseña real.
    const sesion = await usuarioYToken('administrador');
    adminPrueba = sesion.usuario;
    tokenValido = sesion.token;
  });

  afterAll(async () => {
    await limpiarUsuariosPrueba();
    await cerrarPool();
  });

  it('responde 401 en una ruta protegida sin token', async () => {
    const respuesta = await request(app).get('/api/auth/me');

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.codigo).toBe('AUTENTICACION');
  });

  it('responde 401 con un token manipulado', async () => {
    const manipulado = `${tokenValido.slice(0, -3)}aaa`;
    const respuesta = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${manipulado}`);

    expect(respuesta.status).toBe(401);
  });

  it('responde 401 con un token expirado', async () => {
    const expirado = jwt.sign(
      {
        sub: adminPrueba.id,
        nombre: `Usuario ${adminPrueba.rol}`,
        correo: adminPrueba.correo,
        rol: adminPrueba.rol,
        exp: Math.floor(Date.now() / 1000) - 60,
      },
      config.jwt.secreto
    );
    const respuesta = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${expirado}`);

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.mensaje).toContain('expirado');
  });

  it('devuelve el usuario de la sesión con un token válido', async () => {
    const respuesta = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${tokenValido}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.usuario.correo).toBe(adminPrueba.correo);
    expect(respuesta.body.usuario).not.toHaveProperty('password');
  });
});
