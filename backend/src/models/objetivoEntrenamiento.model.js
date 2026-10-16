// Modelo de objetivos de entrenamiento: acceso a datos de `objetivos_entrenamiento`
// (data-model.md §1, FR-013, FR-015).

import { consultar, ejecutar } from '../config/baseDatos.js';

export const COLUMNAS_OBJETIVO =
  'o.id_objetivo, o.id_cliente, o.id_entrenador, o.descripcion, o.valor_objetivo, o.unidad, ' +
  'o.fecha_objetivo, o.estado, o.fecha_creacion, ' +
  'c.nombre AS cliente_nombre, c.apellido AS cliente_apellido';

const BASE = `FROM objetivos_entrenamiento o JOIN clientes c ON c.id_cliente = o.id_cliente`;

/**
 * Inserta un objetivo.
 * @param {Object} datos - idCliente, idEntrenador, descripcion, valorObjetivo?, unidad?, fechaObjetivo?.
 * @returns {Promise<number>}
 */
export async function crear(datos) {
  const resultado = await ejecutar(
    `INSERT INTO objetivos_entrenamiento
     (id_cliente, id_entrenador, descripcion, valor_objetivo, unidad, fecha_objetivo, estado)
     VALUES (?, ?, ?, ?, ?, ?, ?);`,
    [
      datos.idCliente,
      datos.idEntrenador,
      datos.descripcion,
      datos.valorObjetivo ?? null,
      datos.unidad ?? null,
      datos.fechaObjetivo ?? null,
      datos.estado ?? 'en_progreso',
    ]
  );
  return resultado.insertId;
}

/**
 * Busca un objetivo por su identificador.
 * @returns {Promise<Object|null>}
 */
export async function buscarPorId(id) {
  const filas = await consultar(
    `SELECT ${COLUMNAS_OBJETIVO} FROM objetivos_entrenamiento o JOIN clientes c ON c.id_cliente = o.id_cliente WHERE o.id_objetivo = ? LIMIT 1;`,
    [id]
  );
  return filas.length > 0 ? filas[0] : null;
}

/**
 * Lista objetivos con filtros opcionales.
 * @param {Object} filtros - idCliente?, idEntrenador?, estado?.
 * @returns {Promise<Array>}
 */
export async function listar(filtros = {}) {
  const condiciones = [];
  const valores = [];
  if (filtros.idCliente) {
    condiciones.push('o.id_cliente = ?');
    valores.push(filtros.idCliente);
  }
  if (filtros.idEntrenador) {
    condiciones.push('o.id_entrenador = ?');
    valores.push(filtros.idEntrenador);
  }
  if (filtros.estado) {
    condiciones.push('o.estado = ?');
    valores.push(filtros.estado);
  }
  const where = condiciones.length > 0 ? ` WHERE ${condiciones.join(' AND ')}` : '';
  return consultar(
    `SELECT ${COLUMNAS_OBJETIVO} FROM objetivos_entrenamiento o JOIN clientes c ON c.id_cliente = o.id_cliente${where} ORDER BY o.fecha_creacion DESC, o.id_objetivo DESC;`,
    valores
  );
}

/**
 * Lista los objetivos de un cliente.
 * @returns {Promise<Array>}
 */
export async function listarPorCliente(idCliente) {
  return consultar(
    `SELECT ${COLUMNAS_OBJETIVO} FROM objetivos_entrenamiento o JOIN clientes c ON c.id_cliente = o.id_cliente WHERE o.id_cliente = ? ORDER BY o.fecha_creacion DESC, o.id_objetivo DESC;`,
    [idCliente]
  );
}

/**
 * Cambia el estado de un objetivo.
 * @returns {Promise<number>}
 */
export async function actualizarEstado(id, estado) {
  const resultado = await ejecutar(
    'UPDATE objetivos_entrenamiento SET estado = ? WHERE id_objetivo = ?;',
    [estado, id]
  );
  return resultado.affectedRows;
}
