// Servicio de membresías (FR-005 a FR-010, FR-036).

import * as membresiaModelo from '../models/membresia.model.js';
import * as clienteModelo from '../models/cliente.model.js';
import * as tipoModelo from '../models/tipoMembresia.model.js';
import { validarAsignacion } from '../validators/membresia.validator.js';
import { validarEstadoMembresia } from '../validators/comunes.validator.js';
import { errorValidacion, errorNoEncontrado } from '../utils/errores.js';
import { registrarAccion } from './auditoria.service.js';
import { hoyIso, sumarDias } from '../utils/fechas.js';

const MODULO = 'membresias';

/**
 * Asigna una membresía a un cliente existente con un tipo activo (FR-005, FR-006).
 * Calcula `fecha_inicio = hoy` y `fecha_fin = hoy + duracion`.
 * @param {Object} datos - `{ idCliente, idTipoMembresia }`.
 * @param {Object} usuario - Usuario autenticado (`{ id }`).
 * @returns {Promise<Object>} Membresía creada.
 */
export async function asignar(datos, usuario) {
  const errores = validarAsignacion(datos);
  if (errores.length > 0) {
    throw errorValidacion('Revise los datos enviados.', errores);
  }

  const idCliente = Number(datos.idCliente);
  const idTipoMembresia = Number(datos.idTipoMembresia);

  const cliente = await clienteModelo.buscarPorId(idCliente);
  if (!cliente) {
    throw errorNoEncontrado('Cliente no encontrado.');
  }

  const tipo = await tipoModelo.buscarPorId(idTipoMembresia);
  if (!tipo) {
    throw errorNoEncontrado('Tipo de membresía no encontrado.');
  }
  if (tipo.estado !== 'activo') {
    throw errorValidacion('Revise los datos enviados.', [
      { campo: 'idTipoMembresia', error: 'El tipo de membresía está inactivo.' },
    ]);
  }

  const fechaInicio = hoyIso();
  const fechaFin = sumarDias(fechaInicio, tipo.duracion);

  const id = await membresiaModelo.crear({ idCliente, idTipoMembresia, fechaInicio, fechaFin });
  await registrarAccion({
    idUsuario: usuario?.id ?? null,
    accion: 'asignar_membresia',
    modulo: MODULO,
    resultado: 'exito',
    descripcion: `Membresía asignada al cliente ${idCliente} (tipo ${idTipoMembresia})`,
  });
  return membresiaModelo.buscarPorId(id);
}

/**
 * Lista todas las membresías (FR-010).
 * @returns {Promise<Array>}
 */
export async function listarMembresias() {
  return membresiaModelo.listar();
}

/**
 * Devuelve una membresía por su identificador (FR-010).
 * @returns {Promise<Object>}
 */
export async function obtenerMembresia(id) {
  const membresia = await membresiaModelo.buscarPorId(id);
  if (!membresia) {
    throw errorNoEncontrado('Membresía no encontrada.');
  }
  return membresia;
}

/**
 * Suspende, cancela o reactiva una membresía (FR-007).
 * @param {number} id
 * @param {string} estado - `activa`, `suspendida` o `cancelada`.
 * @param {Object} usuario - Usuario autenticado (`{ id }`).
 * @returns {Promise<Object>} Membresía actualizada.
 */
export async function cambiarEstadoMembresia(id, estado, usuario) {
  const errorEstado = validarEstadoMembresia(estado);
  if (errorEstado) {
    throw errorValidacion('Revise los datos enviados.', [{ campo: 'estado', error: errorEstado }]);
  }

  const membresia = await membresiaModelo.buscarPorId(id);
  if (!membresia) {
    throw errorNoEncontrado('Membresía no encontrada.');
  }

  await membresiaModelo.actualizarEstado(id, estado);
  await registrarAccion({
    idUsuario: usuario?.id ?? null,
    accion: 'cambiar_estado_membresia',
    modulo: MODULO,
    resultado: 'exito',
    descripcion: `Membresía ${id} pasó a ${estado}`,
  });
  return membresiaModelo.buscarPorId(id);
}

/**
 * Devuelve la membresía propia del usuario con rol cliente (FR-009).
 * @param {string} correo - Correo del usuario autenticado.
 * @returns {Promise<Object>}
 */
export async function obtenerMembresiaPropia(correo) {
  const cliente = await clienteModelo.buscarPorCorreo(correo);
  if (!cliente) {
    throw errorNoEncontrado('Cliente no encontrado.');
  }

  const vigente = await membresiaModelo.buscarVigentePorCliente(cliente.id_cliente);
  if (vigente) return membresiaModelo.conVigencia(vigente);

  const ultima = await membresiaModelo.buscarUltimaPorCliente(cliente.id_cliente);
  if (!ultima) {
    throw errorNoEncontrado('No tiene una membresía registrada.');
  }
  return membresiaModelo.conVigencia(ultima);
}
