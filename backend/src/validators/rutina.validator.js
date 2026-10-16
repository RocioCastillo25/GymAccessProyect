// Validaciones de rutinas y ejercicios (FR-010, FR-011, FR-023).

import {
  validarId,
  validarTextoObligatorio,
  validarTextoOpcional,
  validarEnteroNoNegativo,
} from './comunes.validator.js';

/**
 * Valida una lista de ejercicios de rutina.
 * @param {Array} ejercicios
 * @returns {Array<{campo: string, error: string}>}
 */
function validarListaEjercicios(ejercicios) {
  const errores = [];
  ejercicios.forEach((ejercicio, indice) => {
    const prefijo = `ejercicios[${indice}]`;
    const nombre = validarTextoObligatorio(ejercicio?.nombre, 'nombre', 100);
    if (nombre) errores.push({ campo: `${prefijo}.nombre`, error: 'El nombre del ejercicio es obligatorio.' });

    if (ejercicio?.series !== undefined && ejercicio?.series !== null && ejercicio?.series !== '') {
      const series = Number(ejercicio.series);
      if (!Number.isInteger(series) || series <= 0) {
        errores.push({ campo: `${prefijo}.series`, error: 'Las series deben ser mayores que cero.' });
      }
    }

    const evaluar = (campo, mensaje) => {
      if (mensaje) errores.push({ campo, error: mensaje });
    };
    evaluar(`${prefijo}.repeticiones`, validarTextoOpcional(ejercicio?.repeticiones, 'repeticiones', 50));
    evaluar(`${prefijo}.peso`, validarTextoOpcional(ejercicio?.peso, 'peso', 50));
    evaluar(`${prefijo}.descanso`, validarTextoOpcional(ejercicio?.descanso, 'descanso', 50));
    evaluar(
      `${prefijo}.instrucciones`,
      validarTextoOpcional(ejercicio?.instrucciones, 'instrucciones', 255)
    );
    evaluar(`${prefijo}.orden`, validarEnteroNoNegativo(ejercicio?.orden, 'orden'));
  });
  return errores;
}

/**
 * Valida la creación de una rutina.
 * @returns {Array<{campo: string, error: string}>}
 */
export function validarRutina(datos = {}) {
  const errores = [];
  const evaluar = (campo, mensaje) => {
    if (mensaje) errores.push({ campo, error: mensaje });
  };

  evaluar('idCliente', validarId(datos.idCliente, 'idCliente'));
  evaluar('nombre', validarTextoObligatorio(datos.nombre, 'nombre', 100));
  evaluar('descripcion', validarTextoOpcional(datos.descripcion, 'descripcion', 255));

  if (datos.ejercicios !== undefined && datos.ejercicios !== null) {
    if (!Array.isArray(datos.ejercicios)) {
      errores.push({ campo: 'ejercicios', error: 'Debe enviar la lista de ejercicios.' });
    } else {
      errores.push(...validarListaEjercicios(datos.ejercicios));
    }
  }

  return errores;
}

/**
 * Valida la actualización de una rutina.
 * @returns {Array<{campo: string, error: string}>}
 */
export function validarActualizacionRutina(datos = {}) {
  const errores = [];
  const evaluar = (campo, mensaje) => {
    if (mensaje) errores.push({ campo, error: mensaje });
  };

  if (datos.nombre === undefined && datos.descripcion === undefined) {
    errores.push({ campo: 'nombre', error: 'Debe indicar al menos un campo para actualizar.' });
    return errores;
  }
  evaluar('nombre', validarTextoObligatorio(datos.nombre, 'nombre', 100));
  evaluar('descripcion', validarTextoOpcional(datos.descripcion, 'descripcion', 255));

  return errores;
}

/**
 * Valida el reemplazo de la lista de ejercicios.
 * @returns {Array<{campo: string, error: string}>}
 */
export function validarEjercicios(datos = {}) {
  if (!Array.isArray(datos.ejercicios)) {
    return [{ campo: 'ejercicios', error: 'Debe enviar la lista de ejercicios.' }];
  }
  return validarListaEjercicios(datos.ejercicios);
}
