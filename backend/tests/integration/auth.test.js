// T028 - Pruebas de integración de inicio de sesión (HU1, FR-001 a FR-005, FR-010).
// Requiere la base de datos migrada y el usuario administrador sembrado.

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcrypt';
import app from '../../src/app.js';
import { consultar, cerrarPool } from '../../src/config/baseDatos.js';
import { crearUsuarioPrueba, limpiarUsuariosPrueba } from '../helpers/usuarios.js';

const correoDesactivado = 'usuario.desactivado@pruebas.local';
let adminPrueba = null;

describe('Inicio de sesión (HU1)', () => {
  beforeAll(async () => {
    // Cada ejecución usa su propio administrador para no depender de la
    // contraseña real del administrador sembrado en la base local.
    adminPrueba = await crearUsuarioPrueba('administrador');

    // Usuario de prueba desactivado para verificar FR-010.
    const hash = await bcrypt.hash('Prueba1234', 10);
    await consultar(
      'INSERT INTO usuarios (nombre, correo, password, rol, estado) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE estado = VALUES(estado);',
      ['Usuario Desactivado', correoDesactivado, hash, 'entrenador', 'inactivo']
    );
  });

  afterAll(async () => {
    await consultar('DELETE FROM usuarios WHERE correo = ?;', [correoDesactivado]);
    await limpiarUsuariosPrueba();
    await cerrarPool();
  });

  it('devuelve token y datos del usuario con credenciales válidas', async () => {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({ correo: adminPrueba.correo, password: adminPrueba.password });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.token).toBeTruthy();
    expect(respuesta.body.expiraEn).toBe('60m');
    expect(respuesta.body.usuario.rol).toBe('administrador');
    expect(respuesta.body.usuario).not.toHaveProperty('password');
  });

  it('rechaza la contraseña incorrecta con un mensaje genérico', async () => {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({ correo: adminPrueba.correo, password: 'contraseña_incorrecta' });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.codigo).toBe('AUTENTICACION');
    expect(respuesta.body.mensaje).not.toContain(adminPrueba.correo);
  });

  it('responde igual cuando el correo no existe (no revela si está registrado)', async () => {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({ correo: 'no.existe@pruebas.local', password: 'Prueba1234' });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.mensaje).toBe('Credenciales incorrectas.');
  });

  it('rechaza el acceso de un usuario desactivado con mensaje genérico', async () => {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({ correo: correoDesactivado, password: 'Prueba1234' });

    expect(respuesta.status).toBe(401);
    expect(respuesta.body.codigo).toBe('AUTENTICACION');
    expect(respuesta.body.mensaje).not.toContain('desactivado');
  });

  it('rechaza la solicitud cuando faltan credenciales', async () => {
    const respuesta = await request(app)
      .post('/api/auth/login')
      .send({ correo: adminPrueba.correo });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.codigo).toBe('VALIDACION');
  });
});
