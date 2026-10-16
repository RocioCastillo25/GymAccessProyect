// T021 - Pruebas de integración de asignaciones de entrenador (HU2, FR-005 a FR-008).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { consultar, cerrarPool } from '../../src/config/baseDatos.js';
import { usuarioYToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';
import { crearCliente, crearEntrenadorDeUsuario, limpiarSprint3 } from '../helpers/sprint3.js';

let tokenAdmin = '';
let tokenRecepcionista = '';
let tokenEntrenador = '';
let tokenCliente = '';

async function nuevoEntrenador(estado = 'activo') {
  const { usuario } = await usuarioYToken('entrenador');
  const idEntrenador = await crearEntrenadorDeUsuario(usuario.id, { estado });
  return idEntrenador;
}

function asignar(token, cuerpo) {
  return request(app)
    .post('/api/asignaciones')
    .set('Authorization', `Bearer ${token}`)
    .send(cuerpo);
}

beforeAll(async () => {
  tokenAdmin = (await usuarioYToken('administrador')).token;
  tokenRecepcionista = (await usuarioYToken('recepcionista')).token;
  tokenEntrenador = (await usuarioYToken('entrenador')).token;
  tokenCliente = (await usuarioYToken('cliente')).token;
});

afterAll(async () => {
  await limpiarSprint3();
  await limpiarUsuariosPrueba();
  await cerrarPool();
});

describe('HU2 - Asignación de entrenadores', () => {
  it('el recepcionista asigna un entrenador a un cliente activo', async () => {
    const cliente = await crearCliente();
    const idEntrenador = await nuevoEntrenador();

    const respuesta = await asignar(tokenRecepcionista, {
      idCliente: cliente.id,
      idEntrenador,
      esPrincipal: true,
    });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.asignacion.id).toBeGreaterThan(0);
    expect(respuesta.body.asignacion.idCliente).toBe(cliente.id);
    expect(respuesta.body.asignacion.esPrincipal).toBe(true);
    expect(respuesta.body.asignacion.estado).toBe('activa');
  });

  it('rechaza un cliente inactivo', async () => {
    const cliente = await crearCliente({ estado: 'inactivo' });
    const idEntrenador = await nuevoEntrenador();

    const respuesta = await asignar(tokenAdmin, { idCliente: cliente.id, idEntrenador });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.codigo).toBe('CLIENTE_INACTIVO');
  });

  it('rechaza un entrenador inactivo', async () => {
    const cliente = await crearCliente();
    const idEntrenador = await nuevoEntrenador('inactivo');

    const respuesta = await asignar(tokenAdmin, { idCliente: cliente.id, idEntrenador });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.codigo).toBe('ENTRENADOR_INACTIVO');
  });

  it('mantiene un único entrenador principal activo por cliente', async () => {
    const cliente = await crearCliente();
    const primerEntrenador = await nuevoEntrenador();
    const segundoEntrenador = await nuevoEntrenador();

    const primera = await asignar(tokenAdmin, {
      idCliente: cliente.id,
      idEntrenador: primerEntrenador,
      esPrincipal: true,
    });
    const segunda = await asignar(tokenAdmin, {
      idCliente: cliente.id,
      idEntrenador: segundoEntrenador,
      esPrincipal: true,
    });

    expect(primera.status).toBe(201);
    expect(segunda.status).toBe(201);

    const filas = await consultar(
      'SELECT estado FROM asignaciones_entrenador WHERE id_cliente = ? ORDER BY id_asignacion;',
      [cliente.id]
    );
    expect(filas.map((fila) => fila.estado)).toEqual(['finalizada', 'activa']);
  });

  it('deniega la asignación al entrenador y al cliente', async () => {
    const cliente = await crearCliente();
    const idEntrenador = await nuevoEntrenador();

    const comoEntrenador = await asignar(tokenEntrenador, {
      idCliente: cliente.id,
      idEntrenador,
    });
    const comoCliente = await asignar(tokenCliente, { idCliente: cliente.id, idEntrenador });

    expect(comoEntrenador.status).toBe(403);
    expect(comoCliente.status).toBe(403);
  });
});
