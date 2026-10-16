// Servicio de auditoría: registra acciones relevantes del sprint (FR-036).
// El registro es de mejor esfuerzo: si la auditoría falla, no se interrumpe la
// operación principal, pero el fallo queda en la consola del servidor.

import * as auditoriaModel from '../models/auditoria.model.js';

/**
 * Registra una acción en la auditoría.
 * @param {Object} datos - idUsuario?, accion, modulo, resultado?, descripcion?.
 * @returns {Promise<number|null>} Identificador creado o `null` si falló.
 */
export async function registrarAccion(datos) {
  try {
    return await auditoriaModel.registrar(datos);
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] [auditoria] No se pudo registrar la acción:`,
      error
    );
    return null;
  }
}

/**
 * Lista las acciones registradas (consulta exclusiva del administrador, FR-036).
 * @param {Object} filtros - modulo?, idUsuario?, resultado?, desde?, hasta?.
 * @returns {Promise<Array>}
 */
export async function listarAcciones(filtros) {
  return auditoriaModel.listar(filtros);
}
