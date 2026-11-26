// Pruebas de integración del reporte de accesos (US-S4-02).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { cerrarPool } from '../../src/config/baseDatos.js';
import { usuarioYToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';
import {
  crearAccesoReporte,
  crearClienteReporte,
  limpiarReportes,
} from '../helpers/reportes.js';

const FECHA = '2041-04-10';

let tokenAdmin = '';
let tokenRecepcionista = '';
let tokenEntrenador = '';
let tokenCliente = '';
let idCliente;

beforeAll(async () => {
  tokenAdmin = (await usuarioYToken('administrador')).token;
  tokenRecepcionista = (await usuarioYToken('recepcionista')).token;
  tokenEntrenador = (await usuarioYToken('entrenador')).token;
  tokenCliente = (await usuarioYToken('cliente')).token;

  idCliente = (await crearClienteReporte({ nombre: 'Luis', apellido: 'Accesos' })).id;
  await crearAccesoReporte({
    idCliente,
    tipo: 'entrada',
    resultado: 'autorizado',
    fechaHora: `${FECHA} 09:15:00`,
  });
  await crearAccesoReporte({
    idCliente,
    tipo: 'salida',
    resultado: 'rechazado',
    motivoRechazo: 'La membresía está vencida.',
    fechaHora: `${FECHA} 09:45:00`,
  });
  await crearAccesoReporte({
    idCliente,
    tipo: 'entrada',
    resultado: 'rechazado',
    motivoRechazo: 'La membresía está vencida.',
    fechaHora: `${FECHA} 10:05:00`,
  });
  await crearAccesoReporte({
    idCliente,
    tipo: 'salida',
    resultado: 'rechazado',
    motivoRechazo: 'Rostro no reconocido.',
    fechaHora: `${FECHA} 10:30:00`,
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
    fechaFin: FECHA,
    idCliente,
    ...extra,
  }).toString();
}

describe('Reporte de accesos', () => {
  it.each([
    ['recepcionista', () => tokenRecepcionista],
    ['entrenador', () => tokenEntrenador],
    ['cliente', () => tokenCliente],
  ])('rechaza al rol %s con 403', async (_rol, obtenerToken) => {
    const respuesta = await request(app)
      .get(`/api/reports/access?${url()}`)
      .set('Authorization', `Bearer ${obtenerToken()}`);
    expect(respuesta.status).toBe(403);
  });

  it('calcula totales y franjas horarias consistentes', async () => {
    const respuesta = await request(app)
      .get(`/api/reports/access?${url()}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.reporte.resumen.totalAccesos).toBe(4);
    expect(respuesta.body.reporte.resumen.autorizados).toBe(1);
    expect(respuesta.body.reporte.resumen.rechazados).toBe(3);

    const sumaHoras = respuesta.body.reporte.porHora.reduce(
      (suma, fila) => suma + fila.total,
      0
    );
    expect(sumaHoras).toBe(respuesta.body.reporte.resumen.totalAccesos);
    expect(respuesta.body.reporte.porHora.map((fila) => fila.hora)).toEqual([9, 10]);
  });

  it('filtra por resultado y conserva los motivos de rechazo', async () => {
    const respuesta = await request(app)
      .get(`/api/reports/access?${url({ resultado: 'rechazado' })}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.reporte.filtros.resultado).toBe('rechazado');
    expect(respuesta.body.reporte.resumen.totalAccesos).toBe(3);
    expect(respuesta.body.reporte.resumen.autorizados).toBe(0);

    const motivos = Object.fromEntries(
      respuesta.body.reporte.porMotivoRechazo.map((fila) => [fila.motivo, fila.total])
    );
    expect(motivos['La membresía está vencida.']).toBe(2);
    expect(motivos['Rostro no reconocido.']).toBe(1);
  });

  it('filtra por cliente sin mezclar otros accesos', async () => {
    const otroCliente = await crearClienteReporte({ nombre: 'Otro', apellido: 'Cliente' });
    await crearAccesoReporte({
      idCliente: otroCliente.id,
      resultado: 'autorizado',
      fechaHora: `${FECHA} 11:00:00`,
    });

    const respuesta = await request(app)
      .get(`/api/reports/access?${url()}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.reporte.resumen.totalAccesos).toBe(4);
  });

  it('devuelve un periodo vacío sin errores', async () => {
    const respuesta = await request(app)
      .get(
        `/api/reports/access?fechaInicio=2041-05-01&fechaFin=2041-05-02&idCliente=${idCliente}`
      )
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.reporte.resumen.totalAccesos).toBe(0);
    expect(respuesta.body.reporte.porHora).toEqual([]);
    expect(respuesta.body.reporte.porMotivoRechazo).toEqual([]);
  });

  it('no expone datos biométricos ni descriptores faciales', async () => {
    const respuesta = await request(app)
      .get(`/api/reports/access?${url()}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    const cuerpo = JSON.stringify(respuesta.body);
    expect(cuerpo).not.toContain('descriptorFacial');
    expect(cuerpo).not.toContain('descriptor_facial');
  });

  it('rechaza un resultado fuera del enum', async () => {
    const respuesta = await request(app)
      .get(`/api/reports/access?${url({ resultado: 'otro' })}`)
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(400);
    expect(respuesta.body.errores[0].campo).toBe('resultado');
  });
});
