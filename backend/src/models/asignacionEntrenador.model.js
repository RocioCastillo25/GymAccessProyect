// Modelo de asignaciones de entrenador: acceso a datos de `asignaciones_entrenador`
// (data-model.md §1, FR-005 a FR-008). La columna generada `cliente_principal_activo`
// garantiza un único entrenador principal activo por cliente (R15).

import { consultar, ejecutar } from '../config/baseDatos.js';

export const COLUMNAS_ASIGNACION =
  'a.id_asignacion, a.id_cliente, a.id_entrenador, a.fecha_asignacion, a.es_principal, a.estado, ' +
  'c.nombre AS cliente_nombre, c.apellido AS cliente_apellido, u.nombre AS entrenador_nombre';

const BASE = `FROM asignaciones_entrenador a
  JOIN clientes c ON c.id_cliente = a.id_cliente
  JOIN entrenadores e ON e.id_entrenador = a.id_entrenador
  JOIN usuarios u ON u.id_usuario = e.id_usuario`;

async function consulta(sql, parametros, conexion) {
  if (conexion) {
    const [filas] = await conexion.query(sql, parametros);
    return filas;
  }
  return consultar(sql, parametros);
}

async function escritura(sql, parametros, conexion) {
  if (conexion) {
    const [resultado] = await conexion.query(sql, parametros);
    return resultado;
  }
  return ejecutar(sql, parametros);
}

/**
 * Inserta una asignación.
 * @param {Object} datos - idCliente, idEntrenador, esPrincipal?, estado?.
 * @param {Object} [conexion] - Conexión de transacción opcional.
 * @returns {Promise<number>} Identificador creado.
 */
export async function crear(datos, conexion = null) {
  const resultado = await escritura(
    'INSERT INTO asignaciones_entrenador (id_cliente, id_entrenador, es_principal, estado) VALUES (?, ?, ?, ?);',
    [datos.idCliente, datos.idEntrenador, datos.esPrincipal ? 1 : 0, datos.estado ?? 'activa'],
    conexion
  );
  return resultado.insertId;
}

/**
 * Finaliza las asignaciones principales activas de un cliente (FR-006, R15).
 * @param {number} idCliente
 * @param {Object} [conexion] - Conexión de transacción opcional.
 * @returns {Promise<number>} Filas afectadas.
 */
export async function finalizarPrincipalesActivas(idCliente, conexion = null) {
  const resultado = await escritura(
    `UPDATE asignaciones_entrenador SET estado = 'finalizada'
     WHERE id_cliente = ? AND es_principal = 1 AND estado = 'activa';`,
    [idCliente],
    conexion
  );
  return resultado.affectedRows;
}

/**
 * Busca una asignación por su identificador.
 * @returns {Promise<Object|null>}
 */
export async function buscarPorId(id) {
  const filas = await consulta(
    `SELECT ${COLUMNAS_ASIGNACION} ${BASE} WHERE a.id_asignacion = ? LIMIT 1;`,
    [id]
  );
  return filas.length > 0 ? filas[0] : null;
}

/**
 * Lista asignaciones con filtros opcionales.
 * @param {Object} filtros - idEntrenador?, idCliente?, estado?.
 * @returns {Promise<Array>}
 */
export async function listar(filtros = {}) {
  const condiciones = [];
  const valores = [];
  if (filtros.idEntrenador) {
    condiciones.push('a.id_entrenador = ?');
    valores.push(filtros.idEntrenador);
  }
  if (filtros.idCliente) {
    condiciones.push('a.id_cliente = ?');
    valores.push(filtros.idCliente);
  }
  if (filtros.estado) {
    condiciones.push('a.estado = ?');
    valores.push(filtros.estado);
  }
  const where = condiciones.length > 0 ? ` WHERE ${condiciones.join(' AND ')}` : '';
  return consulta(
    `SELECT ${COLUMNAS_ASIGNACION} ${BASE}${where} ORDER BY a.fecha_asignacion DESC, a.id_asignacion DESC;`,
    valores
  );
}

/**
 * Lista las asignaciones de un entrenador (FR-008).
 * @param {number} idEntrenador
 * @param {Object} [opciones] - soloActivas para limitar a asignaciones vigentes.
 * @returns {Promise<Array>}
 */
export async function listarPorEntrenador(idEntrenador, { soloActivas = false } = {}) {
  const filtroEstado = soloActivas ? ` AND a.estado = 'activa'` : '';
  return consulta(
    `SELECT ${COLUMNAS_ASIGNACION} ${BASE}
     WHERE a.id_entrenador = ?${filtroEstado}
     ORDER BY a.fecha_asignacion DESC, a.id_asignacion DESC;`,
    [idEntrenador]
  );
}

/**
 * Comprueba si un cliente tiene una asignación activa con un entrenador (FR-012).
 * @returns {Promise<Object|null>}
 */
export async function buscarActiva(idCliente, idEntrenador) {
  const filas = await consulta(
    `SELECT ${COLUMNAS_ASIGNACION} ${BASE}
     WHERE a.id_cliente = ? AND a.id_entrenador = ? AND a.estado = 'activa' LIMIT 1;`,
    [idCliente, idEntrenador]
  );
  return filas.length > 0 ? filas[0] : null;
}

/**
 * Finaliza una asignación (FR-008).
 * @returns {Promise<number>} Filas afectadas.
 */
export async function actualizarEstado(id, estado) {
  const resultado = await escritura(
    'UPDATE asignaciones_entrenador SET estado = ? WHERE id_asignacion = ?;',
    [estado, id]
  );
  return resultado.affectedRows;
}
