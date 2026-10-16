// T013 - Pruebas de integración de gestión de entrenadores (HU1, FR-001 a FR-004).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { consultar, cerrarPool } from '../../src/config/baseDatos.js';
import { crearUsuarioPrueba, usuarioYToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';

let tokenAdmin = '';
let tokenRecepcionista = '';

const idsEntrenadores = [];

function registrarEntrenador(token, cuerpo) {
  return request(app)
    .post('/api/entrenadores')
    .set('Authorization', `Bearer ${token}`)
    .send(cuerpo);
}

beforeAll(async () => {
  tokenAdmin = (await usuarioYToken('administrador')).token;
  tokenRecepcionista = (await usuarioYToken('recepcionista')).token;
});

afterAll(async () => {
  if (idsEntrenadores.length > 0) {
    const marcadores = idsEntrenadores.map(() => '?').join(', ');
    await consultar(`DELETE FROM entrenadores WHERE id_entrenador IN (${marcadores});`, idsEntrenadores);
  }
  await limpiarUsuariosPrueba();
  await cerrarPool();
});

describe('HU1 - Gestión de entrenadores', () => {
  it('el administrador registra un entrenador válido', async () => {
    const usuario = await crearUsuarioPrueba('entrenador');
    const respuesta = await registrarEntrenador(tokenAdmin, {
      idUsuario: usuario.id,
      especialidad: 'Fuerza',
      telefono: '555-1234',
    });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.entrenador.id).toBeGreaterThan(0);
    expect(respuesta.body.entrenador.especialidad).toBe('Fuerza');
    expect(respuesta.body.entrenador.estado).toBe('activo');
    idsEntrenadores.push(respuesta.body.entrenador.id);
  });

  it('rechaza un usuario inexistente', async () => {
    const respuesta = await registrarEntrenador(tokenAdmin, { idUsuario: 999999 });
    expect(respuesta.status).toBe(404);
  });

  it('rechaza un usuario que no tiene el rol de entrenador', async () => {
    const usuario = await crearUsuarioPrueba('recepcionista');
    const respuesta = await registrarEntrenador(tokenAdmin, { idUsuario: usuario.id });
    expect(respuesta.status).toBe(409);
  });

  it('rechaza un usuario ya asociado a un entrenador', async () => {
    const usuario = await crearUsuarioPrueba('entrenador');
    const primero = await registrarEntrenador(tokenAdmin, { idUsuario: usuario.id });
    idsEntrenadores.push(primero.body.entrenador.id);

    const segundo = await registrarEntrenador(tokenAdmin, { idUsuario: usuario.id });

    expect(primero.status).toBe(201);
    expect(segundo.status).toBe(409);
  });

  it('deniega el registro al recepcionista', async () => {
    const usuario = await crearUsuarioPrueba('entrenador');
    const respuesta = await registrarEntrenador(tokenRecepcionista, { idUsuario: usuario.id });
    expect(respuesta.status).toBe(403);
  });
});
