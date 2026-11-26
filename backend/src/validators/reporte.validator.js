// Validación de filtros y exportaciones de reportes del Sprint 4.
// Centraliza el formato de fechas, los filtros opcionales y el contrato de
// exportación para que los controladores y servicios compartan las mismas reglas.

import { errorValidacion } from '../utils/errores.js';

const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/;
const RESULTADOS = ['autorizado', 'rechazado'];
const REPORTES_EXPORTABLES = ['financiero', 'accesos', 'vencidos'];
const FORMATOS_EXPORTACION = ['csv', 'pdf'];

function esFechaValida(valor) {
  if (!PATRON_FECHA.test(String(valor))) return false;
  const fecha = new Date(`${valor}T00:00:00Z`);
  return !Number.isNaN(fecha.getTime()) && fecha.toISOString().slice(0, 10) === valor;
}

function agregarError(errores, campo, error) {
  errores.push({ campo, error });
}

/**
 * Valida un rango de fechas inclusivo y obligatorio.
 * @param {Object} filtros - `{ fechaInicio, fechaFin }`.
 * @returns {{fechaInicio: string, fechaFin: string}}
 * @throws {ErrorAplicacion} Si el rango está incompleto o es inválido.
 */
export function validarRango(filtros = {}) {
  const errores = [];
  const { fechaInicio, fechaFin } = filtros;

  if (!fechaInicio) {
    agregarError(errores, 'fechaInicio', 'La fecha de inicio es obligatoria.');
  } else if (!esFechaValida(fechaInicio)) {
    agregarError(errores, 'fechaInicio', 'Use el formato YYYY-MM-DD.');
  }

  if (!fechaFin) {
    agregarError(errores, 'fechaFin', 'La fecha de fin es obligatoria.');
  } else if (!esFechaValida(fechaFin)) {
    agregarError(errores, 'fechaFin', 'Use el formato YYYY-MM-DD.');
  }

  if (
    fechaInicio &&
    fechaFin &&
    esFechaValida(fechaInicio) &&
    esFechaValida(fechaFin) &&
    fechaInicio > fechaFin
  ) {
    agregarError(errores, 'fechaFin', 'La fecha de fin no puede ser anterior a la fecha de inicio.');
  }

  if (errores.length > 0) {
    throw errorValidacion('Revise los filtros del reporte.', errores);
  }

  return { fechaInicio, fechaFin };
}

/**
 * Valida un identificador de cliente opcional.
 * @param {unknown} valor
 * @returns {number|null}
 */
export function validarIdCliente(valor) {
  if (valor === undefined || valor === null || valor === '') return null;
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) {
    throw errorValidacion('Revise los filtros del reporte.', [
      { campo: 'idCliente', error: 'El cliente debe ser un número entero positivo.' },
    ]);
  }
  return numero;
}

/**
 * Valida un método de pago opcional. Si el parámetro se envía, no puede ir vacío.
 * @param {unknown} valor
 * @returns {string|null}
 */
export function validarMetodoPago(valor) {
  if (valor === undefined || valor === null) return null;
  const texto = String(valor).trim();
  if (!texto) {
    throw errorValidacion('Revise los filtros del reporte.', [
      { campo: 'metodoPago', error: 'El método de pago no puede estar vacío.' },
    ]);
  }
  return texto;
}

/**
 * Valida el resultado de un acceso opcional.
 * @param {unknown} valor
 * @returns {string|null}
 */
export function validarResultado(valor) {
  if (valor === undefined || valor === null || valor === '') return null;
  if (!RESULTADOS.includes(valor)) {
    throw errorValidacion('Revise los filtros del reporte.', [
      { campo: 'resultado', error: `El resultado debe ser uno de: ${RESULTADOS.join(', ')}.` },
    ]);
  }
  return valor;
}

/**
 * Valida el texto de búsqueda opcional del reporte de vencidos.
 * @param {unknown} valor
 * @returns {string|null}
 */
export function validarBuscar(valor) {
  if (valor === undefined || valor === null) return null;
  const texto = String(valor).trim();
  if (!texto) return null;
  if (texto.length > 100) {
    throw errorValidacion('Revise los filtros del reporte.', [
      { campo: 'buscar', error: 'La búsqueda no puede superar los 100 caracteres.' },
    ]);
  }
  return texto;
}

/**
 * Valida los filtros comunes y los filtros propios de cada reporte.
 * @param {Object} filtros - Parámetros de consulta.
 * @param {Object} [opciones] - Permite habilitar o deshabilitar filtros por reporte.
 * @returns {Object} Filtros limpios.
 */
export function validarFiltrosReporte(filtros = {}, opciones = {}) {
  const {
    requiereRango = true,
    permitirIdCliente = true,
    permitirMetodoPago = true,
    permitirResultado = true,
    permitirBuscar = false,
  } = opciones;
  const errores = [];
  const limpios = {};

  if (requiereRango) {
    try {
      Object.assign(limpios, validarRango(filtros));
    } catch (error) {
      if (Array.isArray(error.errores)) errores.push(...error.errores);
      else throw error;
    }
  }

  if (permitirIdCliente) {
    try {
      limpios.idCliente = validarIdCliente(filtros.idCliente);
    } catch (error) {
      if (Array.isArray(error.errores)) errores.push(...error.errores);
      else throw error;
    }
  }

  if (permitirMetodoPago) {
    try {
      limpios.metodoPago = validarMetodoPago(filtros.metodoPago);
    } catch (error) {
      if (Array.isArray(error.errores)) errores.push(...error.errores);
      else throw error;
    }
  }

  if (permitirResultado) {
    try {
      limpios.resultado = validarResultado(filtros.resultado);
    } catch (error) {
      if (Array.isArray(error.errores)) errores.push(...error.errores);
      else throw error;
    }
  }

  if (permitirBuscar) {
    try {
      limpios.buscar = validarBuscar(filtros.buscar);
    } catch (error) {
      if (Array.isArray(error.errores)) errores.push(...error.errores);
      else throw error;
    }
  }

  if (errores.length > 0) {
    throw errorValidacion('Revise los filtros del reporte.', errores);
  }

  return limpios;
}

/**
 * Valida el cuerpo de `POST /api/reports/exports`.
 * @param {Object} datos - `{ reporte, formato, filtros? }`.
 * @returns {{reporte: string, formato: string, filtros: Object}}
 */
export function validarExportacion(datos = {}) {
  const errores = [];

  if (!REPORTES_EXPORTABLES.includes(datos.reporte)) {
    agregarError(
      errores,
      'reporte',
      `El reporte debe ser uno de: ${REPORTES_EXPORTABLES.join(', ')}.`
    );
  }

  if (!FORMATOS_EXPORTACION.includes(datos.formato)) {
    agregarError(
      errores,
      'formato',
      `El formato debe ser uno de: ${FORMATOS_EXPORTACION.join(', ')}.`
    );
  }

  if (
    datos.filtros !== undefined &&
    (datos.filtros === null || typeof datos.filtros !== 'object' || Array.isArray(datos.filtros))
  ) {
    agregarError(errores, 'filtros', 'Los filtros deben ser un objeto.');
  }

  if (errores.length > 0) {
    throw errorValidacion('Revise los datos de la exportación.', errores);
  }

  return {
    reporte: datos.reporte,
    formato: datos.formato,
    filtros: datos.filtros ?? {},
  };
}
