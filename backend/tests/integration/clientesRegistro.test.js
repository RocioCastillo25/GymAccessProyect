// T039 - Pruebas de integración de registro de clientes (HU2, FR-014, FR-018, FR-020).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import app from '../../src/app.js';
import { consultar, cerrarPool } from '../../src/config/baseDatos.js';
import { usuarioYToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';

let tokenAdmin = '';
let tokenRecepcionista = '';

function nuevoCorreo() {
  return `cliente.registro.${randomUUID()}@pruebas.local`;
}

describe('Registro de clientes (HU2)', () => {
  beforeAll(async () => {
    tokenAdmin = (await usuarioYToken('administrador')).token;
    tokenRecepcionista = (await usuarioYToken('recepcionista')).token;
  });

  afterAll(async () => {
    await consultar('DELETE FROM clientes WHERE correo LIKE ?', ['cliente.registro.%']);
    await limpiarUsuariosPrueba();
    await cerrarPool();
  });

  it('permite al administrador registrar un cliente con datos válidos', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({
        nombre: 'Luis',
        apellido: 'Pérez',
        correo: nuevoCorreo(),
        telefono: '55 1234 5678',
        direccion: 'Calle Norte 10',
      });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.cliente.id).toBeGreaterThan(0);
    expect(respuesta.body.cliente.estado).toBe('activo');
  });

  it('permite al recepcionista registrar un cliente con datos válidos', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenRecepcionista}`)
      .send({ nombre: 'María', apellido: 'López', correo: nuevoCorreo() });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.cliente.apellido).toBe('López');
  });

  it('rechaza el registro sin campos obligatorios y no persiste nada', async () => {
    const correo = nuevoCorreo();
    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ correo });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.codigo).toBe('VALIDACION');
    const campos = respuesta.body.errores.map((error) => error.campo);
    expect(campos).toContain('nombre');
    expect(campos).toContain('apellido');

    const existentes = await consultar('SELECT id_cliente FROM clientes WHERE correo = ?;', [
      correo,
    ]);
    expect(existentes.length).toBe(0);
  });

  it('rechaza un correo con formato inválido', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Ana', apellido: 'Ruiz', correo: 'correo-invalido' });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores.some((error) => error.campo === 'correo')).toBe(true);
  });

  it('rechaza el registro de un correo ya existente sin duplicar el registro', async () => {
    const correo = nuevoCorreo();
    await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ nombre: 'Pedro', apellido: 'Sánchez', correo });

    const respuesta = await request(app)
      .post('/api/clientes')
      .set('Authorization', `Bearer ${tokenRecepcionista}`)
      .send({ nombre: 'Otra', apellido: 'Persona', correo });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.codigo).toBe('DUPLICADO');

    const duplicados = await consultar('SELECT COUNT(*) AS total FROM clientes WHERE correo = ?;', [
      correo,
    ]);
    expect(Number(duplicados[0].total)).toBe(1);
  });

  it('rechaza el registro sin token', async () => {
    const respuesta = await request(app)
      .post('/api/clientes')
      .send({ nombre: 'Sin', apellido: 'Token', correo: nuevoCorreo() });

    expect(respuesta.status).toBe(401);
  });
});
