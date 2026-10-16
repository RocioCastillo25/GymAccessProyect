// Presentador de asignaciones de entrenador (contracts/api-rest.md §2).

/**
 * @param {Object} asignacion - Fila de `asignaciones_entrenador` con uniones.
 * @returns {Object|null}
 */
export function presentarAsignacion(asignacion) {
  if (!asignacion) return null;
  return {
    id: asignacion.id_asignacion,
    idCliente: asignacion.id_cliente,
    idEntrenador: asignacion.id_entrenador,
    cliente: `${asignacion.cliente_nombre} ${asignacion.cliente_apellido}`.trim(),
    entrenador: asignacion.entrenador_nombre,
    esPrincipal: Boolean(asignacion.es_principal),
    estado: asignacion.estado,
    fechaAsignacion:
      asignacion.fecha_asignacion instanceof Date
        ? asignacion.fecha_asignacion.toISOString()
        : asignacion.fecha_asignacion,
  };
}

/**
 * @param {Array} asignaciones
 * @returns {Array}
 */
export function presentarListaAsignaciones(asignaciones = []) {
  return asignaciones.map(presentarAsignacion);
}
