// Modelo de rutinas y ejercicios: acceso a datos de `rutinas` y `ejercicios_rutina`
// (data-model.md §1, FR-009 a FR-012, FR-031).

import { consultar, ejecutar } from '../config/baseDatos.js';

export const COLUMNAS_RUTINA =
  'r.id_rutina, r.id_cliente, r.id_entrenador, r.nombre, r.descripcion, r.fecha_creacion, r.estado, ' +
  'c.nombre AS cliente_nombre, c.apellido AS cliente_apellido';

export const COLUMNAS_EJERCICIO =
  'id_ejercicio, id_rutina, nombre, series, repeticiones, peso, descanso, instrucciones, orden';

const BASE = `FROM rutinas r JOIN clientes c ON c.id_cliente = r.id_cliente`;

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
 * Inserta una rutina.
 * @param {Object} datos - idCliente, idEntrenador, nombre, descripcion?, estado?.
 * @param {Object} [conexion]
 * @returns {Promise<number>}
 */
export async function crear(datos, conexion = null) {
  const resultado = await escritura(
    'INSERT INTO rutinas (id_cliente, id_entrenador, nombre, descripcion, estado) VALUES (?, ?, ?, ?, ?);',
    [
      datos.idCliente,
      datos.idEntrenador,
      datos.nombre,
      datos.descripcion ?? null,
      datos.estado ?? 'activa',
    ],
    conexion
  );
  return resultado.insertId;
}

/**
 * Archiva las rutinas activas de un cliente (FR-031, R16).
 * @param {number} idCliente
 * @param {Object} [conexion]
 * @returns {Promise<number>}
 */
export async function archivarActivasPorCliente(idCliente, conexion = null) {
  const resultado = await escritura(
    `UPDATE rutinas SET estado = 'archivada' WHERE id_cliente = ? AND estado = 'activa';`,
    [idCliente],
    conexion
  );
  return resultado.affectedRows;
}

/**
 * Busca una rutina por su identificador.
 * @returns {Promise<Object|null>}
 */
export async function buscarPorId(id) {
  const filas = await consulta(
    `SELECT ${COLUMNAS_RUTINA} ${BASE} WHERE r.id_rutina = ? LIMIT 1;`,
    [id]
  );
  return filas.length > 0 ? filas[0] : null;
}

/**
 * Lista rutinas con filtros opcionales.
 * @param {Object} filtros - idCliente?, idEntrenador?, estado?.
 * @returns {Promise<Array>}
 */
export async function listar(filtros = {}) {
  const condiciones = [];
  const valores = [];
  if (filtros.idCliente) {
    condiciones.push('r.id_cliente = ?');
    valores.push(filtros.idCliente);
  }
  if (filtros.idEntrenador) {
    condiciones.push('r.id_entrenador = ?');
    valores.push(filtros.idEntrenador);
  }
  if (filtros.estado) {
    condiciones.push('r.estado = ?');
    valores.push(filtros.estado);
  }
  const where = condiciones.length > 0 ? ` WHERE ${condiciones.join(' AND ')}` : '';
  return consulta(
    `SELECT ${COLUMNAS_RUTINA} ${BASE}${where} ORDER BY r.fecha_creacion DESC, r.id_rutina DESC;`,
    valores
  );
}

/**
 * Lista las rutinas de un cliente (historial, más recientes primero).
 * @returns {Promise<Array>}
 */
export async function listarPorCliente(idCliente) {
  return consulta(
    `SELECT ${COLUMNAS_RUTINA} ${BASE} WHERE r.id_cliente = ? ORDER BY r.fecha_creacion DESC, r.id_rutina DESC;`,
    [idCliente]
  );
}

/**
 * Busca la rutina activa de un cliente (FR-017).
 * @returns {Promise<Object|null>}
 */
export async function buscarActivaPorCliente(idCliente) {
  const filas = await consulta(
    `SELECT ${COLUMNAS_RUTINA} ${BASE} WHERE r.id_cliente = ? AND r.estado = 'activa' LIMIT 1;`,
    [idCliente]
  );
  return filas.length > 0 ? filas[0] : null;
}

/**
 * Actualiza el nombre y/o la descripción de una rutina.
 * @returns {Promise<number>}
 */
export async function actualizar(id, datos) {
  const campos = [];
  const valores = [];
  for (const campo of ['nombre', 'descripcion']) {
    if (datos[campo] !== undefined) {
      campos.push(`${campo} = ?`);
      valores.push(datos[campo] ?? null);
    }
  }
  if (campos.length === 0) return 0;
  valores.push(id);
  const resultado = await ejecutar(
    `UPDATE rutinas SET ${campos.join(', ')} WHERE id_rutina = ?;`,
    valores
  );
  return resultado.affectedRows;
}

/**
 * Lista los ejercicios de una rutina en orden de presentación.
 * @returns {Promise<Array>}
 */
export async function listarEjercicios(idRutina) {
  return consultar(
    `SELECT ${COLUMNAS_EJERCICIO} FROM ejercicios_rutina WHERE id_rutina = ? ORDER BY orden ASC, id_ejercicio ASC;`,
    [idRutina]
  );
}

/**
 * Inserta la lista de ejercicios de una rutina.
 * @param {number} idRutina
 * @param {Array} ejercicios
 * @param {Object} [conexion]
 * @returns {Promise<number>} Cantidad insertada.
 */
export async function crearEjercicios(idRutina, ejercicios = [], conexion = null) {
  let total = 0;
  for (const [indice, ejercicio] of ejercicios.entries()) {
    await escritura(
      `INSERT INTO ejercicios_rutina
       (id_rutina, nombre, series, repeticiones, peso, descanso, instrucciones, orden)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?);`,
      [
        idRutina,
        ejercicio.nombre,
        ejercicio.series ?? null,
        ejercicio.repeticiones ?? null,
        ejercicio.peso ?? null,
        ejercicio.descanso ?? null,
        ejercicio.instrucciones ?? null,
        ejercicio.orden ?? indice,
      ],
      conexion
    );
    total += 1;
  }
  return total;
}

/**
 * Elimina los ejercicios de una rutina (para reemplazarlos).
 * @param {number} idRutina
 * @param {Object} [conexion]
 * @returns {Promise<number>}
 */
export async function eliminarEjercicios(idRutina, conexion = null) {
  const resultado = await escritura(
    'DELETE FROM ejercicios_rutina WHERE id_rutina = ?;',
    [idRutina],
    conexion
  );
  return resultado.affectedRows;
}
