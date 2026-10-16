// T029 - Pruebas de integración de rutinas (HU3, FR-009 a FR-012, FR-031).

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

let tokenEntrenador = '';
let idEntrenador = 0;
let tokenAdmin = '';
let tokenRecepcionista = '';

function crearRutina(token, cuerpo) {
  return request(app)
    .post('/api/rutinas')
    .set('Authorization', `Bearer ${token}`)
    .send(cuerpo);
}

async function clienteAsignado() {
  const cliente = await crearCliente();
  await asignarDirecto(cliente.id, idEntrenador);
  return cliente;
}

beforeAll(async () => {
  const { usuario, token } = await usuarioYToken('entrenador');
  tokenEntrenador = token;
  idEntrenador = await crearEntrenadorDeUsuario(usuario.id);
  tokenAdmin = (await usuarioYToken('administrador')).token;
  tokenRecepcionista = (await usuarioYToken('recepcionista')).token;
});

afterAll(async () => {
  await limpiarSprint3();
  await limpiarUsuariosPrueba();
  await cerrarPool();
});

describe('HU3 - Rutinas', () => {
  it('crea una rutina con ejercicios', async () => {
    const cliente = await clienteAsignado();

    const respuesta = await crearRutina(tokenEntrenador, {
      idCliente: cliente.id,
      nombre: 'Full body',
      descripcion: 'Tres días por semana',
      ejercicios: [
        { nombre: 'Sentadilla', series: 3, repeticiones: '10', orden: 1 },
        { nombre: 'Press banca', series: 4, repeticiones: '8', orden: 2 },
      ],
    });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.rutina.idCliente).toBe(cliente.id);
    expect(respuesta.body.rutina.estado).toBe('activa');
    expect(respuesta.body.rutina.ejercicios).toHaveLength(2);
    expect(respuesta.body.rutina.ejercicios[0].nombre).toBe('Sentadilla');
  });

  it('rechaza un cliente ajeno al entrenador', async () => {
    const cliente = await crearCliente();

    const respuesta = await crearRutina(tokenEntrenador, {
      idCliente: cliente.id,
      nombre: 'No permitida',
    });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.codigo).toBe('ENTRENADOR_NO_ASIGNADO');
  });

  it('deniega la creación al administrador y al recepcionista', async () => {
    const cliente = await clienteAsignado();

    const comoAdmin = await crearRutina(tokenAdmin, { idCliente: cliente.id, nombre: 'A' });
    const comoRecepcionista = await crearRutina(tokenRecepcionista, {
      idCliente: cliente.id,
      nombre: 'R',
    });

    expect(comoAdmin.status).toBe(403);
    expect(comoRecepcionista.status).toBe(403);
  });

  it('archiva la rutina anterior al crear una nueva activa', async () => {
    const cliente = await clienteAsignado();

    const primera = await crearRutina(tokenEntrenador, {
      idCliente: cliente.id,
      nombre: 'Rutina A',
    });
    const segunda = await crearRutina(tokenEntrenador, {
      idCliente: cliente.id,
      nombre: 'Rutina B',
    });

    expect(primera.status).toBe(201);
    expect(segunda.status).toBe(201);

    const listado = await request(app)
      .get(`/api/rutinas/cliente/${cliente.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(listado.status).toBe(200);
    const porNombre = {};
    for (const rutina of listado.body.rutinas) {
      porNombre[rutina.nombre] = rutina.estado;
    }
    expect(porNombre['Rutina A']).toBe('archivada');
    expect(porNombre['Rutina B']).toBe('activa');
  });

  it('reemplaza la lista de ejercicios de una rutina', async () => {
    const cliente = await clienteAsignado();

    const creada = await crearRutina(tokenEntrenador, {
      idCliente: cliente.id,
      nombre: 'Rutina editable',
      ejercicios: [{ nombre: 'Sentadilla', series: 3, orden: 1 }],
    });

    const respuesta = await request(app)
      .put(`/api/rutinas/${creada.body.rutina.id}/ejercicios`)
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ ejercicios: [{ nombre: 'Peso muerto', series: 5, orden: 1 }] });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.rutina.ejercicios).toHaveLength(1);
    expect(respuesta.body.rutina.ejercicios[0].nombre).toBe('Peso muerto');
  });
});
