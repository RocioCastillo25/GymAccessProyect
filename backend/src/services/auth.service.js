// Servicio de autenticación (FR-001 a FR-005, FR-010).

import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config/entorno.js';
import { buscarPorCorreo } from '../models/usuario.model.js';
import { presentarUsuario } from '../presenters/usuario.presentador.js';
import { errorAutenticacion, errorValidacion } from '../utils/errores.js';

/**
 * Genera el token JWT con la expiración configurada (60 minutos por defecto).
 * @param {Object} usuario - Registro de la tabla usuarios.
 * @returns {string}
 */
export function generarToken(usuario) {
  return jwt.sign(
    {
      sub: usuario.id_usuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
    },
    config.jwt.secreto,
    { expiresIn: config.jwt.expiracion }
  );
}

/**
 * Valida las credenciales y devuelve el token junto con el usuario.
 * El mismo mensaje se usa para contraseña incorrecta, correo inexistente y
 * usuario desactivado, para no revelar si el correo existe (FR-005).
 * @param {string} correo
 * @param {string} password
 * @returns {Promise<{token: string, expiraEn: string, usuario: Object}>}
 */
export async function iniciarSesion(correo, password) {
  if (!correo || !password) {
    throw errorValidacion('Revise los datos enviados.', [
      { campo: 'correo', error: !correo ? 'El correo es obligatorio.' : null },
      { campo: 'password', error: !password ? 'La contraseña es obligatoria.' : null },
    ].filter((item) => item.error));
  }

  const usuario = await buscarPorCorreo(correo.trim().toLowerCase(), true);

  if (!usuario || usuario.estado !== 'activo') {
    throw errorAutenticacion();
  }

  const coincide = await bcrypt.compare(password, usuario.password);
  if (!coincide) {
    throw errorAutenticacion();
  }

  return {
    token: generarToken(usuario),
    expiraEn: config.jwt.expiracion,
    usuario: presentarUsuario(usuario),
  };
}
