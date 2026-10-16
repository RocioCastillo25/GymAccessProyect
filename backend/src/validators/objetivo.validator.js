// Validaciones de objetivos de entrenamiento (FR-013, FR-023).

import {
  validarId,
  validarTextoObligatorio,
  validarTextoOpcional,
  validarNumeroOpcional,
  validarFecha,
} from './comunes.validator.js';

export const ESTADOS_OBJETIVO = ['en_progreso', 'cumplido', 'cancelado'];

/**
 * Valida la creación de un objetivo.
 * @returns {Array<{campo: string, error: string}>}
 */
export function validarObjetivo(datos = {}) {
  const errores = [];
  const evaluar = (campo, mensaje) => {
    if (mensaje) errores.push({ campo, error: mensaje });
  };

  evaluar('idCliente', validarId(datos.idCliente, 'idCliente'));
  evaluar('descripcion', validarTextoObligatorio(datos.descripcion, 'descripcion', 255));
  evaluar('valorObjetivo', validarNumeroOpcional(datos.valorObjetivo, 'valorObjetivo'));
  evaluar('unidad', validarTextoOpcional(datos.unidad, 'unidad', 20));
  if (datos.fechaObjetivo !== undefined && datos.fechaObjetivo !== null && datos.fechaObjetivo !== '') {
    evaluar('fechaObjetivo', validarFecha(datos.fechaObjetivo, 'fechaObjetivo'));
  }

  return errores;
}

/**
 * Valida el cambio de estado de un objetivo.
 * @returns {Array<{campo: string, error: string}>}
 */
export function validarEstadoObjetivo(estado) {
  if (!ESTADOS_OBJETIVO.includes(estado)) {
    return [
      {
        campo: 'estado',
        error: `El estado del objetivo debe ser uno de: ${ESTADOS_OBJETIVO.join(', ')}.`,
      },
    ];
  }
  return [];
}
