// Servicio de entrenadores (FR-001 a FR-004, FR-030).

import * as entrenadorModelo from '../models/entrenador.model.js';
import * as usuarioModelo from '../models/usuario.model.js';
import {
  validarEntrenador,
  validarActualizacionEntrenador,
} from '../validators/entrenador.validator.js';
import { errorValidacion, errorNoEncontrado, errorDuplicado } from '../utils/errores.js';
import { registrarAccion } from './auditoria.service.js';

const MODULO = 'entrenadores';
const ESTADOS = ['activo', 'inactivo'];

/**
 * Registra un entrenador asociado a un usuario existente con rol `entrenador`
 * (FR-001, FR-003, FR-004).
 * @param {Object} datos - `{ idUsuario, especialidad?, telefono? }`.
 * @param {Object} usuario - Usuario autenticado (`{ id }`).
 * @returns {Promise<Object>}
 */
export async function registrar(datos, usuario) {
  const errores = validarEntrenador(datos);
  if (errores.length > 0) {
    throw errorValidacion('Revise los datos enviados.', errores);
  }

  const idUsuario = Number(datos.idUsuario);
  const usuarioObjetivo = await usuarioModelo.buscarPorId(idUsuario);
  if (!usuarioObjetivo) {
    throw errorNoEncontrado('Usuario no encontrado.');
  }
  if (usuarioObjetivo.rol !== 'entrenador') {
    throw errorDuplicado('El usuario no tiene el rol de entrenador.');
  }
  if (usuarioObjetivo.estado !== 'activo') {
    throw errorValidacion('Revise los datos enviados.', [
      { campo: 'idUsuario', error: 'El usuario no está activo.' },
    ]);
  }

  const existente = await entrenadorModelo.buscarPorUsuario(idUsuario);
  if (existente) {
    throw errorDuplicado('El usuario ya está registrado como entrenador.');
  }

  const id = await entrenadorModelo.crear({
    idUsuario,
    especialidad: datos.especialidad,
    telefono: datos.telefono,
  });

  await registrarAccion({
    idUsuario: usuario?.id ?? null,
    accion: 'registrar_entrenador',
    modulo: MODULO,
    resultado: 'exito',
    descripcion: `Entrenador ${id} asociado al usuario ${idUsuario}`,
  });

  return entrenadorModelo.buscarPorId(id);
}

/**
 * Lista todos los entrenadores.
 * @returns {Promise<Array>}
 */
export async function listarEntrenadores() {
  return entrenadorModelo.listar();
}

/**
 * Obtiene un entrenador por su identificador.
 * @returns {Promise<Object>}
 */
export async function obtenerEntrenador(id) {
  const entrenador = await entrenadorModelo.buscarPorId(id);
  if (!entrenador) {
    throw errorNoEncontrado('Entrenador no encontrado.');
  }
  return entrenador;
}

/**
 * Devuelve el entrenador asociado al usuario autenticado (FR-017).
 * @param {string} correo
 * @returns {Promise<Object>}
 */
export async function obtenerEntrenadorPropio(correo) {
  const entrenador = await entrenadorModelo.buscarPorCorreo(correo);
  if (!entrenador) {
    throw errorNoEncontrado('Entrenador no encontrado.');
  }
  return entrenador;
}

/**
 * Modifica la especialidad o el teléfono de un entrenador (FR-002).
 * @returns {Promise<Object>}
 */
export async function actualizarEntrenador(id, datos, usuario) {
  const errores = validarActualizacionEntrenador(datos);
  if (errores.length > 0) {
    throw errorValidacion('Revise los datos enviados.', errores);
  }

  const entrenador = await entrenadorModelo.buscarPorId(id);
  if (!entrenador) {
    throw errorNoEncontrado('Entrenador no encontrado.');
  }

  await entrenadorModelo.actualizar(id, {
    especialidad: datos.especialidad,
    telefono: datos.telefono,
  });
  await registrarAccion({
    idUsuario: usuario?.id ?? null,
    accion: 'actualizar_entrenador',
    modulo: MODULO,
    resultado: 'exito',
    descripcion: `Entrenador ${id} actualizado`,
  });
  return entrenadorModelo.buscarPorId(id);
}

/**
 * Activa o desactiva un entrenador (FR-002).
 * @returns {Promise<Object>}
 */
export async function cambiarEstadoEntrenador(id, estado, usuario) {
  if (!ESTADOS.includes(estado)) {
    throw errorValidacion('Revise los datos enviados.', [
      { campo: 'estado', error: `El estado del entrenador debe ser uno de: ${ESTADOS.join(', ')}.` },
    ]);
  }

  const entrenador = await entrenadorModelo.buscarPorId(id);
  if (!entrenador) {
    throw errorNoEncontrado('Entrenador no encontrado.');
  }

  await entrenadorModelo.actualizarEstado(id, estado);
  await registrarAccion({
    idUsuario: usuario?.id ?? null,
    accion: 'cambiar_estado_entrenador',
    modulo: MODULO,
    resultado: 'exito',
    descripcion: `Entrenador ${id} pasó a ${estado}`,
  });
  return entrenadorModelo.buscarPorId(id);
}
