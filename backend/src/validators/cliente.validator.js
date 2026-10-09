// Validaciones de clientes (FR-018, FR-020).
// Reglas: nombre, apellido y correo obligatorios; teléfono y dirección opcionales;
// estado únicamente `activo` o `inactivo` (clarify 2026-10-09).

import {
  validarCorreo,
  validarTextoObligatorio,
  validarTextoOpcional,
  validarTelefono,
  validarEstado,
  recopilarErrores,
} from './validadoresComunes.js';

const LONGITUD_MAXIMA_NOMBRE = 100;
const LONGITUD_MAXIMA_DIRECCION = 200;

/**
 * Valida los datos de creación de un cliente.
 * @param {Object} datos - Cuerpo de la petición.
 * @returns {Array<{campo: string, error: string}>} Lista vacía si es válido.
 */
export function validarCliente(datos = {}) {
  return recopilarErrores({
    nombre: validarTextoObligatorio(datos.nombre, 'nombre', LONGITUD_MAXIMA_NOMBRE),
    apellido: validarTextoObligatorio(datos.apellido, 'apellido', LONGITUD_MAXIMA_NOMBRE),
    correo: validarCorreoNormalizado(datos.correo),
    telefono: validarTelefono(datos.telefono),
    direccion: validarTextoOpcional(datos.direccion, 'dirección', LONGITUD_MAXIMA_DIRECCION),
    ...(datos.estado !== undefined ? { estado: validarEstado(datos.estado) } : {}),
  });
}

/**
 * Valida los datos de modificación de un cliente. Solo valida los campos
 * presentes: una modificación parcial no exige reenviar todo el registro (FR-015).
 * @returns {Array<{campo: string, error: string}>}
 */
export function validarActualizacionCliente(datos = {}) {
  return recopilarErrores({
    ...(datos.nombre !== undefined
      ? { nombre: validarTextoObligatorio(datos.nombre, 'nombre', LONGITUD_MAXIMA_NOMBRE) }
      : {}),
    ...(datos.apellido !== undefined
      ? { apellido: validarTextoObligatorio(datos.apellido, 'apellido', LONGITUD_MAXIMA_NOMBRE) }
      : {}),
    ...(datos.correo !== undefined ? { correo: validarCorreoNormalizado(datos.correo) } : {}),
    ...(datos.telefono !== undefined ? { telefono: validarTelefono(datos.telefono) } : {}),
    ...(datos.direccion !== undefined
      ? { direccion: validarTextoOpcional(datos.direccion, 'dirección', LONGITUD_MAXIMA_DIRECCION) }
      : {}),
    ...(datos.estado !== undefined ? { estado: validarEstado(datos.estado) } : {}),
  });
}

/** Normaliza el correo (minúsculas y sin espacios) antes de validarlo. */
export function validarCorreoNormalizado(correo) {
  if (typeof correo === 'string') {
    return validarCorreo(correo.trim().toLowerCase());
  }
  return validarCorreo(correo);
}
