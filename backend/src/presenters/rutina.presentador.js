// Presentador de rutinas y ejercicios (contracts/api-rest.md §3).

/**
 * @param {Object} ejercicio - Fila de `ejercicios_rutina`.
 * @returns {Object|null}
 */
export function presentarEjercicio(ejercicio) {
  if (!ejercicio) return null;
  return {
    id: ejercicio.id_ejercicio,
    nombre: ejercicio.nombre,
    series: ejercicio.series ?? null,
    repeticiones: ejercicio.repeticiones ?? null,
    peso: ejercicio.peso ?? null,
    descanso: ejercicio.descanso ?? null,
    instrucciones: ejercicio.instrucciones ?? null,
    orden: ejercicio.orden,
  };
}

/**
 * @param {Object} rutina - Fila de `rutinas`.
 * @param {Array} [ejercicios] - Ejercicios asociados (opcional).
 * @returns {Object|null}
 */
export function presentarRutina(rutina, ejercicios = null) {
  if (!rutina) return null;
  const presentada = {
    id: rutina.id_rutina,
    idCliente: rutina.id_cliente,
    idEntrenador: rutina.id_entrenador,
    cliente: `${rutina.cliente_nombre} ${rutina.cliente_apellido}`.trim(),
    nombre: rutina.nombre,
    descripcion: rutina.descripcion ?? null,
    estado: rutina.estado,
    fechaCreacion:
      rutina.fecha_creacion instanceof Date
        ? rutina.fecha_creacion.toISOString()
        : rutina.fecha_creacion,
  };
  if (Array.isArray(ejercicios)) {
    presentada.ejercicios = ejercicios.map(presentarEjercicio);
  }
  return presentada;
}

/**
 * @param {Array} rutinas
 * @returns {Array}
 */
export function presentarListaRutinas(rutinas = []) {
  return rutinas.map((rutina) => presentarRutina(rutina));
}
