// Validaciones de asignaciones de entrenador (FR-005 a FR-007, FR-023).

import { validarId, validarBooleano } from './comunes.validator.js';

export const ESTADOS_ASIGNACION = ['activa', 'finalizada'];

/**
 * Valida la creación de una asignación.
 * @returns {Array<{campo: string, error: string}>}
 */
export function validarAsignacion(datos = {}) {
  const errores = [];
  const evaluar = (campo, mensaje) => {
    if (mensaje) errores.push({ campo, error: mensaje });
  };

  evaluar('idCliente', validarId(datos.idCliente, 'idCliente'));
  evaluar('idEntrenador', validarId(datos.idEntrenador, 'idEntrenador'));
  if (datos.esPrincipal !== undefined && datos.esPrincipal !== null && datos.esPrincipal !== '') {
    evaluar('esPrincipal', validarBooleano(datos.esPrincipal, 'esPrincipal'));
  }

  return errores;
}

/**
 * Valida el cambio de estado de una asignación.
 * @returns {Array<{campo: string, error: string}>}
 */
export function validarEstadoAsignacion(estado) {
  if (!ESTADOS_ASIGNACION.includes(estado)) {
    return [
      {
        campo: 'estado',
        error: `El estado de la asignación debe ser uno de: ${ESTADOS_ASIGNACION.join(', ')}.`,
      },
    ];
  }
  return [];
}
