// T046 - Pruebas de integración de "Mi entrenamiento" (HU5, FR-017 a FR-018).

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

let tokenCliente = '';
let idCliente = 0;
let idEntrenador = 0;
let tokenEntrenador = '';

beforeAll(async () => {
  const entrenador = await usuarioYToken('entrenador');
  tokenEntrenador = entrenador.token;
  idEntrenador = await crearEntrenadorDeUsuario(entrenador.usuario.id);

  const cliente = await usuarioYToken('cliente');
  tokenCliente = cliente.token;
  const registroCliente = await crearCliente({ correo: cliente.usuario.correo });
  idCliente = registroCliente.id;

  await asignarDirecto(idCliente, idEntrenador);

  await request(app)
    .post('/api/rutinas')
    .set('Authorization', `Bearer ${tokenEntrenador}`)
    .send({
      idCliente,
      nombre: 'Rutina del cliente',
      ejercicios: [{ nombre: 'Sentadilla', series: 3, orden: 1 }],
    });

  await request(app)
    .post('/api/progresos')
    .set('Authorization', `Bearer ${tokenEntrenador}`)
    .send({ idCliente, valor: 90, unidad: 'kg' });
  await request(app)
    .post('/api/progresos')
    .set('Authorization', `Bearer ${tokenEntrenador}`)
    .send({ idCliente, valor: 88, unidad: 'kg' });
});

afterAll(async () => {
  await limpiarSprint3();
  await limpiarUsuariosPrueba();
  await cerrarPool();
});

describe('HU5 - Mi entrenamiento', () => {
  it('el cliente consulta su propia rutina', async () => {
    const respuesta = await request(app)
      .get('/api/rutinas/yo')
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.rutina.nombre).toBe('Rutina del cliente');
    expect(respuesta.body.rutina.ejercicios).toHaveLength(1);
  });

  it('el cliente consulta su progreso en orden', async () => {
    const respuesta = await request(app)
      .get('/api/progresos/yo')
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.progresos).toHaveLength(2);
    const ids = respuesta.body.progresos.map((progreso) => progreso.id);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
  });

  it('deniega el acceso a datos ajenos', async () => {
    const entrenador = await request(app)
      .get('/api/rutinas/yo')
      .set('Authorization', `Bearer ${tokenEntrenador}`);
    const progresoAjeno = await request(app)
      .get('/api/progresos/yo')
      .set('Authorization', `Bearer ${tokenEntrenador}`);

    expect(entrenador.status).toBe(403);
    expect(progresoAjeno.status).toBe(403);
  });

  it('protege las rutas por rol', async () => {
    const clienteEnRutinas = await request(app)
      .get('/api/rutinas')
      .set('Authorization', `Bearer ${tokenCliente}`);
    const clienteAlCrear = await request(app)
      .post('/api/rutinas')
      .set('Authorization', `Bearer ${tokenCliente}`)
      .send({ idCliente, nombre: 'No permitida' });
    const clienteEnClienteAjeno = await request(app)
      .get(`/api/rutinas/cliente/${idCliente}`)
      .set('Authorization', `Bearer ${tokenCliente}`);

    expect(clienteEnRutinas.status).toBe(403);
    expect(clienteAlCrear.status).toBe(403);
    expect(clienteEnClienteAjeno.status).toBe(403);
  });
});
