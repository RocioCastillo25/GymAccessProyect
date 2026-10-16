// Modelo de progresos: acceso a datos de `progresos_clientes`
// (data-model.md §1, FR-014, FR-015). El historial se conserva y se lee en orden cronológico.

import { consultar, ejecutar } from '../config/baseDatos.js';

export const COLUMNAS_PROGRESO =
  'p.id_progreso, p.id_cliente, p.id_entrenador, p.id_objetivo, p.valor, p.unidad, ' +
  'p.observaciones, p.fecha_registro, ' +
  'c.nombre AS cliente_nombre, c.apellido AS cliente_apellido';

const BASE = `FROM progresos_clientes p JOIN clientes c ON c.id_cliente = p.id_cliente`;

/**
 * Inserta un progreso.
 * @param {Object} datos - idCliente, idEntrenador, idObjetivo?, valor, unidad?, observaciones?.
 * @returns {Promise<number>}
 */
export async function crear(datos) {
  const resultado = await ejecutar(
    'INSERT INTO progresos_clientes (id_cliente, id_entrenador, id_objetivo, valor, unidad, observaciones) VALUES (?, ?, ?, ?, ?, ?);',
    [
      datos.idCliente,
      datos.idEntrenador,
      datos.idObjetivo ?? null,
      datos.valor,
      datos.unidad ?? null,
      datos.observaciones ?? null,
    ]
  );
  return resultado.insertId;
}

/**
 * Busca un progreso por su identificador.
 * @returns {Promise<Object|null>}
 */
export async function buscarPorId(id) {
  const filas = await consultar(
    `SELECT ${COLUMNAS_PROGRESO} ${BASE} WHERE p.id_progreso = ? LIMIT 1;`,
    [id]
  );
  return filas.length > 0 ? filas[0] : null;
}

/**
 * Lista progresos con filtros opcionales.
 * @param {Object} filtros - idCliente?, idObjetivo?.
 * @returns {Promise<Array>}
 */
export async function listar(filtros = {}) {
  const condiciones = [];
  const valores = [];
  if (filtros.idCliente) {
    condiciones.push('p.id_cliente = ?');
    valores.push(filtros.idCliente);
  }
  if (filtros.idObjetivo) {
    condiciones.push('p.id_objetivo = ?');
    valores.push(filtros.idObjetivo);
  }
  const where = condiciones.length > 0 ? ` WHERE ${condiciones.join(' AND ')}` : '';
  return consultar(
    `SELECT ${COLUMNAS_PROGRESO} ${BASE}${where} ORDER BY p.fecha_registro ASC, p.id_progreso ASC;`,
    valores
  );
}

/**
 * Lista los progresos de un cliente en orden cronológico (FR-015).
 * @returns {Promise<Array>}
 */
export async function listarPorCliente(idCliente) {
  return consultar(
    `SELECT ${COLUMNAS_PROGRESO} ${BASE} WHERE p.id_cliente = ? ORDER BY p.fecha_registro ASC, p.id_progreso ASC;`,
    [idCliente]
  );
}

/**
 * Lista los progresos asociados a un objetivo.
 * @returns {Promise<Array>}
 */
export async function listarPorObjetivo(idObjetivo) {
  return consultar(
    `SELECT ${COLUMNAS_PROGRESO} ${BASE} WHERE p.id_objetivo = ? ORDER BY p.fecha_registro ASC, p.id_progreso ASC;`,
    [idObjetivo]
  );
}
