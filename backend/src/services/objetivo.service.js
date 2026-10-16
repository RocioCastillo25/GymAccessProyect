// Servicio de objetivos de entrenamiento (FR-013, FR-016, FR-030).

import * as objetivoModelo from '../models/objetivoEntrenamiento.model.js';
import * as clienteModelo from '../models/cliente.model.js';
import * as entrenadorModelo from '../models/entrenador.model.js';
import * as asignacionModelo from '../models/asignacionEntrenador.model.js';
import { validarObjetivo, ESTADOS_OBJETIVO } from '../validators/objetivo.validator.js';
import { errorValidacion, errorNoEncontrado } from '../utils/errores.js';
import { errorEntrenadorNoAsignado } from '../utils/codigosError.js';
import { registrarAccion } from './auditoria.service.js';

const MODULO = 'objetivos';

async function entrenadorAutenticado(correo) {
  const entrenador = await entrenadorModelo.buscarPorCorreo(correo);
  if (!entrenador) {
    throw errorNoEncontrado('Entrenador no encontrado.');
  }
  return entrenador;
}

/**
 * Registra un objetivo para un cliente a cargo del entrenador (FR-013, FR-016).
 * @param {Object} datos
 * @param {Object} usuario - Entrenador autenticado.
 * @returns {Promise<Object>}
 */
export async function crearObjetivo(datos, usuario) {
  const errores = validarObjetivo(datos);
  if (errores.length > 0) {
    throw errorValidacion('Revise los datos enviados.', errores);
  }

  const entrenador = await entrenadorAutenticado(usuario.correo);
  const idCliente = Number(datos.idCliente);

  const cliente = await clienteModelo.buscarPorId(idCliente);
  if (!cliente) {
    throw errorNoEncontrado('Cliente no encontrado.');
  }

  const asignacion = await asignacionModelo.buscarActiva(idCliente, entrenador.id_entrenador);
  if (!asignacion) {
    throw errorEntrenadorNoAsignado();
  }

  const id = await objetivoModelo.crear({
    idCliente,
    idEntrenador: entrenador.id_entrenador,
    descripcion: datos.descripcion,
    valorObjetivo: datos.valorObjetivo,
    unidad: datos.unidad,
    fechaObjetivo: datos.fechaObjetivo ?? null,
  });

  await registrarAccion({
    idUsuario: usuario?.id ?? null,
    accion: 'crear_objetivo',
    modulo: MODULO,
    resultado: 'exito',
    descripcion: `Objetivo ${id} registrado para el cliente ${idCliente}`,
  });

  return objetivoModelo.buscarPorId(id);
}

/**
 * Lista objetivos con filtros (FR-013).
 * @param {Object} filtros - idCliente?, estado?.
 * @returns {Promise<Array>}
 */
export async function listarObjetivos(filtros = {}) {
  return objetivoModelo.listar({
    idCliente: filtros.idCliente ? Number(filtros.idCliente) : undefined,
    estado: filtros.estado,
  });
}

/**
 * Lista los objetivos de un cliente.
 * @returns {Promise<Array>}
 */
export async function listarObjetivosDeCliente(idCliente) {
  return objetivoModelo.listarPorCliente(idCliente);
}

/**
 * Devuelve los objetivos del cliente autenticado (FR-017).
 * @param {string} correo
 * @returns {Promise<Array>}
 */
export async function listarObjetivosPropios(correo) {
  const cliente = await clienteModelo.buscarPorCorreo(correo);
  if (!cliente) {
    throw errorNoEncontrado('Cliente no encontrado.');
  }
  return objetivoModelo.listarPorCliente(cliente.id_cliente);
}

/**
 * Cambia el estado de un objetivo del entrenador (FR-013).
 * @returns {Promise<Object>}
 */
export async function cambiarEstadoObjetivo(id, estado, usuario) {
  if (!ESTADOS_OBJETIVO.includes(estado)) {
    throw errorValidacion('Revise los datos enviados.', [
      { campo: 'estado', error: `El estado del objetivo debe ser uno de: ${ESTADOS_OBJETIVO.join(', ')}.` },
    ]);
  }

  const objetivo = await objetivoModelo.buscarPorId(id);
  if (!objetivo) {
    throw errorNoEncontrado('Objetivo no encontrado.');
  }

  const entrenador = await entrenadorAutenticado(usuario.correo);
  if (objetivo.id_entrenador !== entrenador.id_entrenador) {
    throw errorEntrenadorNoAsignado('El objetivo no pertenece a su carga.');
  }

  await objetivoModelo.actualizarEstado(id, estado);
  await registrarAccion({
    idUsuario: usuario?.id ?? null,
    accion: 'cambiar_estado_objetivo',
    modulo: MODULO,
    resultado: 'exito',
    descripcion: `Objetivo ${id} pasó a ${estado}`,
  });
  return objetivoModelo.buscarPorId(id);
}
