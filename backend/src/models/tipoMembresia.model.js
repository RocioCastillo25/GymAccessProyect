// Modelo de tipos de membresía: acceso a datos de `tipos_membresia`
// (data-model.md §1.1, FR-004).

import { consultar, ejecutar } from '../config/baseDatos.js';

export const COLUMNAS_TIPO =
  'id_tipo_membresia, nombre, descripcion, duracion, precio, estado';

/**
 * Inserta un tipo de membresía nuevo.
 * @param {Object} datos - nombre, descripcion?, duracion, precio, estado?.
 * @returns {Promise<number>} Identificador creado.
 */
export async function crear(datos) {
  const resultado = await ejecutar(
    'INSERT INTO tipos_membresia (nombre, descripcion, duracion, precio, estado) VALUES (?, ?, ?, ?, ?);',
    [
      datos.nombre,
      datos.descripcion ?? null,
      datos.duracion,
      datos.precio,
      datos.estado ?? 'activo',
    ]
  );
  return resultado.insertId;
}

/**
 * Busca un tipo por su identificador.
 * @returns {Promise<Object|null>}
 */
export async function buscarPorId(id) {
  const filas = await consultar(
    `SELECT ${COLUMNAS_TIPO} FROM tipos_membresia WHERE id_tipo_membresia = ? LIMIT 1;`,
    [id]
  );
  return filas.length > 0 ? filas[0] : null;
}

/**
 * Busca un tipo por nombre exacto (para detectar duplicados, FR-001).
 * @returns {Promise<Object|null>}
 */
export async function buscarPorNombre(nombre) {
  const filas = await consultar(
    `SELECT ${COLUMNAS_TIPO} FROM tipos_membresia WHERE nombre = ? LIMIT 1;`,
    [nombre]
  );
  return filas.length > 0 ? filas[0] : null;
}

/**
 * Actualiza los campos indicados de un tipo (no permite cambiar su id).
 * @returns {Promise<number>} Filas afectadas.
 */
export async function actualizar(id, datos) {
  const campos = [];
  const valores = [];
  for (const campo of ['nombre', 'descripcion', 'duracion', 'precio', 'estado']) {
    if (datos[campo] !== undefined) {
      campos.push(`${campo} = ?`);
      valores.push(datos[campo]);
    }
  }
  if (campos.length === 0) return 0;
  valores.push(id);
  const resultado = await ejecutar(
    `UPDATE tipos_membresia SET ${campos.join(', ')} WHERE id_tipo_membresia = ?;`,
    valores
  );
  return resultado.affectedRows;
}

/**
 * Lista todos los tipos de membresía.
 * @returns {Promise<Array>}
 */
export async function listar() {
  return consultar(`SELECT ${COLUMNAS_TIPO} FROM tipos_membresia ORDER BY nombre;`);
}
