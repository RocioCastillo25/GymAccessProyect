// Validaciones de membresías (FR-006, FR-029).

import { validarId } from './comunes.validator.js';
import { aFechaIso, esPosterior } from '../utils/fechas.js';

/**
 * Valida la asignación de una membresía: exige `idCliente` e `idTipoMembresia`.
 * @returns {Array<{campo: string, error: string}>}
 */
export function validarAsignacion(datos = {}) {
  const errores = [];
  const evaluar = (campo, mensaje) => {
    if (mensaje) errores.push({ campo, error: mensaje });
  };

  evaluar('idCliente', validarId(datos.idCliente, 'idCliente'));
  evaluar('idTipoMembresia', validarId(datos.idTipoMembresia, 'idTipoMembresia'));

  return errores;
}

/**
 * Valida que `fecha_fin` no sea anterior a `fecha_inicio` (FR-006).
 * @returns {string|null}
 */
export function validarRangoFechas(fechaInicio, fechaFin) {
  if (!fechaInicio || !fechaFin) {
    return 'Las fechas de inicio y fin son obligatorias.';
  }
  if (esPosterior(aFechaIso(fechaInicio), aFechaIso(fechaFin))) {
    return 'La fecha de finalización no puede ser anterior a la de inicio.';
  }
  return null;
}
