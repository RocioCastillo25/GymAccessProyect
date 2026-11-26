// Validadores de consulta de pagos y adeudos (005-FR-003, 005-FR-007, 005-FR-009).
// Devuelven `{ errores, valores }`: `errores` sigue el formato del contrato y
// `valores` contiene los filtros normalizados, con los defaults ya aplicados.

import {
  validarId,
  validarFecha,
  validarEstadoPago,
  validarEnteroPositivo,
  validarEnteroNoNegativo,
} from './comunes.validator.js';

export const LIMITE_POR_DEFECTO = 50;
export const LIMITE_MAXIMO = 200;
export const DESPLAZAMIENTO_POR_DEFECTO = 0;

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

function ausente(valor) {
  return valor === undefined || valor === null || valor === '';
}

function agregarError(errores, campo, mensaje) {
  if (mensaje) errores.push({ campo, error: mensaje });
}

/**
 * Normaliza y valida `limite` (entero de 1 a 200, por defecto 50).
 * @returns {number}
 */
function normalizarLimite(valor, errores) {
  if (ausente(valor)) return LIMITE_POR_DEFECTO;
  agregarError(errores, 'limite', validarEnteroPositivo(valor, 'limite'));
  const numero = Number(valor);
  if (Number.isInteger(numero) && numero > LIMITE_MAXIMO) {
    agregarError(
      errores,
      'limite',
      `El campo limite debe ser un número entero entre 1 y ${LIMITE_MAXIMO}.`
    );
  }
  return numero;
}

/**
 * Normaliza y valida `offset` (entero >= 0, por defecto 0).
 * @returns {number}
 */
function normalizarDesplazamiento(valor, errores, nombre = 'offset') {
  if (ausente(valor)) return DESPLAZAMIENTO_POR_DEFECTO;
  agregarError(errores, nombre, validarEnteroNoNegativo(valor, nombre));
  return Number(valor);
}

/**
 * Normaliza y valida `idCliente` cuando está presente.
 * @returns {number|undefined}
 */
function normalizarIdCliente(valor, errores) {
  if (ausente(valor)) return undefined;
  agregarError(errores, 'idCliente', validarId(valor, 'idCliente'));
  return Number(valor);
}

/**
 * Normaliza y valida una fecha opcional en formato `YYYY-MM-DD`.
 * @returns {string|undefined}
 */
function normalizarFecha(valor, campo, errores) {
  if (ausente(valor)) return undefined;
  const mensajeBase = validarFecha(valor, campo);
  if (mensajeBase) {
    agregarError(errores, campo, mensajeBase);
  } else if (!FORMATO_FECHA.test(String(valor))) {
    agregarError(errores, campo, `El campo ${campo} debe tener el formato AAAA-MM-DD.`);
  }
  return String(valor);
}

/**
 * Valida los filtros de `GET /api/pagos` y `GET /api/pagos/mios`.
 * @param {Object} query - Parámetros de la cadena de consulta.
 * @returns {{errores: Array<{campo: string, error: string}>, valores: Object}}
 */
export function validarConsultaPagos(query = {}) {
  const errores = [];

  const fechaInicio = normalizarFecha(query.fechaInicio, 'fechaInicio', errores);
  const fechaFin = normalizarFecha(query.fechaFin, 'fechaFin', errores);
  const idCliente = normalizarIdCliente(query.idCliente, errores);
  const estado = ausente(query.estado) ? undefined : query.estado;

  if (estado !== undefined) {
    agregarError(errores, 'estado', validarEstadoPago(estado));
  }

  const limite = normalizarLimite(query.limite, errores);
  const offset = normalizarDesplazamiento(query.offset, errores);

  if (fechaInicio && fechaFin && fechaInicio > fechaFin) {
    agregarError(errores, 'fechaFin', 'La fecha de inicio no puede ser posterior a la fecha de fin.');
  }

  return {
    errores,
    valores: { fechaInicio, fechaFin, idCliente, estado, limite, offset },
  };
}

/**
 * Valida los filtros de `GET /api/pagos/adeudos`.
 * No acepta rangos de fecha ni estado: solo cliente y paginación de grupos.
 * @param {Object} query - Parámetros de la cadena de consulta.
 * @returns {{errores: Array<{campo: string, error: string}>, valores: Object}}
 */
export function validarConsultaAdeudos(query = {}) {
  const errores = [];
  const idCliente = normalizarIdCliente(query.idCliente, errores);
  const limite = normalizarLimite(query.limite, errores);
  const offset = normalizarDesplazamiento(query.offset, errores);

  return { errores, valores: { idCliente, limite, offset } };
}
