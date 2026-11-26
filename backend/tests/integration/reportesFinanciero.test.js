// Pruebas de integración del reporte financiero (US-S4-01).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { consultar, cerrarPool } from '../../src/config/baseDatos.js';
import { usuarioYToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';
import {
  crearClienteReporte,
  crearMembresiaReporte,
  crearPagoReporte,
  crearTipoMembresiaReporte,
  limpiarReportes,
} from '../helpers/reportes.js';
import { hoyIso, sumarDias } from '../../src/utils/fechas.js';

const FECHA = '2040-02-10';
const FECHA_FIN = '2040-02-11';

let admin;
let tokenAdmin = '';
let tokenRecepcionista = '';
let tokenEntrenador = '';
let tokenCliente = '';
let idCliente;
let idMembresia;
let nombreTipo;

beforeAll(async () => {
  admin = await usuarioYToken('administrador');
  tokenAdmin = admin.token;
  tokenRecepcionista = (await usuarioYToken('recepcionista')).token;
  tokenEntrenador = (await usuarioYToken('entrenador')).token;
  tokenCliente = (await usuarioYToken('cliente')).token;

  idCliente = (await crearClienteReporte({ nombre: 'Ana', apellido: 'Financiero' })).id;
  const idTipo = await crearTipoMembresiaReporte({ nombre: `Tipo financiero ${Date.now()}` });
  nombreTipo = (
    await consultar('SELECT nombre FROM tipos_membresia WHERE id_tipo_membresia = ?;', [idTipo])
  )[0].nombre;
  idMembresia = await crearMembresiaReporte({
    idCliente,
    idTipoMembresia: idTipo,
    fechaInicio: hoyIso(),
    fechaFin: sumarDias(hoyIso(), 30),
  });

  await crearPagoReporte({
    idCliente,
    idMembresia,
    monto: 100,
    metodoPago: 'efectivo',
    estado: 'completado',
    fechaPago: FECHA,
  });
  await crearPagoReporte({
    idCliente,
    idMembresia,
    monto: 50,
    metodoPago: 'tarjeta',
    estado: 'completado',
    fechaPago: FECHA,
  });
  await crearPagoReporte({
    idCliente,
    idMembresia,
    monto: 999,
    metodoPago: 'efectivo',
    estado: 'pendiente',
    fechaPago: FECHA,
  });
  await crearPagoReporte({
    idCliente,
    idMembresia,
    monto: 999,
    metodoPago: 'efectivo',
    estado: 'cancelado',
    fechaPago: FECHA,
  });
});

afterAll(async () => {
  await limpiarReportes();
  await limpiarUsuariosPrueba();
  await cerrarPool();
});

function url(extra = {}) {
  return new URLSearchParams({
    fechaInicio: FECHA,
    fechaFin: FECHA_FIN,
    ...extra,
  }).toString();
}

describe('Reporte financiero', () => {
  it('exige autenticación', async () => {
    const respuesta = await request(app).get(`/api/reports/financial?${url()}`);
    expect(respuesta.status).toBe(401);
  });

  it.each([
    ['recepcionista', () => tokenRecepcionista],
    ['entrenador', () => tokenEntrenador],
    ['cliente', () => tokenCliente],
  ])('rechaza al rol %s con 403', async (_rol, obtenerToken) => {
    const respuesta = await request(app)
      .get(`/api/reports/financial?${url()}`)
      .set('Authorization', `Bearer ${obtenerToken()}`);
    expect(respuesta.status).toBe(403);
    expect(respuesta.body.codigo).toBe('AUTORIZACION');
  });

  it('excluye pagos pendientes y cancelados', async () => {
    const respuesta = await request(app)
      .get(`/api/reports/financial?${url()}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.reporte.resumen.totalRecaudado).toBe(150);
    expect(respuesta.body.reporte.resumen.totalTransacciones).toBe(2);
  });

  it('aplica el filtro por método de pago y devuelve los filtros activos', async () => {
    const respuesta = await request(app)
      .get(`/api/reports/financial?${url({ metodoPago: 'efectivo' })}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.reporte.resumen.totalRecaudado).toBe(100);
    expect(respuesta.body.reporte.filtros.metodoPago).toBe('efectivo');
    expect(respuesta.body.reporte.porMetodoPago).toHaveLength(1);
    expect(respuesta.body.reporte.porMetodoPago[0].metodoPago).toBe('efectivo');
  });

  it('desglosa por tipo de membresía', async () => {
    const respuesta = await request(app)
      .get(`/api/reports/financial?${url()}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    const fila = respuesta.body.reporte.porTipoMembresia.find(
      (item) => item.tipoMembresia === nombreTipo
    );
    expect(fila).toBeDefined();
    expect(fila.ingresos).toBe(150);
  });

  it('devuelve totales en cero para un periodo vacío', async () => {
    const respuesta = await request(app)
      .get(
        `/api/reports/financial?fechaInicio=2040-03-01&fechaFin=2040-03-02&metodoPago=tarjeta`
      )
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.reporte.resumen.totalRecaudado).toBe(0);
    expect(respuesta.body.reporte.resumen.totalTransacciones).toBe(0);
    expect(respuesta.body.reporte.porMetodoPago).toEqual([]);
  });

  it('valida el rango de fechas y el método vacío', async () => {
    const rangoInvertido = await request(app)
      .get('/api/reports/financial?fechaInicio=2040-03-02&fechaFin=2040-03-01')
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(rangoInvertido.status).toBe(400);
    expect(rangoInvertido.body.codigo).toBe('VALIDACION');

    const metodoVacio = await request(app)
      .get(`/api/reports/financial?${url({ metodoPago: '' })}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);
    expect(metodoVacio.status).toBe(400);
    expect(metodoVacio.body.errores[0].campo).toBe('metodoPago');
  });

  it('registra la generación en auditoría', async () => {
    const filas = await consultar(
      `SELECT accion, resultado FROM auditoria
       WHERE id_usuario = ? AND accion = 'generar_reporte_financiero'
       ORDER BY id_auditoria DESC LIMIT 1;`,
      [admin.usuario.id]
    );
    expect(filas).toHaveLength(1);
    expect(filas[0].resultado).toBe('exito');
  });
});
