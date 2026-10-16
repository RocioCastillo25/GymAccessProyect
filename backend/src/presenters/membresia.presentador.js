// Presentador de membresías: adapta la fila de `membresias` al formato del
// contrato (contracts/api-rest.md §2) con camelCase y fechas 'YYYY-MM-DD'.

import { aFechaIso } from '../utils/fechas.js';

/**
 * @param {Object} membresia - Fila de la tabla membresias.
 * @returns {Object|null}
 */
export function presentarMembresia(membresia) {
  if (!membresia) return null;
  return {
    id: membresia.id_membresia,
    idCliente: membresia.id_cliente,
    idTipoMembresia: membresia.id_tipo_membresia,
    fechaInicio: aFechaIso(membresia.fecha_inicio),
    fechaFin: aFechaIso(membresia.fecha_fin),
    estado: membresia.estado,
  };
}

/**
 * @param {Array} membresias - Filas de la tabla membresias.
 * @returns {Array}
 */
export function presentarListaMembresias(membresias = []) {
  return membresias.map(presentarMembresia);
}
