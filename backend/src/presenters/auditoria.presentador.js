// Presentador de auditoría: expone solo los campos del contrato
// (contracts/api-rest.md §5) sin datos biométricos ni credenciales.

function fechaIso(valor) {
  return valor instanceof Date ? valor.toISOString() : valor;
}

/**
 * @param {Object} accion - Fila de la tabla auditoria.
 * @returns {Object}
 */
export function presentarAuditoria(accion) {
  return {
    id: accion.id_auditoria,
    idUsuario: accion.id_usuario ?? null,
    accion: accion.accion,
    modulo: accion.modulo,
    fecha: fechaIso(accion.fecha),
    resultado: accion.resultado,
    descripcion: accion.descripcion ?? null,
  };
}

/**
 * @param {Array} acciones - Filas de auditoria.
 * @returns {Array}
 */
export function presentarListaAuditoria(acciones = []) {
  return acciones.map(presentarAuditoria);
}
