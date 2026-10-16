// T059 - Pruebas de integración del personal asignado (HU7, FR-008).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { cerrarPool } from '../../src/config/baseDatos.js';
import { usuarioYToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';
import {
  crearCliente,
  crearEntrenadorDeUsuario,
  asignarDirecto,
  limpiarSprint3,
} from '../helpers/sprint3.js';

let tokenAdmin = '';
let tokenEntrenador = '';
let tokenCliente = '';
let idEntrenador = 0;
let idCliente = 0;

beforeAll(async () => {
  const entrenador = await usuarioYToken('entrenador');
  tokenEntrenador = entrenador.token;
  idEntrenador = await crearEntrenadorDeUsuario(entrenador.usuario.id);

  tokenAdmin = (await usuarioYToken('administrador')).token;
  tokenCliente = (await usuarioYToken('cliente')).token;

  const cliente = await crearCliente();
  idCliente = cliente.id;
  await asignarDirecto(idCliente, idEntrenador);
});

afterAll(async () => {
  await limpiarSprint3();
  await limpiarUsuariosPrueba();
  await cerrarPool();
});

describe('HU7 - Personal asignado', () => {
  it('el administrador lista los clientes de un entrenador', async () => {
    const respuesta = await request(app)
      .get(`/api/asignaciones/entrenador/${idEntrenador}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.asignaciones.some((item) => item.idCliente === idCliente)).toBe(true);
  });

  it('el entrenador consulta su propia carga', async () => {
    const respuesta = await request(app)
      .get('/api/asignaciones/yo')
      .set('Authorization', `Bearer ${tokenEntrenador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.asignaciones.some((item) => item.idCliente === idCliente)).toBe(true);
  });

  it('deniega la consulta al cliente', async () => {
    const respuesta = await request(app)
      .get(`/api/asignaciones/entrenador/${idEntrenador}`)
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(respuesta.status).toBe(403);
  });
});
