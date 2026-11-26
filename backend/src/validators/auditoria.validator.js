// Validaciones de la consulta de auditoría (FR-036).

import {
  validarFecha,
  validarId,
  validarTextoOpcional,
} from './comunes.validator.js';
import { esPosterior } from '../utils/fechas.js';
import { errorValidacion } from '../utils/errores.js';

const RESULTADOS = ['exito', 'error'];

/**
 * Valida y normaliza los filtros de `GET /api/auditoria`.
 * @param {Object} filtros
 * @returns {Object} Filtros listos para el modelo.
 * @throws {ErrorAplicacion} Si algún filtro no es válido.
 */
export function validarConsultaAuditoria(filtros = {}) {
  const errores = [];
  const limpios = {};

  const errorModulo = validarTextoOpcional(filtros.modulo, 'modulo', 50);
  if (errorModulo) errores.push({ campo: 'modulo', error: errorModulo });
  else if (filtros.modulo) limpios.modulo = String(filtros.modulo).trim();

  if (filtros.idUsuario !== undefined && filtros.idUsuario !== '') {
    const errorId = validarId(filtros.idUsuario, 'idUsuario');
    if (errorId) errores.push({ campo: 'idUsuario', error: errorId });
    else limpios.idUsuario = Number(filtros.idUsuario);
  }

  for (const campo of ['desde', 'hasta']) {
    if (filtros[campo]) {
      const errorFecha = validarFecha(filtros[campo], campo);
      if (errorFecha) errores.push({ campo, error: errorFecha });
      else limpios[campo] = filtros[campo];
    }
  }

  if (limpios.desde && limpios.hasta && esPosterior(limpios.desde, limpios.hasta)) {
    errores.push({ campo: 'hasta', error: 'La fecha final no puede ser anterior a la inicial.' });
  }

  if (filtros.resultado) {
    if (!RESULTADOS.includes(filtros.resultado)) {
      errores.push({
        campo: 'resultado',
        error: `El resultado debe ser uno de: ${RESULTADOS.join(', ')}.`,
      });
    } else {
      limpios.resultado = filtros.resultado;
    }
  }

  if (errores.length > 0) {
    throw errorValidacion('Revise los filtros enviados.', errores);
  }

  return limpios;
}
