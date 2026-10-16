// Presentadores de objetivos y progresos (contracts/api-rest.md §3.1 y §3.1 bis).

/**
 * @param {Object} objetivo - Fila de `objetivos_entrenamiento`.
 * @returns {Object|null}
 */
export function presentarObjetivo(objetivo) {
  if (!objetivo) return null;
  return {
    id: objetivo.id_objetivo,
    idCliente: objetivo.id_cliente,
    idEntrenador: objetivo.id_entrenador,
    cliente: `${objetivo.cliente_nombre} ${objetivo.cliente_apellido}`.trim(),
    descripcion: objetivo.descripcion,
    valorObjetivo: objetivo.valor_objetivo === null ? null : Number(objetivo.valor_objetivo),
    unidad: objetivo.unidad ?? null,
    fechaObjetivo: objetivo.fecha_objetivo ?? null,
    estado: objetivo.estado,
    fechaCreacion:
      objetivo.fecha_creacion instanceof Date
        ? objetivo.fecha_creacion.toISOString()
        : objetivo.fecha_creacion,
  };
}

/**
 * @param {Array} objetivos
 * @returns {Array}
 */
export function presentarListaObjetivos(objetivos = []) {
  return objetivos.map(presentarObjetivo);
}

/**
 * @param {Object} progreso - Fila de `progresos_clientes`.
 * @returns {Object|null}
 */
export function presentarProgreso(progreso) {
  if (!progreso) return null;
  return {
    id: progreso.id_progreso,
    idCliente: progreso.id_cliente,
    idEntrenador: progreso.id_entrenador,
    cliente: `${progreso.cliente_nombre} ${progreso.cliente_apellido}`.trim(),
    idObjetivo: progreso.id_objetivo ?? null,
    valor: Number(progreso.valor),
    unidad: progreso.unidad ?? null,
    observaciones: progreso.observaciones ?? null,
    fechaRegistro:
      progreso.fecha_registro instanceof Date
        ? progreso.fecha_registro.toISOString()
        : progreso.fecha_registro,
  };
}

/**
 * @param {Array} progresos
 * @returns {Array}
 */
export function presentarListaProgresos(progresos = []) {
  return progresos.map(presentarProgreso);
}
