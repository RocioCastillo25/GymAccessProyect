// Modelo de auditoría: acceso a datos de la tabla `auditoria` (data-model.md §1, FR-036).

import { consultar, ejecutar } from '../config/baseDatos.js';

export const COLUMNAS_AUDITORIA =
  'id_auditoria, id_usuario, accion, modulo, fecha, resultado, descripcion';

/**
 * Inserta una acción en la auditoría.
 * @param {Object} datos - idUsuario?, accion, modulo, resultado, descripcion?.
 * @returns {Promise<number>} Identificador creado.
 */
export async function registrar(datos) {
  const resultado = await ejecutar(
    'INSERT INTO auditoria (id_usuario, accion, modulo, resultado, descripcion) VALUES (?, ?, ?, ?, ?);',
    [
      datos.idUsuario ?? null,
      datos.accion,
      datos.modulo,
      datos.resultado ?? 'exito',
      datos.descripcion ?? null,
    ]
  );
  return resultado.insertId;
}

/**
 * Lista las acciones registradas con filtros opcionales (FR-036).
 * @param {Object} filtros - modulo?, idUsuario?, resultado?, desde?, hasta?.
 * @returns {Promise<Array>}
 */
export async function listar(filtros = {}) {
  const condiciones = [];
  const valores = [];

  if (filtros.modulo) {
    condiciones.push('modulo = ?');
    valores.push(filtros.modulo);
  }
  if (filtros.idUsuario) {
    condiciones.push('id_usuario = ?');
    valores.push(filtros.idUsuario);
  }
  if (filtros.resultado) {
    condiciones.push('resultado = ?');
    valores.push(filtros.resultado);
  }
  if (filtros.desde) {
    condiciones.push('fecha >= ?');
    valores.push(filtros.desde);
  }
  if (filtros.hasta) {
    condiciones.push('fecha <= ?');
    valores.push(filtros.hasta);
  }

  const where = condiciones.length > 0 ? ` WHERE ${condiciones.join(' AND ')}` : '';
  return consultar(
    `SELECT ${COLUMNAS_AUDITORIA} FROM auditoria${where} ORDER BY fecha DESC, id_auditoria DESC;`,
    valores
  );
}
