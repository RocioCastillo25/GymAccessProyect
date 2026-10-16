// Modelo de membresías: acceso a datos de `membresias` (data-model.md §1.1, FR-005 a FR-010).
// El estado `vencida` se calcula en lectura (R5): no se persiste.

import { consultar, ejecutar } from '../config/baseDatos.js';
import { hoyIso, aFechaIso, esPosterior } from '../utils/fechas.js';

export const COLUMNAS_MEMBRESIA =
  'id_membresia, id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado';

/**
 * Aplica el cálculo de vigencia en lectura: una membresía `activa` cuya
 * `fecha_fin` ya pasó se reporta como `vencida` (R5, FR-006).
 * @param {Object|null} fila
 * @returns {Object|null}
 */
export function conVigencia(fila) {
  if (!fila) return null;
  const vencida = fila.estado === 'activa' && esPosterior(hoyIso(), aFechaIso(fila.fecha_fin));
  return { ...fila, estado: vencida ? 'vencida' : fila.estado };
}

/**
 * Inserta una membresía nueva.
 * @param {Object} datos - idCliente, idTipoMembresia, fechaInicio, fechaFin, estado?.
 * @returns {Promise<number>} Identificador creado.
 */
export async function crear(datos) {
  const resultado = await ejecutar(
    'INSERT INTO membresias (id_cliente, id_tipo_membresia, fecha_inicio, fecha_fin, estado) VALUES (?, ?, ?, ?, ?);',
    [
      datos.idCliente,
      datos.idTipoMembresia,
      datos.fechaInicio,
      datos.fechaFin,
      datos.estado ?? 'activa',
    ]
  );
  return resultado.insertId;
}

/**
 * Busca una membresía por su identificador.
 * @returns {Promise<Object|null>}
 */
export async function buscarPorId(id) {
  const filas = await consultar(
    `SELECT ${COLUMNAS_MEMBRESIA} FROM membresias WHERE id_membresia = ? LIMIT 1;`,
    [id]
  );
  return filas.length > 0 ? conVigencia(filas[0]) : null;
}

/**
 * Lista todas las membresías (más recientes primero).
 * @returns {Promise<Array>}
 */
export async function listar() {
  const filas = await consultar(
    `SELECT ${COLUMNAS_MEMBRESIA} FROM membresias ORDER BY id_membresia DESC;`
  );
  return filas.map(conVigencia);
}

/**
 * Lista las membresías de un cliente (historial, más recientes primero).
 * @returns {Promise<Array>}
 */
export async function listarPorCliente(idCliente) {
  const filas = await consultar(
    `SELECT ${COLUMNAS_MEMBRESIA} FROM membresias WHERE id_cliente = ? ORDER BY fecha_inicio DESC, id_membresia DESC;`,
    [idCliente]
  );
  return filas.map(conVigencia);
}

/**
 * Devuelve la membresía vigente de un cliente (`activa` y no vencida), si existe.
 * @returns {Promise<Object|null>}
 */
export async function buscarVigentePorCliente(idCliente) {
  const filas = await consultar(
    `SELECT ${COLUMNAS_MEMBRESIA} FROM membresias
     WHERE id_cliente = ? AND estado = 'activa' AND fecha_fin >= ?
     ORDER BY fecha_fin DESC, id_membresia DESC LIMIT 1;`,
    [idCliente, hoyIso()]
  );
  return filas.length > 0 ? filas[0] : null;
}

/**
 * Devuelve la última membresía registrada de un cliente (la de `fecha_fin` mayor).
 * @returns {Promise<Object|null>}
 */
export async function buscarUltimaPorCliente(idCliente) {
  const filas = await consultar(
    `SELECT ${COLUMNAS_MEMBRESIA} FROM membresias
     WHERE id_cliente = ? ORDER BY fecha_fin DESC, id_membresia DESC LIMIT 1;`,
    [idCliente]
  );
  return filas.length > 0 ? filas[0] : null;
}

/**
 * Actualiza el estado de una membresía (FR-007).
 * @returns {Promise<number>} Filas afectadas.
 */
export async function actualizarEstado(id, estado) {
  const resultado = await ejecutar(
    'UPDATE membresias SET estado = ? WHERE id_membresia = ?;',
    [estado, id]
  );
  return resultado.affectedRows;
}
