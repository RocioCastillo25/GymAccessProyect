// Presentador del dashboard: omite los indicadores reservados al administrador
// cuando el rol es `recepcionista` (FR-020).

/**
 * Resumen general (solo administrador, FR-019).
 * @param {Object} resumen
 * @returns {Object}
 */
export function presentarResumenGeneral(resumen = {}) {
  return {
    clientesActivos: Number(resumen.clientesActivos ?? 0),
    clientesInactivos: Number(resumen.clientesInactivos ?? 0),
    entrenadoresActivos: Number(resumen.entrenadoresActivos ?? 0),
    clientesConEntrenador: Number(resumen.clientesConEntrenador ?? 0),
    clientesSinEntrenador: Number(resumen.clientesSinEntrenador ?? 0),
    rutinasActivas: Number(resumen.rutinasActivas ?? 0),
    objetivosEnProgreso: Number(resumen.objetivosEnProgreso ?? 0),
    membresiasActivas: Number(resumen.membresiasActivas ?? 0),
    membresiasVencidas: Number(resumen.membresiasVencidas ?? 0),
    accesosRecientes: Number(resumen.accesosRecientes ?? 0),
    accesosRechazados: Number(resumen.accesosRechazados ?? 0),
  };
}

/**
 * Resumen operativo de personal (administrador y recepcionista, FR-020).
 * @param {Object} resumen
 * @returns {Object}
 */
export function presentarResumenPersonal(resumen = {}) {
  return {
    entrenadoresActivos: Number(resumen.entrenadoresActivos ?? 0),
    asignacionesActivas: Number(resumen.asignacionesActivas ?? 0),
    clientesSinEntrenador: Number(resumen.clientesSinEntrenador ?? 0),
  };
}
