// T049 - Pruebas de integración de creación de usuarios (HU3, FR-007 a FR-013).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../src/app.js';
import { consultar, cerrarPool } from '../../src/config/baseDatos.js';
import { usuarioYToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';

let tokenAdmin = '';
let tokenRecepcionista = '';

function nuevoCorreo() {
  return `usuario.creacion.${randomUUID()}@pruebas.local`;
}

describe('Creación de usuarios (HU3)', () => {
  beforeAll(async () => {
    tokenAdmin = (await usuarioYToken('administrador')).token;
    tokenRecepcionista = (await usuarioYToken('recepcionista')).token;
  });

  afterAll(async () => {
    await limpiarUsuariosPrueba();
    await cerrarPool();
  });

  it('permite al administrador crear un usuario con hash bcrypt', async () => {
    const correo = nuevoCorreo();
    const respuesta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Ana Torres', correo, password: 'Secreta123', rol: 'recepcionista' });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.usuario).not.toHaveProperty('password');
    expect(respuesta.body.usuario.rol).toBe('recepcionista');
    expect(respuesta.body.usuario.estado).toBe('activo');

    const filas = await consultar('SELECT password FROM usuarios WHERE correo = ?;', [correo]);
    expect(filas.length).toBe(1);
    expect(filas[0].password).not.toBe('Secreta123');
    expect(await bcrypt.compare('Secreta123', filas[0].password)).toBe(true);
  });

  it('rechaza un correo ya registrado sin duplicar el usuario', async () => {
    const correo = nuevoCorreo();
    await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Primero', correo, password: 'Secreta123', rol: 'entrenador' });

    const respuesta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Segundo', correo, password: 'Secreta123', rol: 'entrenador' });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.codigo).toBe('DUPLICADO');

    const filas = await consultar('SELECT COUNT(*) AS total FROM usuarios WHERE correo = ?;', [
      correo,
    ]);
    expect(Number(filas[0].total)).toBe(1);
  });

  it('rechaza un rol fuera de los definidos', async () => {
    const respuesta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Rol inválido', correo: nuevoCorreo(), password: 'Secreta123', rol: 'superadmin' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores.some((error) => error.campo === 'rol')).toBe(true);
  });

  it('rechaza una contraseña con menos de 8 caracteres', async () => {
    const respuesta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Corta', correo: nuevoCorreo(), password: 'abc123', rol: 'cliente' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores.some((error) => error.campo === 'password')).toBe(true);
  });

  it('niega la creación de usuarios a quien no sea administrador', async () => {
    const respuesta = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenRecepcionista}`)
      .send({ nombre: 'No admin', correo: nuevoCorreo(), password: 'Secreta123', rol: 'cliente' });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.codigo).toBe('AUTORIZACION');
  });

  it('devuelve el detalle de un usuario por su identificador', async () => {
    const creado = await request(app)
      .post('/api/usuarios')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Detalle', correo: nuevoCorreo(), password: 'Secreta123', rol: 'entrenador' });

    const respuesta = await request(app)
      .get(`/api/usuarios/${creado.body.usuario.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.usuario.correo).toBe(creado.body.usuario.correo);
    expect(respuesta.body.usuario).not.toHaveProperty('password');
  });

  it('responde 404 al pedir el detalle de un usuario inexistente', async () => {
    const respuesta = await request(app)
      .get('/api/usuarios/999999')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(404);
    expect(respuesta.body.codigo).toBe('NO_ENCONTRADO');
  });

  it('niega la consulta de usuarios a quien no sea administrador', async () => {
    const respuesta = await request(app)
      .get('/api/usuarios')
      .set('Authorization', `Bearer ${tokenRecepcionista}`);

    expect(respuesta.status).toBe(403);
  });
});
