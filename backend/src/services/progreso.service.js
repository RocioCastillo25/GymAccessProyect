// Servicio de progresos del cliente (FR-014, FR-015, FR-016, FR-030).

import * as progresoModelo from '../models/progresoCliente.model.js';
import * as objetivoModelo from '../models/objetivoEntrenamiento.model.js';
import * as clienteModelo from '../models/cliente.model.js';
import * as entrenadorModelo from '../models/entrenador.model.js';
import * as asignacionModelo from '../models/asignacionEntrenador.model.js';
import { validarProgreso } from '../validators/progreso.validator.js';
import { errorValidacion, errorNoEncontrado } from '../utils/errores.js';
import { errorEntrenadorNoAsignado } from '../utils/codigosError.js';
import { registrarAccion } from './auditoria.service.js';

const MODULO = 'progresos';

async function entrenadorAutenticado(correo) {
  const entrenador = await entrenadorModelo.buscarPorCorreo(correo);
  if (!entrenador) {
    throw errorNoEncontrado('Entrenador no encontrado.');
  }
  return entrenador;
}

/**
 * Registra un progreso para un cliente a cargo del entrenador (FR-014, FR-015).
 * @param {Object} datos - `{ idCliente, idObjetivo?, valor, unidad?, observaciones? }`.
 * @param {Object} usuario - Entrenador autenticado.
 * @returns {Promise<Object>}
 */
export async function registrarProgreso(datos, usuario) {
  const errores = validarProgreso(datos);
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

  let idObjetivo = null;
  if (datos.idObjetivo !== undefined && datos.idObjetivo !== null && datos.idObjetivo !== '') {
    idObjetivo = Number(datos.idObjetivo);
    const objetivo = await objetivoModelo.buscarPorId(idObjetivo);
    if (!objetivo) {
      throw errorNoEncontrado('Objetivo no encontrado.');
    }
    if (objetivo.id_cliente !== idCliente) {
      throw errorNoEncontrado('El objetivo no pertenece al cliente indicado.');
    }
  }

  const id = await progresoModelo.crear({
    idCliente,
    idEntrenador: entrenador.id_entrenador,
    idObjetivo,
    valor: Number(datos.valor),
    unidad: datos.unidad,
    observaciones: datos.observaciones,
  });

  await registrarAccion({
    idUsuario: usuario?.id ?? null,
    accion: 'registrar_progreso',
    modulo: MODULO,
    resultado: 'exito',
    descripcion: `Progreso registrado para el cliente ${idCliente}`,
  });

  return progresoModelo.buscarPorId(id);
}

/**
 * Lista progresos con filtros (FR-015).
 * @param {Object} filtros - idCliente?, idObjetivo?.
 * @returns {Promise<Array>}
 */
export async function listarProgresos(filtros = {}) {
  return progresoModelo.listar({
    idCliente: filtros.idCliente ? Number(filtros.idCliente) : undefined,
    idObjetivo: filtros.idObjetivo ? Number(filtros.idObjetivo) : undefined,
  });
}

/**
 * Lista los progresos de un cliente en orden cronológico (FR-015).
 * @returns {Promise<Array>}
 */
export async function listarProgresosDeCliente(idCliente) {
  return progresoModelo.listarPorCliente(idCliente);
}

/**
 * Devuelve el progreso del cliente autenticado (FR-017).
 * @param {string} correo
 * @returns {Promise<Array>}
 */
export async function listarProgresosPropios(correo) {
  const cliente = await clienteModelo.buscarPorCorreo(correo);
  if (!cliente) {
    throw errorNoEncontrado('Cliente no encontrado.');
  }
  return progresoModelo.listarPorCliente(cliente.id_cliente);
}
