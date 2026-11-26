// Pruebas de integración del registro de exportaciones (US-S4-04).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { consultar, cerrarPool } from '../../src/config/baseDatos.js';
import { usuarioYToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';

let admin;
let tokenAdmin = '';
let tokenRecepcionista = '';
let tokenEntrenador = '';

const filtros = { fechaInicio: '2042-01-01', fechaFin: '2042-01-31' };

beforeAll(async () => {
  admin = await usuarioYToken('administrador');
  tokenAdmin = admin.token;
  tokenRecepcionista = (await usuarioYToken('recepcionista')).token;
  tokenEntrenador = (await usuarioYToken('entrenador')).token;
});

afterAll(async () => {
  await limpiarUsuariosPrueba();
  await cerrarPool();
});

describe('Exportaciones de reportes', () => {
  it('exige autenticación', async () => {
    const respuesta = await request(app)
      .post('/api/reports/exports')
      .send({ reporte: 'financiero', formato: 'csv', filtros });
    expect(respuesta.status).toBe(401);
  });

  it('rechaza a un entrenador con 403', async () => {
    const respuesta = await request(app)
      .post('/api/reports/exports')
      .set('Authorization', `Bearer ${tokenEntrenador}`)
      .send({ reporte: 'vencidos', formato: 'csv', filtros });
    expect(respuesta.status).toBe(403);
  });

  it('impide al recepcionista exportar reportes financieros o de accesos', async () => {
    for (const reporte of ['financiero', 'accesos']) {
      const respuesta = await request(app)
        .post('/api/reports/exports')
        .set('Authorization', `Bearer ${tokenRecepcionista}`)
        .send({ reporte, formato: 'csv', filtros });
      expect(respuesta.status).toBe(403);
    }
  });

  it('registra la exportación del administrador en auditoría', async () => {
    const respuesta = await request(app)
      .post('/api/reports/exports')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ reporte: 'financiero', formato: 'csv', filtros });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.mensaje).toBe('Exportación registrada.');
    expect(respuesta.body.reporte).toBe('financiero');
    expect(respuesta.body.formato).toBe('csv');
    expect(respuesta.body.auditoria).toBeGreaterThan(0);

    const filas = await consultar(
      `SELECT accion, descripcion FROM auditoria
       WHERE id_usuario = ? AND accion = 'exportar_reporte'
       ORDER BY id_auditoria DESC LIMIT 1;`,
      [admin.usuario.id]
    );
    expect(filas).toHaveLength(1);
    expect(filas[0].descripcion).toContain('financiero');
    expect(filas[0].descripcion).not.toContain('token');
  });

  it('permite al recepcionista exportar el reporte de vencidos', async () => {
    const respuesta = await request(app)
      .post('/api/reports/exports')
      .set('Authorization', `Bearer ${tokenRecepcionista}`)
      .send({ reporte: 'vencidos', formato: 'pdf', filtros });

    expect(respuesta.status).toBe(200);
    expect(respuesta.body.formato).toBe('pdf');
  });

  it('valida el reporte y el formato', async () => {
    const reporteInvalido = await request(app)
      .post('/api/reports/exports')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ reporte: 'otro', formato: 'csv' });
    expect(reporteInvalido.status).toBe(400);
    expect(reporteInvalido.body.errores[0].campo).toBe('reporte');

    const formatoInvalido = await request(app)
      .post('/api/reports/exports')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .send({ reporte: 'vencidos', formato: 'xls' });
    expect(formatoInvalido.status).toBe(400);
    expect(formatoInvalido.body.errores[0].campo).toBe('formato');
  });
});
