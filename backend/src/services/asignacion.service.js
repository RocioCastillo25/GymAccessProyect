// Servicio de asignaciones de entrenador (FR-005 a FR-008, FR-030).
// La reasignación del entrenador principal se hace en una transacción (R15).

import { transaccion } from '../config/baseDatos.js';
import * as asignacionModelo from '../models/asignacionEntrenador.model.js';
import * as clienteModelo from '../models/cliente.model.js';
import * as entrenadorModelo from '../models/entrenador.model.js';
import { validarAsignacion, validarEstadoAsignacion } from '../validators/asignacion.validator.js';
import { errorValidacion, errorNoEncontrado } from '../utils/errores.js';
import { errorClienteInactivo, errorEntrenadorInactivo } from '../utils/codigosError.js';
import { registrarAccion } from './auditoria.service.js';

const MODULO = 'asignaciones';

/**
 * Asigna un entrenador a un cliente activo (FR-005, FR-006, FR-007).
 * @param {Object} datos - `{ idCliente, idEntrenador, esPrincipal? }`.
 * @param {Object} usuario - Usuario autenticado.
 * @returns {Promise<Object>}
 */
export async function asignar(datos, usuario) {
  const errores = validarAsignacion(datos);
  if (errores.length > 0) {
    throw errorValidacion('Revise los datos enviados.', errores);
  }

  const idCliente = Number(datos.idCliente);
  const idEntrenador = Number(datos.idEntrenador);

  const cliente = await clienteModelo.buscarPorId(idCliente);
  if (!cliente) {
    throw errorNoEncontrado('Cliente no encontrado.');
  }
  if (cliente.estado !== 'activo') {
    throw errorClienteInactivo();
  }

  const entrenador = await entrenadorModelo.buscarPorId(idEntrenador);
  if (!entrenador) {
    throw errorNoEncontrado('Entrenador no encontrado.');
  }
  if (entrenador.estado !== 'activo') {
    throw errorEntrenadorInactivo();
  }

  const esPrincipal =
    datos.esPrincipal === undefined || datos.esPrincipal === null || datos.esPrincipal === ''
      ? true
      : datos.esPrincipal === true || datos.esPrincipal === 'true';

  const id = await transaccion(async (conexion) => {
    if (esPrincipal) {
      await asignacionModelo.finalizarPrincipalesActivas(idCliente, conexion);
    }
    return asignacionModelo.crear({ idCliente, idEntrenador, esPrincipal }, conexion);
  });

  await registrarAccion({
    idUsuario: usuario?.id ?? null,
    accion: 'asignar_entrenador',
    modulo: MODULO,
    resultado: 'exito',
    descripcion: `Entrenador ${idEntrenador} asignado al cliente ${idCliente}`,
  });

  return asignacionModelo.buscarPorId(id);
}

/**
 * Lista asignaciones con filtros opcionales (FR-005, FR-008).
 * @param {Object} filtros - idEntrenador?, idCliente?, estado?.
 * @returns {Promise<Array>}
 */
export async function listarAsignaciones(filtros = {}) {
  return asignacionModelo.listar({
    idEntrenador: filtros.idEntrenador ? Number(filtros.idEntrenador) : undefined,
    idCliente: filtros.idCliente ? Number(filtros.idCliente) : undefined,
    estado: filtros.estado,
  });
}

/**
 * Obtiene una asignación por su identificador.
 * @returns {Promise<Object>}
 */
export async function obtenerAsignacion(id) {
  const asignacion = await asignacionModelo.buscarPorId(id);
  if (!asignacion) {
    throw errorNoEncontrado('Asignación no encontrada.');
  }
  return asignacion;
}

/**
 * Lista las asignaciones (clientes) de un entrenador (FR-008).
 * @param {number} idEntrenador
 * @returns {Promise<Array>}
 */
export async function listarPorEntrenador(idEntrenador) {
  const entrenador = await entrenadorModelo.buscarPorId(idEntrenador);
  if (!entrenador) {
    throw errorNoEncontrado('Entrenador no encontrado.');
  }
  return asignacionModelo.listarPorEntrenador(idEntrenador);
}

/**
 * Lista las asignaciones del entrenador autenticado (FR-008, US7).
 * @param {string} correo
 * @returns {Promise<Array>}
 */
export async function listarPropiasEntrenador(correo) {
  const entrenador = await entrenadorModelo.buscarPorCorreo(correo);
  if (!entrenador) {
    throw errorNoEncontrado('Entrenador no encontrado.');
  }
  return asignacionModelo.listarPorEntrenador(entrenador.id_entrenador);
}

/**
 * Finaliza una asignación (FR-008).
 * @param {number} id
 * @param {string} estado
 * @param {Object} usuario
 * @returns {Promise<Object>}
 */
export async function cambiarEstadoAsignacion(id, estado, usuario) {
  const errores = validarEstadoAsignacion(estado);
  if (errores.length > 0) {
    throw errorValidacion('Revise los datos enviados.', errores);
  }

  const asignacion = await asignacionModelo.buscarPorId(id);
  if (!asignacion) {
    throw errorNoEncontrado('Asignación no encontrada.');
  }

  await asignacionModelo.actualizarEstado(id, estado);
  await registrarAccion({
    idUsuario: usuario?.id ?? null,
    accion: 'cambiar_estado_asignacion',
    modulo: MODULO,
    resultado: 'exito',
    descripcion: `Asignación ${id} pasó a ${estado}`,
  });
  return asignacionModelo.buscarPorId(id);
}
