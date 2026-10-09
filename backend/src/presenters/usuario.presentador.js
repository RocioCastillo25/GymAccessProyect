// Presentador de usuarios: adapta la fila de la tabla `usuarios` al formato
// del contrato (contracts/api-rest.md §1 y §2): el identificador se expone como `id`.

/**
 * @param {Object} usuario - Fila de la tabla usuarios.
 * @returns {Object|null} Usuario en formato de la API (sin contraseña).
 */
export function presentarUsuario(usuario) {
  if (!usuario) return null;
  return {
    id: usuario.id_usuario,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol,
    estado: usuario.estado,
  };
}

/**
 * @param {Array} usuarios - Filas de la tabla usuarios.
 * @returns {Array} Lista en formato de la API.
 */
export function presentarListaUsuarios(usuarios = []) {
  return usuarios.map(presentarUsuario);
}
