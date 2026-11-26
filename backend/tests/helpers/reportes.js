// Utilidades compartidas para las pruebas de reportes del Sprint 4.
// Crea datos con identificadores únicos y elimina solo lo creado por este helper.

import { randomUUID } from 'node:crypto';
import { consultar, ejecutar } from '../../src/config/baseDatos.js';
import { hoyIso, sumarDias } from '../../src/utils/fechas.js';

const idsClientes = [];
const idsTipos = [];
const idsMembresias = [];
const idsPagos = [];
const idsAccesos = [];

/**
 * Crea un cliente de prueba.
 * @param {Object} [opciones] - `{ nombre, apellido, correo, telefono, estado }`.
 * @returns {Promise<Object>} Cliente creado.
 */
export async function crearClienteReporte({
  nombre = 'Cliente',
  apellido = 'Reporte',
  correo = `reporte.${randomUUID()}@pruebas.local`,
  telefono = '5555-0000',
  estado = 'activo',
} = {}) {
  const resultado = await ejecutar(
    'INSERT INTO clientes (nombre, apellido, correo, telefono, estado) VALUES (?, ?, ?, ?, ?);',
    [nombre, apellido, correo, telefono, estado]
  );
  const id = resultado.insertId;
  idsClientes.push(id);
  return { id, idCliente: id, nombre, apellido, correo, telefono, estado };
}

/**
 * Crea un tipo de membresía de prueba.
 * @param {Object} [opciones] - `{ nombre, duracion, precio, estado }`.
 * @returns {Promise<number>}
 */
export async function crearTipoMembresiaReporte({
  nombre = `Tipo reporte ${randomUUID()}`,
  duracion = 30,
  precio = 250,
  estado = 'activo',
} = {}) {
  const resultado = await ejecutar(
    'INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado) VALUES (?, ?, ?, ?, ?);',
    [nombre, 'Tipo para pruebas de reportes', duracion, precio, estado]
  );
  idsTipos.push(resultado.insertId);
  return resultado.insertId;
}

/**
 * Crea una membresía de prueba.
 * @param {Object} datos - `{ idCliente, idTipoMembresia, fechaInicio, fechaFin, estado }`.
 * @returns {Promise<number>}
 */
export async function crearMembresiaReporte({
  idCliente,
  idTipoMembresia,
  fechaInicio = hoyIso(),
  fechaFin = sumarDias(hoyIso(), 30),
  estado = 'activa',
} = {}) {
  const resultado = await ejecutar(
    'INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado) VALUES (?, ?, ?, ?, ?);',
    [idCliente, idTipoMembresia, fechaInicio, fechaFin, estado]
  );
  idsMembresias.push(resultado.insertId);
  return resultado.insertId;
}

/**
 * Crea un pago de prueba.
 * @param {Object} datos - `{ idCliente, idMembresia, monto, metodoPago, estado, fechaPago }`.
 * @returns {Promise<number>}
 */
function normalizarFechaHora(valor) {
  if (!valor) return null;
  const texto = String(valor);
  return texto.length <= 10 ? `${texto} 12:00:00` : texto;
}

export async function crearPagoReporte({
  idCliente,
  idMembresia = null,
  monto = 250,
  metodoPago = 'efectivo',
  estado = 'completado',
  fechaPago = null,
} = {}) {
  const fecha = normalizarFechaHora(fechaPago);
  const resultado = await ejecutar(
    `INSERT INTO pagos (id_cliente, id_membresia, monto, metodo_pago, estado${
      fecha ? ', fecha_pago' : ''
    }) VALUES (?, ?, ?, ?, ?${fecha ? ', ?' : ''});`,
    fecha
      ? [idCliente, idMembresia, monto, metodoPago, estado, fecha]
      : [idCliente, idMembresia, monto, metodoPago, estado]
  );
  idsPagos.push(resultado.insertId);
  return resultado.insertId;
}

/**
 * Crea un acceso de prueba.
 * @param {Object} datos - `{ idCliente, tipo, resultado, motivoRechazo, fechaHora }`.
 * @returns {Promise<number>}
 */
export async function crearAccesoReporte({
  idCliente = null,
  tipo = 'entrada',
  resultado = 'autorizado',
  motivoRechazo = null,
  fechaHora = null,
} = {}) {
  const fecha = normalizarFechaHora(fechaHora);
  const resultadoInsert = await ejecutar(
    `INSERT INTO accesos (id_cliente, tipo, resultado, motivo_rechazo${
      fecha ? ', fecha_hora' : ''
    }) VALUES (?, ?, ?, ?${fecha ? ', ?' : ''});`,
    fecha
      ? [idCliente, tipo, resultado, motivoRechazo, fecha]
      : [idCliente, tipo, resultado, motivoRechazo]
  );
  idsAccesos.push(resultadoInsert.insertId);
  return resultadoInsert.insertId;
}

/** Elimina todos los datos creados por este helper (en orden de llaves foráneas). */
export async function limpiarReportes() {
  if (idsAccesos.length > 0) {
    const marcadores = idsAccesos.map(() => '?').join(', ');
    await consultar(`DELETE FROM accesos WHERE id_acceso IN (${marcadores});`, idsAccesos);
    idsAccesos.length = 0;
  }
  if (idsPagos.length > 0) {
    const marcadores = idsPagos.map(() => '?').join(', ');
    await consultar(`DELETE FROM pagos WHERE id_pago IN (${marcadores});`, idsPagos);
    idsPagos.length = 0;
  }
  if (idsMembresias.length > 0) {
    const marcadores = idsMembresias.map(() => '?').join(', ');
    await consultar(`DELETE FROM membresias WHERE id_membresia IN (${marcadores});`, idsMembresias);
    idsMembresias.length = 0;
  }
  if (idsClientes.length > 0) {
    const marcadores = idsClientes.map(() => '?').join(', ');
    await consultar(`DELETE FROM rostros WHERE id_cliente IN (${marcadores});`, idsClientes);
    await consultar(`DELETE FROM clientes WHERE id_cliente IN (${marcadores});`, idsClientes);
    idsClientes.length = 0;
  }
  if (idsTipos.length > 0) {
    const marcadores = idsTipos.map(() => '?').join(', ');
    await consultar(
      `DELETE FROM tipos_membresia WHERE id_tipo_membresia IN (${marcadores});`,
      idsTipos
    );
    idsTipos.length = 0;
  }
}
