// Presentador de entrenadores: adapta la fila al contrato (contracts/api-rest.md §1)
// con camelCase y sin datos sensibles del usuario.

/**
 * @param {Object} entrenador - Fila de `entrenadores` con datos del usuario.
 * @returns {Object|null}
 */
export function presentarEntrenador(entrenador) {
  if (!entrenador) return null;
  return {
    id: entrenador.id_entrenador,
    idUsuario: entrenador.id_usuario,
    nombre: entrenador.nombre_usuario,
    correo: entrenador.correo_usuario,
    especialidad: entrenador.especialidad ?? null,
    telefono: entrenador.telefono ?? null,
    fechaRegistro:
      entrenador.fecha_registro instanceof Date
        ? entrenador.fecha_registro.toISOString()
        : entrenador.fecha_registro,
    estado: entrenador.estado,
  };
}

/**
 * @param {Array} entrenadores
 * @returns {Array}
 */
export function presentarListaEntrenadores(entrenadores = []) {
  return entrenadores.map(presentarEntrenador);
}
