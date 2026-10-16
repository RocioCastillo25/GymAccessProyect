// T010 - Pruebas de integración de tipos de membresía (HU1, FR-001 a FR-004).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import app from '../../src/app.js';
import { consultar, cerrarPool } from '../../src/config/baseDatos.js';
import { usuarioYToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';

let tokenAdmin = '';
let tokenRecepcionista = '';
let tokenEntrenador = '';

function nuevoNombre() {
  return `Prueba ${randomUUID()}`;
}

async function crearTipo(token, cuerpo) {
  return request(app)
    .post('/api/tipos-membresia')
    .set('Authorization', `Bearer ${token}`)
    .send(cuerpo);
}

beforeAll(async () => {
  tokenAdmin = (await usuarioYToken('administrador')).token;
  tokenRecepcionista = (await usuarioYToken('recepcionista')).token;
  tokenEntrenador = (await usuarioYToken('entrenador')).token;
});

afterAll(async () => {
  await consultar("DELETE FROM tipos_membresia WHERE nombre LIKE 'Prueba %';");
  await limpiarUsuariosPrueba();
  await cerrarPool();
});

describe('HU1 - Registro de tipos de membresía', () => {
  it('el administrador crea un tipo con datos válidos y queda en la consulta', async () => {
    const nombre = nuevoNombre();
    const respuesta = await crearTipo(tokenAdmin, {
      nombre,
      descripcion: 'Acceso 30 días',
      duracion: 30,
      precio: 350.0,
    });

    expect(respuesta.status).toBe(201);
    expect(respuesta.body.tipoMembresia.id).toBeGreaterThan(0);
    expect(respuesta.body.tipoMembresia.nombre).toBe(nombre);
    expect(respuesta.body.tipoMembresia.estado).toBe('activo');

    const listado = await request(app)
      .get('/api/tipos-membresia')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(listado.status).toBe(200);
    expect(listado.body.tiposMembresia.some((tipo) => tipo.nombre === nombre)).toBe(true);
  });

  it('el administrador modifica un tipo sin alterar datos inválidos', async () => {
    const creado = await crearTipo(tokenAdmin, {
      nombre: nuevoNombre(),
      duracion: 15,
      precio: 200,
    });
    const id = creado.body.tipoMembresia.id;

    const respuesta = await request(app)
      .patch(`/api/tipos-membresia/${id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ duracion: 20, precio: 250.5 });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.tipoMembresia.duracion).toBe(20);
    expect(Number(respuesta.body.tipoMembresia.precio)).toBe(250.5);
  });

  it('rechaza duración menor o igual a cero y precio negativo sin persistir', async () => {
    const nombre = nuevoNombre();
    const respuesta = await crearTipo(tokenAdmin, {
      nombre,
      duracion: 0,
      precio: -5,
    });

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.codigo).toBe('VALIDACION');
    const campos = respuesta.body.errores.map((error) => error.campo);
    expect(campos).toContain('duracion');
    expect(campos).toContain('precio');

    const existentes = await consultar(
      'SELECT id_tipo_membresia FROM tipos_membresia WHERE nombre = ?;',
      [respuesta.request?._data?.nombre || '']
    );
    expect(existentes.length).toBe(0);
  });

  it('rechaza la creación sin nombre', async () => {
    const respuesta = await crearTipo(tokenAdmin, { duracion: 30, precio: 300 });
    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores.some((error) => error.campo === 'nombre')).toBe(true);
  });

  it('rechaza un nombre de tipo ya registrado', async () => {
    const nombre = nuevoNombre();
    await crearTipo(tokenAdmin, { nombre, duracion: 30, precio: 300 });
    const respuesta = await crearTipo(tokenAdmin, { nombre, duracion: 60, precio: 500 });

    expect(respuesta.status).toBe(409);
    expect(respuesta.body.codigo).toBe('DUPLICADO');
  });

  it('deniega la creación al recepcionista y al entrenador', async () => {
    const comoRecepcionista = await crearTipo(tokenRecepcionista, {
      nombre: nuevoNombre(),
      duracion: 30,
      precio: 300,
    });
    const comoEntrenador = await crearTipo(tokenEntrenador, {
      nombre: nuevoNombre(),
      duracion: 30,
      precio: 300,
    });

    expect(comoRecepcionista.status).toBe(403);
    expect(comoEntrenador.status).toBe(403);
  });

  it('deniega la modificación al recepcionista', async () => {
    const creado = await crearTipo(tokenAdmin, { nombre: nuevoNombre(), duracion: 30, precio: 300 });
    const respuesta = await request(app)
      .patch(`/api/tipos-membresia/${creado.body.tipoMembresia.id}`)
      .set('Authorization', `Bearer ${tokenRecepcionista}`)
      .send({ precio: 400 });

    expect(respuesta.status).toBe(403);
  });

  it('el entrenador solo recibe id, nombre y duracion (sin precio)', async () => {
    await crearTipo(tokenAdmin, { nombre: nuevoNombre(), duracion: 90, precio: 900 });

    const respuesta = await request(app)
      .get('/api/tipos-membresia')
      .set('Authorization', `Bearer ${tokenEntrenador}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.tiposMembresia.length).toBeGreaterThan(0);
    for (const tipo of respuesta.body.tiposMembresia) {
      expect(tipo).toHaveProperty('nombre');
      expect(tipo).toHaveProperty('duracion');
      expect(tipo).not.toHaveProperty('precio');
      expect(tipo).not.toHaveProperty('descripcion');
    }
  });

  it('el recepcionista consulta todos los campos, incluido el precio', async () => {
    const respuesta = await request(app)
      .get('/api/tipos-membresia')
      .set('Authorization', `Bearer ${tokenRecepcionista}`);

    expect(respuesta.status).toBe(200);
    if (respuesta.body.tiposMembresia.length > 0) {
      expect(respuesta.body.tiposMembresia[0]).toHaveProperty('precio');
    }
  });

  it('devuelve 400 al validar duración o precio inválidos y 404 con id inexistente', async () => {
    const duracionInvalida = await crearTipo(tokenAdmin, {
      nombre: nuevoNombre(),
      duracion: 0,
      precio: 100,
    });
    const precioInvalido = await crearTipo(tokenAdmin, {
      nombre: nuevoNombre(),
      duracion: 30,
      precio: -1,
    });
    const noEncontrado = await request(app)
      .patch('/api/tipos-membresia/999999/estado')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ estado: 'inactivo' });

    expect(duracionInvalida.status).toBe(400);
    expect(precioInvalido.status).toBe(400);
    expect(noEncontrado.status).toBe(404);
  });
});
