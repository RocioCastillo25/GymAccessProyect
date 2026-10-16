// Presentador de tipos de membresía: adapta la fila de `tipos_membresia` al
// formato del contrato (contracts/api-rest.md §1) con el identificador como `id`.
// El rol entrenador solo recibe id, nombre y duracion (FR-002): nunca el precio.

/**
 * @param {Object} tipo - Fila de la tabla tipos_membresia.
 * @param {string} rol - Rol del usuario autenticado.
 * @returns {Object|null}
 */
export function presentarTipoMembresia(tipo, rol) {
  if (!tipo) return null;

  const salida = {
    id: tipo.id_tipo_membresia,
    nombre: tipo.nombre,
    duracion: tipo.duracion,
  };

  if (rol !== 'entrenador') {
    salida.descripcion = tipo.descripcion ?? null;
    salida.precio = tipo.precio;
    salida.estado = tipo.estado;
  }

  return salida;
}

/**
 * @param {Array} tipos - Filas de la tabla tipos_membresia.
 * @param {string} rol - Rol del usuario autenticado.
 * @returns {Array}
 */
export function presentarListaTiposMembresia(tipos = [], rol) {
  return tipos.map((tipo) => presentarTipoMembresia(tipo, rol));
}
