// Pruebas de integración de los reportes del Sprint 4 (US-S4-01 a US-S4-03).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import app from '../../src/app.js';
import { consultar, ejecutar, cerrarPool } from '../../src/config/baseDatos.js';
import { usuarioYToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';
import { hoyIso, sumarDias } from '../../src/utils/fechas.js';

let tokenAdmin = '';
let tokenRecepcionista = '';

const idsClientes = [];
const idsTipos = [];

async function crearCliente() {
  const correo = `reporte.cliente.${randomUUID()}@pruebas.local`;
  const resultado = await ejecutar(
    'INSERT INTO clientes (nombre, apellido, correo, estado) VALUES (?, ?, ?, ?);',
    ['Cliente', 'Reporte', correo, 'activo']
  );
  idsClientes.push(resultado.insertId);
  return resultado.insertId;
}

async function crearTipo() {
  const nombre = `Tipo reporte ${randomUUID()}`;
  const resultado = await ejecutar(
    'INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado) VALUES (?, ?, ?, ?, ?);',
    [nombre, null, 30, 250, 'activo']
  );
  idsTipos.push(resultado.insertId);
  return resultado.insertId;
}

async function crearMembresia(idCliente, idTipo, fechaFin) {
  const resultado = await ejecutar(
    'INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado) VALUES (?, ?, ?, ?, ?);',
    [idCliente, idTipo, hoyIso(), fechaFin, 'activa']
  );
  return resultado.insertId;
}

beforeAll(async () => {
  tokenAdmin = (await usuarioYToken('administrador')).token;
  tokenRecepcionista = (await usuarioYToken('recepcionista')).token;
});

afterAll(async () => {
  const marcadoresClientes = idsClientes.map(() => '?').join(', ');
  if (idsClientes.length > 0) {
    await consultar(`DELETE FROM accesos WHERE id_cliente IN (${marcadoresClientes});`, idsClientes);
    await consultar(`DELETE FROM pagos WHERE id_cliente IN (${marcadoresClientes});`, idsClientes);
    await consultar(`DELETE FROM membresias WHERE id_cliente IN (${marcadoresClientes});`, idsClientes);
    await consultar(`DELETE FROM clientes WHERE id_cliente IN (${marcadoresClientes});`, idsClientes);
  }
  const marcadoresTipos = idsTipos.map(() => '?').join(', ');
  if (idsTipos.length > 0) {
    await consultar(
      `DELETE FROM tipos_membresia WHERE id_tipo_membresia IN (${marcadoresTipos});`,
      idsTipos
    );
  }
  await limpiarUsuariosPrueba();
  await cerrarPool();
});

describe('Sprint 4 - Reportes y alertas', () => {
  it('exige autenticación en los reportes', async () => {
    const respuesta = await request(app).get('/api/reports/financial');
    expect(respuesta.status).toBe(401);
  });

  it('deniega el reporte financiero al recepcionista', async () => {
    const respuesta = await request(app)
      .get('/api/reports/financial?fechaInicio=2026-01-01&fechaFin=2026-01-31')
      .set('Authorization', `Bearer ${tokenRecepcionista}`);
    expect(respuesta.status).toBe(403);
  });

  it('valida el rango de fechas del reporte financiero', async () => {
    const respuesta = await request(app)
      .get('/api/reports/financial?fechaInicio=2026-02-01&fechaFin=2026-01-01')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.codigo).toBe('VALIDACION');
  });

  it('genera el reporte financiero con los ingresos del periodo', async () => {
    const idCliente = await crearCliente();
    const idTipo = await crearTipo();
    const idMembresia = await crearMembresia(idCliente, idTipo, sumarDias(hoyIso(), 30));
    await ejecutar(
      'INSERT INTO pagos (id_cliente, id_membresia, monto, metodo_pago, estado) VALUES (?, ?, ?, ?, ?);',
      [idCliente, idMembresia, 250, 'efectivo', 'completado']
    );

    const respuesta = await request(app)
      .get(`/api/reports/financial?fechaInicio=${hoyIso()}&fechaFin=${hoyIso()}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.reporte.resumen.totalTransacciones).toBeGreaterThanOrEqual(1);
    expect(respuesta.body.reporte.resumen.totalRecaudado).toBeGreaterThanOrEqual(250);
    expect(Array.isArray(respuesta.body.reporte.porMetodoPago)).toBe(true);
    expect(Array.isArray(respuesta.body.reporte.porTipoMembresia)).toBe(true);
  });

  it('genera el reporte de accesos con filtro por cliente', async () => {
    const idCliente = await crearCliente();
    await ejecutar(
      'INSERT INTO accesos (id_cliente, tipo, resultado) VALUES (?, ?, ?);',
      [idCliente, 'entrada', 'autorizado']
    );
    await ejecutar(
      'INSERT INTO accesos (id_cliente, tipo, resultado) VALUES (?, ?, ?);',
      [idCliente, 'salida', 'rechazado']
    );

    const respuesta = await request(app)
      .get(
        `/api/reports/access?fechaInicio=${hoyIso()}&fechaFin=${hoyIso()}&idCliente=${idCliente}`
      )
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.reporte.resumen.totalAccesos).toBe(2);
    expect(respuesta.body.reporte.resumen.autorizados).toBe(1);
    expect(respuesta.body.reporte.resumen.rechazados).toBe(1);
  });

  it('el recepcionista consulta las membresías que vencen en cinco días o menos', async () => {
    const idCliente = await crearCliente();
    const idTipo = await crearTipo();
    await crearMembresia(idCliente, idTipo, sumarDias(hoyIso(), 3));

    const respuesta = await request(app)
      .get('/api/reports/expiring-memberships')
      .set('Authorization', `Bearer ${tokenRecepcionista}`);

    expect(respuesta.status).toBe(200);
    const alerta = respuesta.body.alertas.find((item) => item.idCliente === idCliente);
    expect(alerta).toBeDefined();
    expect(alerta.diasRestantes).toBeLessThanOrEqual(5);
    expect(alerta).not.toHaveProperty('descriptorFacial');
  });
});
