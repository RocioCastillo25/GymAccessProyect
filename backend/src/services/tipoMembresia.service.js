// Servicio de tipos de membresía (FR-001 a FR-004, FR-036).

import * as tipoModelo from '../models/tipoMembresia.model.js';
import {
  validarTipoMembresia,
  validarActualizacionTipoMembresia,
} from '../validators/tipoMembresia.validator.js';
import { validarEstado } from '../validators/validadoresComunes.js';
import { errorValidacion, errorDuplicado, errorNoEncontrado } from '../utils/errores.js';
import { registrarAccion } from './auditoria.service.js';

const MODULO = 'tipos_membresia';

function normalizar(datos = {}) {
  return {
    ...datos,
    nombre: typeof datos.nombre === 'string' ? datos.nombre.trim() : datos.nombre,
    descripcion:
      typeof datos.descripcion === 'string' ? datos.descripcion.trim() : datos.descripcion,
  };
}

/**
 * Crea un tipo de membresía (FR-001, FR-004).
 * @param {Object} datos - Cuerpo de la petición.
 * @param {Object} usuario - Usuario autenticado (`{ id }`).
 * @returns {Promise<Object>} Tipo creado.
 */
export async function crearTipo(datos, usuario) {
  const entrada = normalizar(datos);
  const errores = validarTipoMembresia(entrada);
  if (errores.length > 0) {
    throw errorValidacion('Revise los datos enviados.', errores);
  }

  const existente = await tipoModelo.buscarPorNombre(entrada.nombre);
  if (existente) {
    throw errorDuplicado('Ya existe un tipo de membresía con ese nombre.');
  }

  const id = await tipoModelo.crear({ ...entrada, estado: entrada.estado || 'activo' });
  await registrarAccion({
    idUsuario: usuario?.id ?? null,
    accion: 'crear_tipo_membresia',
    modulo: MODULO,
    resultado: 'exito',
    descripcion: `Tipo de membresía creado: ${entrada.nombre}`,
  });
  return tipoModelo.buscarPorId(id);
}

/**
 * Modifica un tipo de membresía existente (FR-003). Las membresías ya generadas
 * no se alteran porque guardan su propia referencia al tipo.
 * @param {number} id
 * @param {Object} datos - Campos a modificar.
 * @param {Object} usuario - Usuario autenticado (`{ id }`).
 * @returns {Promise<Object>} Tipo actualizado.
 */
export async function modificarTipo(id, datos, usuario) {
  const existente = await tipoModelo.buscarPorId(id);
  if (!existente) {
    throw errorNoEncontrado('Tipo de membresía no encontrado.');
  }

  const entrada = normalizar(datos);
  const errores = validarActualizacionTipoMembresia(entrada);
  if (errores.length > 0) {
    throw errorValidacion('Revise los datos enviados.', errores);
  }

  if (entrada.nombre && entrada.nombre !== existente.nombre) {
    const duplicado = await tipoModelo.buscarPorNombre(entrada.nombre);
    if (duplicado) {
      throw errorDuplicado('Ya existe un tipo de membresía con ese nombre.');
    }
  }

  const aGuardar = {};
  for (const campo of ['nombre', 'descripcion', 'duracion', 'precio']) {
    if (entrada[campo] !== undefined) aGuardar[campo] = entrada[campo];
  }

  await tipoModelo.actualizar(id, aGuardar);
  await registrarAccion({
    idUsuario: usuario?.id ?? null,
    accion: 'actualizar_tipo_membresia',
    modulo: MODULO,
    resultado: 'exito',
    descripcion: `Tipo de membresía actualizado: ${existente.nombre}`,
  });
  return tipoModelo.buscarPorId(id);
}

/**
 * Activa o desactiva un tipo para nuevas asignaciones (FR-004).
 * @returns {Promise<Object>} Tipo actualizado.
 */
export async function cambiarEstadoTipo(id, estado, usuario) {
  const errorEstado = validarEstado(estado);
  if (errorEstado) {
    throw errorValidacion('Revise los datos enviados.', [{ campo: 'estado', error: errorEstado }]);
  }

  const existente = await tipoModelo.buscarPorId(id);
  if (!existente) {
    throw errorNoEncontrado('Tipo de membresía no encontrado.');
  }

  await tipoModelo.actualizar(id, { estado });
  await registrarAccion({
    idUsuario: usuario?.id ?? null,
    accion: 'cambiar_estado_tipo_membresia',
    modulo: MODULO,
    resultado: 'exito',
    descripcion: `Tipo de membresía ${estado}: ${existente.nombre}`,
  });
  return tipoModelo.buscarPorId(id);
}

/**
 * Lista los tipos (los campos dependen del rol y se filtran en el presentador).
 * @returns {Promise<Array>}
 */
export async function listarTipos() {
  return tipoModelo.listar();
}

/**
 * Devuelve un tipo por su identificador (FR-002).
 * @returns {Promise<Object>}
 */
export async function obtenerTipo(id) {
  const tipo = await tipoModelo.buscarPorId(id);
  if (!tipo) {
    throw errorNoEncontrado('Tipo de membresía no encontrado.');
  }
  return tipo;
}
