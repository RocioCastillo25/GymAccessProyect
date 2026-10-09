// Modelo de clientes: acceso a datos de la tabla `clientes` (data-model.md §2.2).

import { consultar, ejecutar } from '../config/baseDatos.js';

export const COLUMNAS_CLIENTE =
  'id_cliente, nombre, apellido, correo, telefono, direccion, fecha_registro, estado';

// El rol entrenador solo puede recibir nombre, apellido y estado (FR-016, clarify 2026-10-09).
export const COLUMNAS_CLIENTE_ENTRENADOR = 'id_cliente, nombre, apellido, estado';

/**
 * Busca un cliente por correo (para detectar duplicados, FR-020).
 * @returns {Promise<Object|null>}
 */
export async function buscarPorCorreo(correo) {
  const filas = await consultar(
    `SELECT ${COLUMNAS_CLIENTE} FROM clientes WHERE correo = ? LIMIT 1;`,
    [correo]
  );
  return filas.length > 0 ? filas[0] : null;
}

/**
 * Inserta un cliente nuevo.
 * @param {Object} datos - nombre, apellido, correo, telefono?, direccion?, estado.
 * @returns {Promise<number>} Identificador creado.
 */
export async function crear(datos) {
  const resultado = await ejecutar(
    'INSERT INTO clientes (nombre, apellido, correo, telefono, direccion, estado) VALUES (?, ?, ?, ?, ?, ?);',
    [
      datos.nombre,
      datos.apellido,
      datos.correo,
      datos.telefono ?? null,
      datos.direccion ?? null,
      datos.estado ?? 'activo',
    ]
  );
  return resultado.insertId;
}

/**
 * Busca un cliente por su identificador.
 * @param {number} id
 * @param {string} columnas - Selección de campos (por rol).
 * @returns {Promise<Object|null>}
 */
export async function buscarPorId(id, columnas = COLUMNAS_CLIENTE) {
  const filas = await consultar(`SELECT ${columnas} FROM clientes WHERE id_cliente = ? LIMIT 1;`, [
    id,
  ]);
  return filas.length > 0 ? filas[0] : null;
}

/**
 * Actualiza los campos indicados de un cliente (no permite cambiar su id).
 * @param {number} id
 * @param {Object} datos - Campos a actualizar.
 * @returns {Promise<number>} Filas afectadas.
 */
export async function actualizar(id, datos) {
  const campos = [];
  const valores = [];
  for (const campo of ['nombre', 'apellido', 'correo', 'telefono', 'direccion', 'estado']) {
    if (datos[campo] !== undefined) {
      campos.push(`${campo} = ?`);
      valores.push(datos[campo]);
    }
  }
  if (campos.length === 0) return 0;
  valores.push(id);
  const resultado = await ejecutar(
    `UPDATE clientes SET ${campos.join(', ')} WHERE id_cliente = ?;`,
    valores
  );
  return resultado.affectedRows;
}

/**
 * Lista los clientes con la selección de campos indicada.
 * @returns {Promise<Array>}
 */
export async function listar(columnas = COLUMNAS_CLIENTE) {
  return consultar(`SELECT ${columnas} FROM clientes ORDER BY apellido, nombre;`);
}
