// Validaciones de usuarios (FR-008, FR-011, FR-012, FR-018).

import {
  validarCorreo,
  validarPassword,
  validarTextoObligatorio,
  validarRol,
  recopilarErrores,
} from './validadoresComunes.js';

/**
 * Valida los datos de creación de un usuario.
 * @returns {Array<{campo: string, error: string}>}
 */
export function validarUsuario(datos = {}) {
  return recopilarErrores({
    nombre: validarTextoObligatorio(datos.nombre, 'nombre', 100),
    correo: validarCorreoNormalizado(datos.correo),
    password: validarPassword(datos.password),
    ...(datos.rol !== undefined ? { rol: validarRol(datos.rol) } : {}),
  });
}

/**
 * Valida la modificación de datos de un usuario (sin contraseña).
 * @returns {Array<{campo: string, error: string}>}
 */
export function validarActualizacionUsuario(datos = {}) {
  return recopilarErrores({
    ...(datos.nombre !== undefined
      ? { nombre: validarTextoObligatorio(datos.nombre, 'nombre', 100) }
      : {}),
    ...(datos.correo !== undefined ? { correo: validarCorreoNormalizado(datos.correo) } : {}),
  });
}

/** Normaliza el correo a minúsculas antes de validarlo. */
export function validarCorreoNormalizado(correo) {
  if (typeof correo === 'string') {
    return validarCorreo(correo.trim().toLowerCase());
  }
  return validarCorreo(correo);
}
