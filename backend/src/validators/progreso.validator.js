// Validaciones de progresos del cliente (FR-014, FR-023).

import {
  validarId,
  validarNumeroPositivo,
  validarTextoOpcional,
} from './comunes.validator.js';

/**
 * Valida el registro de un progreso.
 * @returns {Array<{campo: string, error: string}>}
 */
export function validarProgreso(datos = {}) {
  const errores = [];
  const evaluar = (campo, mensaje) => {
    if (mensaje) errores.push({ campo, error: mensaje });
  };

  evaluar('idCliente', validarId(datos.idCliente, 'idCliente'));
  if (datos.idObjetivo !== undefined && datos.idObjetivo !== null && datos.idObjetivo !== '') {
    evaluar('idObjetivo', validarId(datos.idObjetivo, 'idObjetivo'));
  }
  evaluar('valor', validarNumeroPositivo(datos.valor, 'valor'));
  evaluar('unidad', validarTextoOpcional(datos.unidad, 'unidad', 20));
  evaluar('observaciones', validarTextoOpcional(datos.observaciones, 'observaciones', 255));

  return errores;
}
