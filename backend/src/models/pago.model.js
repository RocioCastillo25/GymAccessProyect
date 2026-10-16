// Modelo de pagos: acceso a datos de `pagos` (data-model.md §1.1, FR-011, FR-014).

import { consultar, ejecutar } from '../config/baseDatos.js';

export const COLUMNAS_PAGO =
  'id_pago, id_cliente, id_membresia, monto, fecha_pago, metodo_pago, estado';

/**
 * Inserta un pago nuevo.
 * @param {Object} datos - idCliente, idMembresia?, monto, metodoPago, estado?.
 * @returns {Promise<number>} Identificador creado.
 */
export async function crear(datos) {
  const resultado = await ejecutar(
    'INSERT INTO pagos (id_cliente, id_membresia, monto, metodo_pago, estado) VALUES (?, ?, ?, ?, ?);',
    [
      datos.idCliente,
      datos.idMembresia ?? null,
      datos.monto,
      datos.metodoPago,
      datos.estado ?? 'completado',
    ]
  );
  return resultado.insertId;
}

/**
 * Busca un pago por su identificador.
 * @returns {Promise<Object|null>}
 */
export async function buscarPorId(id) {
  const filas = await consultar(
    `SELECT ${COLUMNAS_PAGO} FROM pagos WHERE id_pago = ? LIMIT 1;`,
    [id]
  );
  return filas.length > 0 ? filas[0] : null;
}

/**
 * Lista todos los pagos (historial, más recientes primero).
 * @returns {Promise<Array>}
 */
export async function listar() {
  return consultar(`SELECT ${COLUMNAS_PAGO} FROM pagos ORDER BY fecha_pago DESC, id_pago DESC;`);
}

/**
 * Lista los pagos de un cliente (FR-013).
 * @returns {Promise<Array>}
 */
export async function listarPorCliente(idCliente) {
  return consultar(
    `SELECT ${COLUMNAS_PAGO} FROM pagos WHERE id_cliente = ? ORDER BY fecha_pago DESC, id_pago DESC;`,
    [idCliente]
  );
}

/**
 * Indica si ya existe un pago completado para la misma membresía y monto
 * (evita el doble cobro y la corrupción del historial, FR-014).
 * @returns {Promise<boolean>}
 */
export async function existePagoCompletado(idCliente, idMembresia, monto) {
  const filas = await consultar(
    `SELECT id_pago FROM pagos
     WHERE id_cliente = ? AND id_membresia = ? AND monto = ? AND estado = 'completado'
     LIMIT 1;`,
    [idCliente, idMembresia, monto]
  );
  return filas.length > 0;
}
