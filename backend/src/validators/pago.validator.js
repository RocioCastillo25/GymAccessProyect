// Validaciones de pagos (FR-011, FR-029, research R8).

import { validarId, validarMonto, validarMetodoPago, validarEstadoPago } from './comunes.validator.js';

/**
 * Valida el registro de un pago.
 * @returns {Array<{campo: string, error: string}>}
 */
export function validarPago(datos = {}) {
  const errores = [];
  const evaluar = (campo, mensaje) => {
    if (mensaje) errores.push({ campo, error: mensaje });
  };

  evaluar('idCliente', validarId(datos.idCliente, 'idCliente'));
  if (datos.idMembresia !== undefined && datos.idMembresia !== null && datos.idMembresia !== '') {
    evaluar('idMembresia', validarId(datos.idMembresia, 'idMembresia'));
  }
  evaluar('monto', validarMonto(datos.monto));
  evaluar('metodoPago', validarMetodoPago(datos.metodoPago));
  if (datos.estado !== undefined && datos.estado !== null && datos.estado !== '') {
    evaluar('estado', validarEstadoPago(datos.estado));
  }

  return errores;
}
