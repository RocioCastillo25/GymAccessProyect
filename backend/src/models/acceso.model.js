// Modelo de accesos: acceso a datos de `accesos` (data-model.md §1, FR-021 a FR-027).
// Los registros no se eliminan de forma ordinaria (FR-025).

import { consultar, ejecutar } from '../config/baseDatos.js';

export const COLUMNAS_ACCESO =
  'a.id_acceso, a.id_cliente, a.fecha_hora, a.tipo, a.resultado, a.motivo_rechazo';

const COLUMNAS_ACCESO_CON_CLIENTE = `${COLUMNAS_ACCESO},
  c.nombre AS cliente_nombre, c.apellido AS cliente_apellido`;

/**
 * Registra un intento de acceso, autorizado o rechazado (FR-024).
 * @param {Object} datos - `{ idCliente, tipo, resultado, motivoRechazo }`.
 * @returns {Promise<number>} Identificador creado.
 */
export async function crear(datos) {
  const resultado = await ejecutar(
    'INSERT INTO accesos (id_cliente, tipo, resultado, motivo_rechazo) VALUES (?, ?, ?, ?);',
    [
      datos.idCliente ?? null,
      datos.tipo ?? 'entrada',
      datos.resultado,
      datos.motivoRechazo ?? null,
    ]
  );
  return resultado.insertId;
}

/**
 * Busca un acceso con los datos mínimos del cliente.
 * @returns {Promise<Object|null>}
 */
export async function buscarPorId(id) {
  const filas = await consultar(
    `SELECT ${COLUMNAS_ACCESO_CON_CLIENTE}
     FROM accesos a
     LEFT JOIN clientes c ON c.id_cliente = a.id_cliente
     WHERE a.id_acceso = ? LIMIT 1;`,
    [id]
  );
  return filas.length > 0 ? filas[0] : null;
}

/**
 * Lista los accesos con filtros opcionales.
 * @param {Object} filtros - resultado?, idCliente?, desde?, hasta?.
 * @returns {Promise<Array>}
 */
export async function listar(filtros = {}) {
  const condiciones = [];
  const valores = [];

  if (filtros.resultado) {
    condiciones.push('a.resultado = ?');
    valores.push(filtros.resultado);
  }
  if (filtros.idCliente) {
    condiciones.push('a.id_cliente = ?');
    valores.push(filtros.idCliente);
  }
  if (filtros.desde) {
    condiciones.push('a.fecha_hora >= ?');
    valores.push(filtros.desde);
  }
  if (filtros.hasta) {
    condiciones.push('a.fecha_hora < DATE_ADD(?, INTERVAL 1 DAY)');
    valores.push(filtros.hasta);
  }

  const where = condiciones.length > 0 ? ` WHERE ${condiciones.join(' AND ')}` : '';
  return consultar(
    `SELECT ${COLUMNAS_ACCESO_CON_CLIENTE}
     FROM accesos a
     LEFT JOIN clientes c ON c.id_cliente = a.id_cliente
     ${where}
     ORDER BY a.fecha_hora DESC, a.id_acceso DESC;`,
    valores
  );
}

/**
 * Lista el historial de un cliente (FR-027).
 * @returns {Promise<Array>}
 */
export async function listarPorCliente(idCliente) {
  return listar({ idCliente });
}
