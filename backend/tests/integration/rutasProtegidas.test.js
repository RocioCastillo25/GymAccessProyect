// T029 - Pruebas de rutas protegidas con token (HU1, FR-003, FR-004, SC-002).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app.js';
import { consultar, cerrarPool } from '../../src/config/baseDatos.js';
import { config } from '../../src/config/entorno.js';

const correoAdmin = process.env.SEED_ADMIN_EMAIL || 'admin@gimnasio.local';
const passwordAdmin = process.env.SEED_ADMIN_PASSWORD || 'CambieClave123';

let tokenValido = '';

async function tokenDe(correo, password) {
  const respuesta = await request(app)
    .post('/api/auth/login')
    .send({ correo, password });
  return respuesta.body.token;
}

describe('Rutas protegidas con token (HU1)', () => {
  beforeAll(async () => {
    tokenValido = await tokenDe(correoAdmin, passwordAdmin);
  });

  afterAll(async () => {
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
    const usuario = (await consultar('SELECT id_usuario, nombre, correo, rol FROM usuarios WHERE correo = ? LIMIT 1;', [correoAdmin]))[0];
    const expirado = jwt.sign(
      { sub: usuario.id_usuario, nombre: usuario.nombre, correo: usuario.correo, rol: usuario.rol, exp: Math.floor(Date.now() / 1000) - 60 },
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
    expect(respuesta.body.usuario.correo).toBe(correoAdmin);
    expect(respuesta.body.usuario).not.toHaveProperty('password');
  });
});
