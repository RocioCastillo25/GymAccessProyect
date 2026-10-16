// Validaciones de tipos de membresía (FR-004, FR-029).

import { validarTextoObligatorio, validarTextoOpcional } from './validadoresComunes.js';
import { validarDuracion, validarPrecio } from './comunes.validator.js';

/**
 * Valida el alta de un tipo de membresía.
 * @returns {Array<{campo: string, error: string}>}
 */
export function validarTipoMembresia(datos = {}) {
  const errores = [];
  const evaluar = (campo, mensaje) => {
    if (mensaje) errores.push({ campo, error: mensaje });
  };

  evaluar('nombre', validarTextoObligatorio(datos.nombre, 'nombre', 100));
  evaluar('descripcion', validarTextoOpcional(datos.descripcion, 'descripcion', 255));
  evaluar('duracion', validarDuracion(datos.duracion));
  evaluar('precio', validarPrecio(datos.precio));

  return errores;
}

/**
 * Valida la modificación parcial de un tipo: solo los campos presentes.
 * @returns {Array<{campo: string, error: string}>}
 */
export function validarActualizacionTipoMembresia(datos = {}) {
  const errores = [];
  const evaluar = (campo, mensaje) => {
    if (mensaje) errores.push({ campo, error: mensaje });
  };

  if (datos.nombre !== undefined) {
    evaluar('nombre', validarTextoObligatorio(datos.nombre, 'nombre', 100));
  }
  if (datos.descripcion !== undefined) {
    evaluar('descripcion', validarTextoOpcional(datos.descripcion, 'descripcion', 255));
  }
  if (datos.duracion !== undefined) {
    evaluar('duracion', validarDuracion(datos.duracion));
  }
  if (datos.precio !== undefined) {
    evaluar('precio', validarPrecio(datos.precio));
  }

  return errores;
}
