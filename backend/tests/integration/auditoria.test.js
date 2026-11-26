// T082 - Pruebas de integración de la consulta de auditoría (FR-036).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import app from '../../src/app.js';
import { consultar, ejecutar, cerrarPool } from '../../src/config/baseDatos.js';
import { usuarioYToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';

let tokenAdmin = '';
let tokenRecepcionista = '';
let tokenEntrenador = '';
let tokenCliente = '';

const idsAuditoria = [];
const sufijo = randomUUID().slice(0, 8);
const moduloUno = `aud-prueba-1-${sufijo}`;
const moduloDos = `aud-prueba-2-${sufijo}`;

function fechaIso(desplazamientoDias) {
  return new Date(Date.now() + desplazamientoDias * 86400000)
    .toISOString()
    .slice(0, 19)
    .replace('T', ' ');
}

async function crearAccion(modulo, resultado) {
  const fecha = fechaIso(0);
  const respuesta = await ejecutar(
    'INSERT INTO auditoria (id_usuario, accion, modulo, fecha, resultado, descripcion) VALUES (?, ?, ?, ?, ?, ?);',
    [null, `accion_${randomUUID()}`, modulo, fecha, resultado, 'Acción de prueba']
  );
  idsAuditoria.push(respuesta.insertId);
  return respuesta.insertId;
}

function listar(token, consulta = '') {
  const peticion = request(app).get(`/api/auditoria${consulta}`);
  if (token) peticion.set('Authorization', `Bearer ${token}`);
  return peticion;
}

beforeAll(async () => {
  tokenAdmin = (await usuarioYToken('administrador')).token;
  tokenRecepcionista = (await usuarioYToken('recepcionista')).token;
  tokenEntrenador = (await usuarioYToken('entrenador')).token;
  tokenCliente = (await usuarioYToken('cliente')).token;
  await crearAccion(moduloUno, 'exito');
  await crearAccion(moduloDos, 'error');
});

afterAll(async () => {
  if (idsAuditoria.length > 0) {
    const marcadores = idsAuditoria.map(() => '?').join(', ');
    await consultar(`DELETE FROM auditoria WHERE id_auditoria IN (${marcadores});`, idsAuditoria);
  }
  await limpiarUsuariosPrueba();
  await cerrarPool();
});

describe('Consulta de auditoría', () => {
  it('permite al administrador listar acciones con sus campos públicos', async () => {
    const respuesta = await listar(tokenAdmin);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.auditoria.length).toBeGreaterThanOrEqual(2);
    const primera = respuesta.body.auditoria[0];
    expect(primera).toHaveProperty('id');
    expect(primera).toHaveProperty('idUsuario');
    expect(primera).toHaveProperty('accion');
    expect(primera).toHaveProperty('modulo');
    expect(primera).toHaveProperty('fecha');
    expect(primera).toHaveProperty('resultado');
    expect(primera).toHaveProperty('descripcion');
    expect(JSON.stringify(respuesta.body)).not.toContain('descriptorFacial');
    expect(JSON.stringify(respuesta.body)).not.toContain('password');
  });

  it('filtra por módulo y resultado', async () => {
    const porModulo = await listar(tokenAdmin, `?modulo=${encodeURIComponent(moduloUno)}`);
    expect(porModulo.status).toBe(200);
    expect(porModulo.body.auditoria).toHaveLength(1);
    expect(porModulo.body.auditoria[0].modulo).toBe(moduloUno);

    const porResultado = await listar(tokenAdmin, '?resultado=error');
    expect(porResultado.status).toBe(200);
    expect(porResultado.body.auditoria.every((accion) => accion.resultado === 'error')).toBe(true);
  });

  it('filtra por rango de fechas', async () => {
    const consulta = `?desde=${fechaIso(-1)}&hasta=${fechaIso(1)}&modulo=${encodeURIComponent(moduloDos)}`;
    const respuesta = await listar(tokenAdmin, consulta);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.auditoria).toHaveLength(1);
    expect(respuesta.body.auditoria[0].modulo).toBe(moduloDos);
  });

  it('rechaza filtros inválidos', async () => {
    const respuesta = await listar(tokenAdmin, '?resultado=desconocido');

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores).toEqual(
      expect.arrayContaining([expect.objectContaining({ campo: 'resultado' })])
    );
  });

  it('reserva la consulta al administrador', async () => {
    const recepcionista = await listar(tokenRecepcionista);
    const entrenador = await listar(tokenEntrenador);
    const cliente = await listar(tokenCliente);
    const sinToken = await listar('');

    expect(recepcionista.status).toBe(403);
    expect(entrenador.status).toBe(403);
    expect(cliente.status).toBe(403);
    expect(sinToken.status).toBe(401);
  });
});
