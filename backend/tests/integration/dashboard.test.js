// T051 - Pruebas de integración del dashboard (HU6, FR-019 a FR-021).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { cerrarPool } from '../../src/config/baseDatos.js';
import { usuarioYToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';

let tokenAdmin = '';
let tokenRecepcionista = '';

beforeAll(async () => {
  tokenAdmin = (await usuarioYToken('administrador')).token;
  tokenRecepcionista = (await usuarioYToken('recepcionista')).token;
});

afterAll(async () => {
  await limpiarUsuariosPrueba();
  await cerrarPool();
});

describe('HU6 - Dashboard', () => {
  it('el administrador obtiene el resumen general', async () => {
    const respuesta = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(respuesta.status).toBe(200);
    const claves = [
      'clientesActivos',
      'clientesInactivos',
      'entrenadoresActivos',
      'clientesConEntrenador',
      'clientesSinEntrenador',
      'rutinasActivas',
      'objetivosEnProgreso',
      'membresiasActivas',
      'membresiasVencidas',
      'accesosRecientes',
      'accesosRechazados',
    ];
    for (const clave of claves) {
      expect(respuesta.body.resumen).toHaveProperty(clave);
      expect(Number.isInteger(respuesta.body.resumen[clave])).toBe(true);
      expect(respuesta.body.resumen[clave]).toBeGreaterThanOrEqual(0);
    }
  });

  it('deniega el dashboard general al recepcionista', async () => {
    const respuesta = await request(app)
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${tokenRecepcionista}`);

    expect(respuesta.status).toBe(403);
  });

  it('el recepcionista obtiene el resumen operativo del personal', async () => {
    const respuesta = await request(app)
      .get('/api/dashboard/personal')
      .set('Authorization', `Bearer ${tokenRecepcionista}`);

    expect(respuesta.status).toBe(200);
    for (const clave of ['entrenadoresActivos', 'asignacionesActivas', 'clientesSinEntrenador']) {
      expect(respuesta.body.resumen).toHaveProperty(clave);
      expect(Number.isInteger(respuesta.body.resumen[clave])).toBe(true);
    }
  });

  it('exige autenticación', async () => {
    const respuesta = await request(app).get('/api/dashboard');
    expect(respuesta.status).toBe(401);
  });
});
