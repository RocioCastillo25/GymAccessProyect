// Modelo de entrenadores: acceso a datos de `entrenadores` (data-model.md §1, FR-001 a FR-004).

import { consultar, ejecutar } from '../config/baseDatos.js';

export const COLUMNAS_ENTRENADOR =
  'e.id_entrenador, e.id_usuario, e.especialidad, e.telefono, e.fecha_registro, e.estado, ' +
  'u.nombre AS nombre_usuario, u.correo AS correo_usuario';

const BASE = `FROM entrenadores e JOIN usuarios u ON u.id_usuario = e.id_usuario`;

/**
 * Inserta un entrenador asociado a un usuario existente.
 * @param {Object} datos - idUsuario, especialidad?, telefono?.
 * @returns {Promise<number>} Identificador creado.
 */
export async function crear(datos) {
  const resultado = await ejecutar(
    'INSERT INTO entrenadores (id_usuario, especialidad, telefono, estado) VALUES (?, ?, ?, ?);',
    [datos.idUsuario, datos.especialidad ?? null, datos.telefono ?? null, datos.estado ?? 'activo']
  );
  return resultado.insertId;
}

/**
 * Busca un entrenador por su identificador.
 * @returns {Promise<Object|null>}
 */
export async function buscarPorId(id) {
  const filas = await consultar(
    `SELECT ${COLUMNAS_ENTRENADOR} ${BASE} WHERE e.id_entrenador = ? LIMIT 1;`,
    [id]
  );
  return filas.length > 0 ? filas[0] : null;
}

/**
 * Busca el entrenador asociado a un usuario.
 * @returns {Promise<Object|null>}
 */
export async function buscarPorUsuario(idUsuario) {
  const filas = await consultar(
    `SELECT ${COLUMNAS_ENTRENADOR} ${BASE} WHERE e.id_usuario = ? LIMIT 1;`,
    [idUsuario]
  );
  return filas.length > 0 ? filas[0] : null;
}

/**
 * Busca el entrenador por el correo de su usuario (FR-017).
 * @returns {Promise<Object|null>}
 */
export async function buscarPorCorreo(correo) {
  const filas = await consultar(
    `SELECT ${COLUMNAS_ENTRENADOR} ${BASE} WHERE u.correo = ? LIMIT 1;`,
    [correo]
  );
  return filas.length > 0 ? filas[0] : null;
}

/**
 * Lista todos los entrenadores ordenados por nombre.
 * @returns {Promise<Array>}
 */
export async function listar() {
  return consultar(`SELECT ${COLUMNAS_ENTRENADOR} ${BASE} ORDER BY u.nombre;`);
}

/**
 * Actualiza especialidad y/o teléfono de un entrenador (FR-002).
 * @returns {Promise<number>} Filas afectadas.
 */
export async function actualizar(id, datos) {
  const campos = [];
  const valores = [];
  for (const campo of ['especialidad', 'telefono']) {
    if (datos[campo] !== undefined) {
      campos.push(`${campo} = ?`);
      valores.push(datos[campo] ?? null);
    }
  }
  if (campos.length === 0) return 0;
  valores.push(id);
  const resultado = await ejecutar(
    `UPDATE entrenadores SET ${campos.join(', ')} WHERE id_entrenador = ?;`,
    valores
  );
  return resultado.affectedRows;
}

/**
 * Activa o desactiva un entrenador (FR-002).
 * @returns {Promise<number>} Filas afectadas.
 */
export async function actualizarEstado(id, estado) {
  const resultado = await ejecutar(
    'UPDATE entrenadores SET estado = ? WHERE id_entrenador = ?;',
    [estado, id]
  );
  return resultado.affectedRows;
}
