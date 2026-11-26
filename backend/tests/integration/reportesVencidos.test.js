// Pruebas de integración del reporte de clientes vencidos (US-S4-07).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { consultar, cerrarPool } from '../../src/config/baseDatos.js';
import { usuarioYToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';
import {
  crearClienteReporte,
  crearMembresiaReporte,
  crearTipoMembresiaReporte,
  limpiarReportes,
} from '../helpers/reportes.js';
import { hoyIso, sumarDias } from '../../src/utils/fechas.js';

const FECHA_INICIO = '2020-01-01';
const FECHA_FIN = '2020-02-28';

let admin;
let tokenAdmin = '';
let tokenRecepcionista = '';
let tokenEntrenador = '';
let tokenCliente = '';
let idTipo;
let vencidoReciente;
let vencidoAntiguo;
let sinMembresia;
let activoVigente;
let buscado;

async function crearClienteConMembresias(nombre, apellido, membresias) {
  const cliente = await crearClienteReporte({ nombre, apellido });
  const ids = [];
  for (const membresia of membresias) {
    ids.push(
      await crearMembresiaReporte({
        idCliente: cliente.id,
        idTipoMembresia: idTipo,
        ...membresia,
      })
    );
  }
  return { idCliente: cliente.id, idsMembresias: ids, correo: cliente.correo };
}

beforeAll(async () => {
  admin = await usuarioYToken('administrador');
  tokenAdmin = admin.token;
  tokenRecepcionista = (await usuarioYToken('recepcionista')).token;
  tokenEntrenador = (await usuarioYToken('entrenador')).token;
  tokenCliente = (await usuarioYToken('cliente')).token;
  idTipo = await crearTipoMembresiaReporte({ nombre: `Tipo vencidos ${Date.now()}` });

  vencidoReciente = await crearClienteConMembresias('Vencido', 'Reciente', [
    { fechaInicio: '2019-12-01', fechaFin: '2020-01-10', estado: 'vencida' },
    { fechaInicio: '2020-01-15', fechaFin: '2020-02-20', estado: 'vencida' },
  ]);
  vencidoAntiguo = await crearClienteConMembresias('Vencido', 'Antiguo', [
    { fechaInicio: '2019-11-01', fechaFin: '2019-12-01', estado: 'vencida' },
  ]);
  sinMembresia = await crearClienteReporte({ nombre: 'Sin', apellido: 'Membresia' });
  activoVigente = await crearClienteConMembresias('Activo', 'Vigente', [
    { fechaInicio: '2020-01-01', fechaFin: '2020-02-01', estado: 'vencida' },
    { fechaInicio: hoyIso(), fechaFin: sumarDias(hoyIso(), 30), estado: 'activa' },
  ]);
  buscado = await crearClienteConMembresias('Buscado', 'Especial', [
    { fechaInicio: '2020-01-01', fechaFin: '2020-02-10', estado: 'vencida' },
  ]);
});

afterAll(async () => {
  await limpiarReportes();
  await limpiarUsuariosPrueba();
  await cerrarPool();
});

function url(extra = {}) {
  return new URLSearchParams({
    fechaInicio: FECHA_INICIO,
    fechaFin: FECHA_FIN,
    ...extra,
  }).toString();
}

describe('Reporte de clientes vencidos', () => {
  it('permite consultar al administrador y al recepcionista', async () => {
    for (const token of [tokenAdmin, tokenRecepcionista]) {
      const respuesta = await request(app)
        .get(`/api/reports/expired-clients?${url()}`)
        .set('Authorization', `Bearer ${token}`);
      expect(respuesta.status).toBe(200);
      expect(Array.isArray(respuesta.body.reporte.clientes)).toBe(true);
    }
  });

  it.each([
    ['entrenador', () => tokenEntrenador],
    ['cliente', () => tokenCliente],
  ])('rechaza al rol %s con 403', async (_rol, obtenerToken) => {
    const respuesta = await request(app)
      .get(`/api/reports/expired-clients?${url()}`)
      .set('Authorization', `Bearer ${obtenerToken()}`);
    expect(respuesta.status).toBe(403);
  });

  it('incluye vencidos del rango y clientes sin membresía', async () => {
    const respuesta = await request(app)
      .get(`/api/reports/expired-clients?${url()}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    const ids = respuesta.body.reporte.clientes.map((cliente) => cliente.idCliente);
    expect(ids).toContain(vencidoReciente.idCliente);
    expect(ids).toContain(sinMembresia.id);
    expect(ids).toContain(buscado.idCliente);
    expect(ids).not.toContain(vencidoAntiguo.idCliente);
    expect(ids).not.toContain(activoVigente.idCliente);
  });

  it('muestra una sola fila por cliente con su membresía vencida más reciente', async () => {
    const respuesta = await request(app)
      .get(`/api/reports/expired-clients?${url()}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    const filas = respuesta.body.reporte.clientes.filter(
      (cliente) => cliente.idCliente === vencidoReciente.idCliente
    );
    expect(filas).toHaveLength(1);
    expect(filas[0].idMembresia).toBe(vencidoReciente.idsMembresias[1]);
    expect(filas[0].fechaFin).toBe('2020-02-20');
    expect(filas[0].tipoMembresia).toContain('Tipo vencidos');
    expect(filas[0].estado).toBe('vencida');
  });

  it('filtra por nombre o correo del cliente', async () => {
    const porNombre = await request(app)
      .get(`/api/reports/expired-clients?${url({ buscar: 'Buscado' })}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(porNombre.status).toBe(200);
    expect(porNombre.body.reporte.total).toBe(1);
    expect(porNombre.body.reporte.clientes[0].idCliente).toBe(buscado.idCliente);

    const porCorreo = await request(app)
      .get(`/api/reports/expired-clients?${url({ buscar: buscado.correo })}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(porCorreo.body.reporte.clientes[0].idCliente).toBe(buscado.idCliente);
  });

  it('filtra por identificador de cliente', async () => {
    const respuesta = await request(app)
      .get(`/api/reports/expired-clients?${url({ buscar: String(buscado.idCliente) })}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.body.reporte.total).toBe(1);
    expect(respuesta.body.reporte.clientes[0].idCliente).toBe(buscado.idCliente);
  });

  it('devuelve una lista vacía cuando la búsqueda no tiene coincidencias', async () => {
    const respuesta = await request(app)
      .get(`/api/reports/expired-clients?${url({ buscar: 'NoExisteJamas' })}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.reporte.clientes).toEqual([]);
    expect(respuesta.body.reporte.total).toBe(0);
  });

  it('no calcula ni expone adeudos monetarios', async () => {
    const respuesta = await request(app)
      .get(`/api/reports/expired-clients?${url()}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    const cuerpo = JSON.stringify(respuesta.body);
    expect(cuerpo).not.toContain('adeudo');
    expect(cuerpo).not.toContain('saldoPendiente');
    expect(cuerpo).not.toContain('montoAdeudado');
  });

  it('registra la generación en auditoría', async () => {
    const filas = await consultar(
      `SELECT accion FROM auditoria
       WHERE id_usuario = ? AND accion = 'generar_reporte_vencidos'
       ORDER BY id_auditoria DESC LIMIT 1;`,
      [admin.usuario.id]
    );
    expect(filas).toHaveLength(1);
  });
});
