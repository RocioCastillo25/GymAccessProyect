// Pruebas de integración de las alertas de membresías por vencer (US-S4-03).

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import { cerrarPool } from '../../src/config/baseDatos.js';
import { usuarioYToken, limpiarUsuariosPrueba } from '../helpers/usuarios.js';
import {
  crearClienteReporte,
  crearMembresiaReporte,
  crearTipoMembresiaReporte,
  limpiarReportes,
} from '../helpers/reportes.js';
import { hoyIso, sumarDias } from '../../src/utils/fechas.js';

let tokenAdmin = '';
let tokenRecepcionista = '';
let tokenEntrenador = '';
let tokenCliente = '';
let idTipo;
let alertaHoy;
let alertaDia5;
let alertaDia6;
let alertaVencida;
let alertaSuspensa;

async function crearMembresiaConCliente(fechaFin, estado, apellido) {
  const cliente = await crearClienteReporte({ nombre: 'Alerta', apellido });
  const idMembresia = await crearMembresiaReporte({
    idCliente: cliente.id,
    idTipoMembresia: idTipo,
    fechaInicio: hoyIso(),
    fechaFin,
    estado,
  });
  return { idCliente: cliente.id, idMembresia };
}

beforeAll(async () => {
  tokenAdmin = (await usuarioYToken('administrador')).token;
  tokenRecepcionista = (await usuarioYToken('recepcionista')).token;
  tokenEntrenador = (await usuarioYToken('entrenador')).token;
  tokenCliente = (await usuarioYToken('cliente')).token;

  idTipo = await crearTipoMembresiaReporte({ nombre: `Tipo alertas ${Date.now()}` });
  alertaHoy = await crearMembresiaConCliente(hoyIso(), 'activa', 'Hoy');
  alertaDia5 = await crearMembresiaConCliente(sumarDias(hoyIso(), 5), 'activa', 'Dia5');
  alertaDia6 = await crearMembresiaConCliente(sumarDias(hoyIso(), 6), 'activa', 'Dia6');
  alertaVencida = await crearMembresiaConCliente(sumarDias(hoyIso(), -1), 'vencida', 'Vencida');
  alertaSuspensa = await crearMembresiaConCliente(sumarDias(hoyIso(), 3), 'suspendida', 'Suspendida');
});

afterAll(async () => {
  await limpiarReportes();
  await limpiarUsuariosPrueba();
  await cerrarPool();
});

describe('Alertas de vencimiento', () => {
  it('permite consultar al administrador y al recepcionista', async () => {
    for (const token of [tokenAdmin, tokenRecepcionista]) {
      const respuesta = await request(app)
        .get('/api/reports/expiring-memberships')
        .set('Authorization', `Bearer ${token}`);
      expect(respuesta.status).toBe(200);
      expect(Array.isArray(respuesta.body.alertas)).toBe(true);
    }
  });

  it.each([
    ['entrenador', () => tokenEntrenador],
    ['cliente', () => tokenCliente],
  ])('rechaza al rol %s con 403', async (_rol, obtenerToken) => {
    const respuesta = await request(app)
      .get('/api/reports/expiring-memberships')
      .set('Authorization', `Bearer ${obtenerToken()}`);
    expect(respuesta.status).toBe(403);
  });

  it('incluye hoy y el día 5, y excluye día 6, vencidas y suspendidas', async () => {
    const respuesta = await request(app)
      .get('/api/reports/expiring-memberships')
      .set('Authorization', `Bearer ${tokenRecepcionista}`);

    const ids = respuesta.body.alertas.map((alerta) => alerta.idMembresia);
    expect(ids).toContain(alertaHoy.idMembresia);
    expect(ids).toContain(alertaDia5.idMembresia);
    expect(ids).not.toContain(alertaDia6.idMembresia);
    expect(ids).not.toContain(alertaVencida.idMembresia);
    expect(ids).not.toContain(alertaSuspensa.idMembresia);

    const hoy = respuesta.body.alertas.find((alerta) => alerta.idMembresia === alertaHoy.idMembresia);
    const dia5 = respuesta.body.alertas.find(
      (alerta) => alerta.idMembresia === alertaDia5.idMembresia
    );
    expect(hoy.diasRestantes).toBe(0);
    expect(dia5.diasRestantes).toBe(5);
  });

  it('no expone descriptores faciales', async () => {
    const respuesta = await request(app)
      .get('/api/reports/expiring-memberships')
      .set('Authorization', `Bearer ${tokenAdmin}`);

    expect(JSON.stringify(respuesta.body)).not.toContain('descriptorFacial');
  });
});
