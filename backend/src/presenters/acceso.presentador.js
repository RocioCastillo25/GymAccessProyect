// Presentador de accesos: adapta las filas de `accesos` al contrato
// (contracts/api-rest.md §4.1) y limita los campos del rol entrenador.

function fechaHoraIso(valor) {
  return valor instanceof Date ? valor.toISOString() : valor;
}

/**
 * @param {Object} acceso - Fila de accesos con datos del cliente.
 * @returns {Object|null}
 */
export function presentarAcceso(acceso) {
  if (!acceso) return null;
  const nombre = [acceso.cliente_nombre, acceso.cliente_apellido]
    .filter(Boolean)
    .join(' ');
  return {
    id: acceso.id_acceso,
    idCliente: acceso.id_cliente ?? null,
    cliente: nombre || null,
    fechaHora: fechaHoraIso(acceso.fecha_hora),
    tipo: acceso.tipo,
    resultado: acceso.resultado,
    motivoRechazo: acceso.motivo_rechazo ?? null,
  };
}

/**
 * Vista operativa para entrenadores: sin datos personales sensibles (FR-026).
 * @param {Object} acceso - Fila de accesos.
 * @returns {Object}
 */
export function presentarAccesoEntrenador(acceso) {
  return {
    idCliente: acceso.id_cliente ?? null,
    fechaHora: fechaHoraIso(acceso.fecha_hora),
    tipo: acceso.tipo,
    resultado: acceso.resultado,
  };
}

/**
 * @param {Array} accesos - Filas de accesos con datos del cliente.
 * @returns {Array}
 */
export function presentarListaAccesos(accesos = []) {
  return accesos.map(presentarAcceso);
}

/**
 * @param {Array} accesos - Filas de accesos.
 * @returns {Array}
 */
export function presentarListaAccesosEntrenador(accesos = []) {
  return accesos.map(presentarAccesoEntrenador);
}

/**
 * Compone la respuesta de `POST /api/accesos/validar`.
 * @param {Object} resultado - Resultado del servicio de validación.
 * @returns {Object}
 */
export function presentarResultadoValidacion(resultado) {
  const respuesta = {
    resultado: resultado.resultado,
    cliente: resultado.cliente
      ? {
          id: resultado.cliente.id_cliente,
          nombre: resultado.cliente.nombre,
          apellido: resultado.cliente.apellido,
        }
      : null,
  };

  if (resultado.membresia) {
    respuesta.membresia = {
      id: resultado.membresia.id_membresia,
      estado: resultado.membresia.estado,
      fechaFin: resultado.membresia.fecha_fin instanceof Date
        ? resultado.membresia.fecha_fin.toISOString().slice(0, 10)
        : String(resultado.membresia.fecha_fin).slice(0, 10),
    };
  }

  if (resultado.motivo) {
    respuesta.motivo = resultado.motivo;
  }

  if (resultado.acceso) {
    respuesta.acceso = {
      id: resultado.acceso.id_acceso,
      fechaHora: fechaHoraIso(resultado.acceso.fecha_hora),
      tipo: resultado.acceso.tipo,
    };
  }

  return respuesta;
}
