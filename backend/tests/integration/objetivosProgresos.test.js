// T037 - Pruebas de integración de objetivos y progresos (HU4, FR-013 a FR-016).

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

async function clienteAsignado() {
  const cliente = await crearCliente();
  await asignarDirecto(cliente.id, idEntrenador);
  return cliente;
}

function crearObjetivo(token, cuerpo) {
  return request(app)
    .post('/api/objetivos')
    .set('Authorization', `Bearer ${token}`)
    .send(cuerpo);
}

function registrarProgreso(token, cuerpo) {
  return request(app)
    .post('/api/progresos')
    .set('Authorization', `Bearer ${token}`)
    .send(cuerpo);
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

describe('HU4 - Objetivos y progresos', () => {
  it('registra un objetivo y un progreso asociado', async () => {
    const cliente = await clienteAsignado();

    const objetivo = await crearObjetivo(tokenEntrenador, {
      idCliente: cliente.id,
      descripcion: 'Reducir grasa corporal',
      valorObjetivo: 75,
      unidad: 'kg',
    });

    expect(objetivo.status).toBe(201);
    expect(objetivo.body.objetivo.id).toBeGreaterThan(0);
    expect(objetivo.body.objetivo.estado).toBe('en_progreso');

    const progreso = await registrarProgreso(tokenEntrenador, {
      idCliente: cliente.id,
      idObjetivo: objetivo.body.objetivo.id,
      valor: 82.5,
      unidad: 'kg',
      observaciones: 'Primera medición',
    });

    expect(progreso.status).toBe(201);
    expect(Number(progreso.body.progreso.valor)).toBe(82.5);
    expect(progreso.body.progreso.idObjetivo).toBe(objetivo.body.objetivo.id);
  });

  it('devuelve el historial de progresos en orden cronológico', async () => {
    const cliente = await clienteAsignado();

    await registrarProgreso(tokenEntrenador, { idCliente: cliente.id, valor: 90 });
    await registrarProgreso(tokenEntrenador, { idCliente: cliente.id, valor: 88 });

    const respuesta = await request(app)
      .get(`/api/progresos/cliente/${cliente.id}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.progresos).toHaveLength(2);
    const ids = respuesta.body.progresos.map((progreso) => progreso.id);
    expect(ids).toEqual([...ids].sort((a, b) => a - b));
  });

  it('rechaza un cliente ajeno al entrenador', async () => {
    const cliente = await crearCliente();

    const respuesta = await crearObjetivo(tokenEntrenador, {
      idCliente: cliente.id,
      descripcion: 'Objetivo ajeno',
    });

    expect(respuesta.status).toBe(403);
    expect(respuesta.body.codigo).toBe('ENTRENADOR_NO_ASIGNADO');
  });

  it('deniega el registro al recepcionista y al administrador', async () => {
    const cliente = await clienteAsignado();
    const cuerpo = { idCliente: cliente.id, descripcion: 'Objetivo prohibido' };

    const comoRecepcionista = await crearObjetivo(tokenRecepcionista, cuerpo);
    const comoAdmin = await crearObjetivo(tokenAdmin, cuerpo);
    const progresoRecepcionista = await registrarProgreso(tokenRecepcionista, {
      idCliente: cliente.id,
      valor: 70,
    });

    expect(comoRecepcionista.status).toBe(403);
    expect(comoAdmin.status).toBe(403);
    expect(progresoRecepcionista.status).toBe(403);
  });

  it('rechaza un progreso que referencia un objetivo de otro cliente', async () => {
    const clienteA = await clienteAsignado();
    const clienteB = await clienteAsignado();

    const objetivo = await crearObjetivo(tokenEntrenador, {
      idCliente: clienteA.id,
      descripcion: 'Objetivo del cliente A',
    });

    const respuesta = await registrarProgreso(tokenEntrenador, {
      idCliente: clienteB.id,
      idObjetivo: objetivo.body.objetivo.id,
      valor: 60,
    });

    expect(respuesta.status).toBe(404);
  });
});
