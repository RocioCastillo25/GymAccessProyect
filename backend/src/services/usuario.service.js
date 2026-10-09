// Servicio de usuarios (FR-007 a FR-013).

import bcrypt from 'bcrypt';
import * as usuarioModelo from '../models/usuario.model.js';
import {
  validarUsuario,
  validarActualizacionUsuario,
} from '../validators/usuario.validator.js';
import { validarPassword, validarRol, validarEstado } from '../validators/validadoresComunes.js';
import { errorValidacion, errorDuplicado, errorNoEncontrado } from '../utils/errores.js';

const LONGITUD_HASH_BCRYPT = 10;

function normalizar(datos = {}) {
  return {
    ...datos,
    nombre: typeof datos.nombre === 'string' ? datos.nombre.trim() : datos.nombre,
    correo: typeof datos.correo === 'string' ? datos.correo.trim().toLowerCase() : datos.correo,
  };
}

/**
 * Crea un usuario con la contraseña hasheada con bcrypt (FR-011, SC-003).
 * @returns {Promise<Object>} Usuario creado sin contraseña.
 */
export async function crearUsuario(datos) {
  const entrada = normalizar(datos);
  const errores = validarUsuario(entrada);
  if (errores.length > 0) {
    throw errorValidacion('Revise los datos enviados.', errores);
  }

  const existente = await usuarioModelo.buscarPorCorreo(entrada.correo);
  if (existente) {
    throw errorDuplicado('El correo ya está registrado.');
  }

  const hash = await bcrypt.hash(entrada.password, LONGITUD_HASH_BCRYPT);
  const id = await usuarioModelo.crear({ ...entrada, password: hash });
  return usuarioModelo.buscarPorId(id);
}

/** Lista los usuarios sin incluir contraseñas. */
export async function listarUsuarios() {
  return usuarioModelo.listar();
}

/**
 * Devuelve un usuario por su identificador (sin contraseña).
 * @param {number} id
 * @returns {Promise<Object>}
 */
export async function obtenerUsuario(id) {
  const usuario = await usuarioModelo.buscarPorId(id);
  if (!usuario) throw errorNoEncontrado('Usuario no encontrado.');
  return usuario;
}

/**
 * Modifica nombre y/o correo de un usuario, comprobando duplicidad (FR-012).
 * @returns {Promise<Object>} Usuario actualizado.
 */
export async function modificarUsuario(id, datos) {
  const entrada = normalizar(datos);
  const errores = validarActualizacionUsuario(entrada);
  if (errores.length > 0) {
    throw errorValidacion('Revise los datos enviados.', errores);
  }

  const actual = await usuarioModelo.buscarPorId(id);
  if (!actual) throw errorNoEncontrado('Usuario no encontrado.');

  if (entrada.correo && entrada.correo !== actual.correo) {
    const duplicado = await usuarioModelo.buscarPorCorreo(entrada.correo);
    if (duplicado) throw errorDuplicado('El correo ya está registrado.');
  }

  const aGuardar = {};
  if (entrada.nombre !== undefined) aGuardar.nombre = entrada.nombre;
  if (entrada.correo !== undefined) aGuardar.correo = entrada.correo;
  await usuarioModelo.actualizar(id, aGuardar);
  return usuarioModelo.buscarPorId(id);
}

/**
 * Restablece la contraseña de un usuario (FR-011).
 * La contraseña anterior deja de ser válida porque se reemplaza el hash.
 * @returns {Promise<void>}
 */
export async function restablecerPassword(id, password) {
  const errorPassword = validarPassword(password);
  if (errorPassword) {
    throw errorValidacion('Revise los datos enviados.', [
      { campo: 'password', error: errorPassword },
    ]);
  }

  const existente = await usuarioModelo.buscarPorId(id);
  if (!existente) throw errorNoEncontrado('Usuario no encontrado.');

  const hash = await bcrypt.hash(password, LONGITUD_HASH_BCRYPT);
  await usuarioModelo.restablecerPassword(id, hash);
}

/**
 * Asigna o cambia el rol de un usuario (FR-008, FR-009).
 * @param {number} id - Usuario a modificar.
 * @param {string} rol - Uno de los cuatro roles definidos.
 * @returns {Promise<Object>} Usuario actualizado.
 */
export async function asignarRol(id, rol) {
  const errorRol = validarRol(rol);
  if (errorRol) {
    throw errorValidacion('Revise los datos enviados.', [{ campo: 'rol', error: errorRol }]);
  }

  const existente = await usuarioModelo.buscarPorId(id);
  if (!existente) throw errorNoEncontrado('Usuario no encontrado.');

  await usuarioModelo.actualizar(id, { rol });
  return usuarioModelo.buscarPorId(id);
}

/**
 * Activa o desactiva un usuario (FR-010). Un usuario inactivo no puede
 * iniciar sesión.
 * @param {number} id - Usuario a modificar.
 * @param {string} estado - `activo` o `inactivo`.
 * @returns {Promise<Object>} Usuario actualizado.
 */
export async function cambiarEstado(id, estado) {
  const errorEstado = validarEstado(estado);
  if (errorEstado) {
    throw errorValidacion('Revise los datos enviados.', [
      { campo: 'estado', error: errorEstado },
    ]);
  }

  const existente = await usuarioModelo.buscarPorId(id);
  if (!existente) throw errorNoEncontrado('Usuario no encontrado.');

  await usuarioModelo.actualizar(id, { estado });
  return usuarioModelo.buscarPorId(id);
}
