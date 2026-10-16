// Validaciones de entrenadores (FR-001, FR-003, FR-023).

import { validarId, validarTextoOpcional, validarTelefono } from './comunes.validator.js';

/**
 * Valida el registro de un entrenador.
 * @returns {Array<{campo: string, error: string}>}
 */
export function validarEntrenador(datos = {}) {
  const errores = [];
  const evaluar = (campo, mensaje) => {
    if (mensaje) errores.push({ campo, error: mensaje });
  };

  evaluar('idUsuario', validarId(datos.idUsuario, 'idUsuario'));
  evaluar('especialidad', validarTextoOpcional(datos.especialidad, 'especialidad', 100));
  evaluar('telefono', validarTelefono(datos.telefono));

  return errores;
}

/**
 * Valida la modificación de un entrenador (especialidad y/o teléfono).
 * @returns {Array<{campo: string, error: string}>}
 */
export function validarActualizacionEntrenador(datos = {}) {
  const errores = [];
  const evaluar = (campo, mensaje) => {
    if (mensaje) errores.push({ campo, error: mensaje });
  };

  if (datos.especialidad === undefined && datos.telefono === undefined) {
    errores.push({
      campo: 'especialidad',
      error: 'Debe indicar al menos un campo para actualizar.',
    });
    return errores;
  }
  evaluar('especialidad', validarTextoOpcional(datos.especialidad, 'especialidad', 100));
  evaluar('telefono', validarTelefono(datos.telefono));

  return errores;
}
