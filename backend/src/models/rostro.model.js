// Modelo de rostros: acceso a datos de `rostros` (data-model.md §1.4, FR-016 a FR-020).
// El descriptor facial nunca se devuelve fuera del backend.

import { consultar, ejecutar } from '../config/baseDatos.js';

export const COLUMNAS_ESTADO_ROSTRO = 'id_rostro, id_cliente, fecha_registro, estado';

/**
 * Busca el rostro de un cliente sin exponer el descriptor.
 * @returns {Promise<Object|null>}
 */
export async function buscarPorCliente(idCliente) {
  const filas = await consultar(
    `SELECT ${COLUMNAS_ESTADO_ROSTRO} FROM rostros WHERE id_cliente = ? LIMIT 1;`,
    [idCliente]
  );
  return filas.length > 0 ? filas[0] : null;
}

/**
 * Lista los descriptores activos para compararlos durante la validación.
 * Solo se usa dentro del backend.
 * @returns {Promise<Array>}
 */
export async function listarActivos() {
  return consultar("SELECT id_cliente, descriptor_facial FROM rostros WHERE estado = 'activo';");
}

/**
 * Registra el rostro de un cliente.
 * @param {Object} datos - `{ idCliente, descriptorFacial }`.
 * @returns {Promise<number>} Identificador creado.
 */
export async function crear(datos) {
  const resultado = await ejecutar(
    'INSERT INTO rostros (id_cliente, descriptor_facial, estado) VALUES (?, ?, ?);',
    [datos.idCliente, JSON.stringify(datos.descriptorFacial), 'activo']
  );
  return resultado.insertId;
}

/**
 * Actualiza el rostro existente de un cliente.
 * @returns {Promise<number>} Filas afectadas.
 */
export async function actualizar(idCliente, descriptorFacial) {
  const resultado = await ejecutar(
    "UPDATE rostros SET descriptor_facial = ?, fecha_registro = CURRENT_TIMESTAMP, estado = 'activo' WHERE id_cliente = ?;",
    [JSON.stringify(descriptorFacial), idCliente]
  );
  return resultado.affectedRows;
}
