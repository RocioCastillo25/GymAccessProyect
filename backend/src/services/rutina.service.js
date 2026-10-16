// Servicio de rutinas y ejercicios (FR-009 a FR-012, FR-031).

import { transaccion } from '../config/baseDatos.js';
import * as rutinaModelo from '../models/rutina.model.js';
import * as clienteModelo from '../models/cliente.model.js';
import * as entrenadorModelo from '../models/entrenador.model.js';
import * as asignacionModelo from '../models/asignacionEntrenador.model.js';
import {
  validarRutina,
  validarActualizacionRutina,
  validarEjercicios,
} from '../validators/rutina.validator.js';
import { errorValidacion, errorNoEncontrado, errorAutorizacion } from '../utils/errores.js';
import { errorEntrenadorNoAsignado, errorSinRutina } from '../utils/codigosError.js';
import { registrarAccion } from './auditoria.service.js';

const MODULO = 'rutinas';

async function entrenadorAutenticado(correo) {
  const entrenador = await entrenadorModelo.buscarPorCorreo(correo);
  if (!entrenador) {
    throw errorNoEncontrado('Entrenador no encontrado.');
  }
  return entrenador;
}

async function rutinaConEjercicios(id) {
  const rutina = await rutinaModelo.buscarPorId(id);
  if (!rutina) return null;
  const ejercicios = await rutinaModelo.listarEjercicios(id);
  return { ...rutina, ejercicios };
}

/**
 * Crea una rutina con ejercicios para un cliente a cargo del entrenador
 * (FR-009, FR-011, FR-012). La rutina activa anterior pasa a `archivada` (FR-031).
 * @param {Object} datos - `{ idCliente, nombre, descripcion?, ejercicios? }`.
 * @param {Object} usuario - Entrenador autenticado.
 * @returns {Promise<Object>}
 */
export async function crearRutina(datos, usuario) {
  const errores = validarRutina(datos);
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

  const id = await transaccion(async (conexion) => {
    await rutinaModelo.archivarActivasPorCliente(idCliente, conexion);
    const idRutina = await rutinaModelo.crear(
      {
        idCliente,
        idEntrenador: entrenador.id_entrenador,
        nombre: datos.nombre,
        descripcion: datos.descripcion,
      },
      conexion
    );
    await rutinaModelo.crearEjercicios(idRutina, datos.ejercicios ?? [], conexion);
    return idRutina;
  });

  await registrarAccion({
    idUsuario: usuario?.id ?? null,
    accion: 'crear_rutina',
    modulo: MODULO,
    resultado: 'exito',
    descripcion: `Rutina ${id} creada para el cliente ${idCliente}`,
  });

  return rutinaConEjercicios(id);
}

/**
 * Lista rutinas con filtros (FR-009).
 * @param {Object} filtros - idCliente?, idEntrenador?, estado?.
 * @returns {Promise<Array>}
 */
export async function listarRutinas(filtros = {}) {
  return rutinaModelo.listar({
    idCliente: filtros.idCliente ? Number(filtros.idCliente) : undefined,
    idEntrenador: filtros.idEntrenador ? Number(filtros.idEntrenador) : undefined,
    estado: filtros.estado,
  });
}

/**
 * Obtiene una rutina con sus ejercicios.
 * @returns {Promise<Object>}
 */
export async function obtenerRutina(id) {
  const rutina = await rutinaConEjercicios(id);
  if (!rutina) {
    throw errorNoEncontrado('Rutina no encontrada.');
  }
  return rutina;
}

/**
 * Lista las rutinas (historial) de un cliente (FR-010).
 * @returns {Promise<Array>}
 */
export async function listarRutinasDeCliente(idCliente) {
  return rutinaModelo.listarPorCliente(idCliente);
}

/**
 * Devuelve la rutina vigente del cliente autenticado con sus ejercicios (FR-017).
 * @param {string} correo
 * @returns {Promise<Object>}
 */
export async function obtenerRutinaPropia(correo) {
  const cliente = await clienteModelo.buscarPorCorreo(correo);
  if (!cliente) {
    throw errorNoEncontrado('Cliente no encontrado.');
  }
  const rutina = await rutinaModelo.buscarActivaPorCliente(cliente.id_cliente);
  if (!rutina) {
    throw errorSinRutina();
  }
  const ejercicios = await rutinaModelo.listarEjercicios(rutina.id_rutina);
  return { ...rutina, ejercicios };
}

/**
 * Modifica el nombre y/o la descripción de una rutina propia del entrenador (FR-012).
 * @returns {Promise<Object>}
 */
export async function actualizarRutina(id, datos, usuario) {
  const errores = validarActualizacionRutina(datos);
  if (errores.length > 0) {
    throw errorValidacion('Revise los datos enviados.', errores);
  }

  const rutina = await rutinaModelo.buscarPorId(id);
  if (!rutina) {
    throw errorNoEncontrado('Rutina no encontrada.');
  }

  const entrenador = await entrenadorAutenticado(usuario.correo);
  if (rutina.id_entrenador !== entrenador.id_entrenador) {
    throw errorAutorizacion('La rutina no pertenece a su carga.');
  }

  await rutinaModelo.actualizar(id, { nombre: datos.nombre, descripcion: datos.descripcion });
  await registrarAccion({
    idUsuario: usuario?.id ?? null,
    accion: 'actualizar_rutina',
    modulo: MODULO,
    resultado: 'exito',
    descripcion: `Rutina ${id} actualizada`,
  });
  return rutinaConEjercicios(id);
}

/**
 * Reemplaza la lista de ejercicios de una rutina propia del entrenador.
 * @returns {Promise<Object>}
 */
export async function reemplazarEjercicios(id, datos, usuario) {
  const errores = validarEjercicios(datos);
  if (errores.length > 0) {
    throw errorValidacion('Revise los datos enviados.', errores);
  }

  const rutina = await rutinaModelo.buscarPorId(id);
  if (!rutina) {
    throw errorNoEncontrado('Rutina no encontrada.');
  }

  const entrenador = await entrenadorAutenticado(usuario.correo);
  if (rutina.id_entrenador !== entrenador.id_entrenador) {
    throw errorAutorizacion('La rutina no pertenece a su carga.');
  }

  await transaccion(async (conexion) => {
    await rutinaModelo.eliminarEjercicios(id, conexion);
    await rutinaModelo.crearEjercicios(id, datos.ejercicios, conexion);
  });

  await registrarAccion({
    idUsuario: usuario?.id ?? null,
    accion: 'reemplazar_ejercicios',
    modulo: MODULO,
    resultado: 'exito',
    descripcion: `Ejercicios de la rutina ${id} reemplazados`,
  });
  return rutinaConEjercicios(id);
}
