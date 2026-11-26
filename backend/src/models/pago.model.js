// Modelo de pagos: acceso a datos de `pagos` (data-model.md §1.1, FR-011, FR-014).

import { consultar, ejecutar } from '../config/baseDatos.js';
import { sumarDias } from '../utils/fechas.js';

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

/**
 * Construye la cláusula WHERE compartida por el historial y su conteo.
 * El rango de fechas se convierte a `[inicio 00:00:00, fin+1 día 00:00:00)`
 * para conservar el uso de `idx_fecha_pago` (data-model.md §3.3).
 * @returns {{where: string, parametros: Array}}
 */
function construirFiltros(filtros = {}) {
  const condiciones = [];
  const parametros = [];

  if (filtros.idCliente !== undefined && filtros.idCliente !== null) {
    condiciones.push('id_cliente = ?');
    parametros.push(filtros.idCliente);
  }
  if (filtros.estado) {
    condiciones.push('estado = ?');
    parametros.push(filtros.estado);
  }
  if (filtros.fechaInicio) {
    condiciones.push('fecha_pago >= ?');
    parametros.push(`${filtros.fechaInicio} 00:00:00`);
  }
  if (filtros.fechaFin) {
    condiciones.push('fecha_pago < ?');
    parametros.push(`${sumarDias(filtros.fechaFin, 1)} 00:00:00`);
  }

  return {
    where: condiciones.length > 0 ? `WHERE ${condiciones.join(' AND ')}` : '',
    parametros,
  };
}

/**
 * Lista una página del historial con filtros opcionales (005-FR-003).
 * @returns {Promise<Array>}
 */
export async function listarFiltrados(filtros = {}) {
  const { where, parametros } = construirFiltros(filtros);
  return consultar(
    `SELECT ${COLUMNAS_PAGO} FROM pagos ${where}
     ORDER BY fecha_pago DESC, id_pago DESC
     LIMIT ? OFFSET ?;`,
    [...parametros, filtros.limite ?? 50, filtros.offset ?? 0]
  );
}

/**
 * Cuenta todos los pagos que cumplen los filtros, sin paginación (005-FR-003).
 * @returns {Promise<number>}
 */
export async function contarFiltrados(filtros = {}) {
  const { where, parametros } = construirFiltros(filtros);
  const filas = await consultar(`SELECT COUNT(*) AS total FROM pagos ${where};`, parametros);
  return Number(filas[0]?.total ?? 0);
}

/**
 * Cuenta los clientes con al menos un pago pendiente (005-FR-009).
 * @returns {Promise<number>}
 */
export async function contarClientesConAdeudos(filtros = {}) {
  const parametros = [];
  let where = "WHERE p.estado = 'pendiente'";
  if (filtros.idCliente !== undefined && filtros.idCliente !== null) {
    where += ' AND p.id_cliente = ?';
    parametros.push(filtros.idCliente);
  }
  const filas = await consultar(
    `SELECT COUNT(DISTINCT p.id_cliente) AS total FROM pagos p ${where};`,
    parametros
  );
  return Number(filas[0]?.total ?? 0);
}

/**
 * Lista una página de clientes con adeudo y su total (005-FR-009, 005-FR-011).
 * @returns {Promise<Array>} Filas con `total_adeudado` como número.
 */
export async function listarClientesConAdeudos(filtros = {}) {
  const parametros = [];
  let where = "WHERE p.estado = 'pendiente'";
  if (filtros.idCliente !== undefined && filtros.idCliente !== null) {
    where += ' AND p.id_cliente = ?';
    parametros.push(filtros.idCliente);
  }
  return consultar(
    `SELECT c.id_cliente, c.nombre, c.apellido, c.correo,
            COALESCE(SUM(p.monto), 0) AS total_adeudado
     FROM pagos p
     INNER JOIN clientes c ON c.id_cliente = p.id_cliente
     ${where}
     GROUP BY c.id_cliente, c.nombre, c.apellido, c.correo
     ORDER BY total_adeudado DESC, c.id_cliente ASC
     LIMIT ? OFFSET ?;`,
    [...parametros, filtros.limite ?? 50, filtros.offset ?? 0]
  );
}

/**
 * Devuelve los pagos pendientes de los clientes indicados (005-FR-011, 005-FR-012).
 * @returns {Promise<Array>}
 */
export async function listarPendientesPorClientes(idsClientes = []) {
  if (idsClientes.length === 0) return [];
  const marcadores = idsClientes.map(() => '?').join(', ');
  return consultar(
    `SELECT ${COLUMNAS_PAGO} FROM pagos
     WHERE estado = 'pendiente' AND id_cliente IN (${marcadores})
     ORDER BY fecha_pago DESC, id_pago DESC;`,
    idsClientes
  );
}
