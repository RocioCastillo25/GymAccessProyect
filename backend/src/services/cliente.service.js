// Servicio de clientes (FR-014, FR-018, FR-020).

import * as clienteModelo from '../models/cliente.model.js';
import {
  validarCliente,
  validarActualizacionCliente,
} from '../validators/cliente.validator.js';
import { errorValidacion, errorDuplicado, errorNoEncontrado } from '../utils/errores.js';

function normalizar(datos = {}) {
  return {
    ...datos,
    nombre: typeof datos.nombre === 'string' ? datos.nombre.trim() : datos.nombre,
    apellido: typeof datos.apellido === 'string' ? datos.apellido.trim() : datos.apellido,
    correo:
      typeof datos.correo === 'string' ? datos.correo.trim().toLowerCase() : datos.correo,
    telefono: datos.telefono ? String(datos.telefono).trim() : datos.telefono,
    direccion: datos.direccion ? String(datos.direccion).trim() : datos.direccion,
  };
}

/**
 * Registra un cliente nuevo con sus validaciones.
 * @param {Object} datos - Cuerpo de la petición.
 * @returns {Promise<Object>} Cliente creado (sin datos internos).
 */
export async function registrarCliente(datos) {
  const entrada = normalizar(datos);
  const errores = validarCliente(entrada);
  if (errores.length > 0) {
    throw errorValidacion('Revise los datos enviados.', errores);
  }

  const existente = await clienteModelo.buscarPorCorreo(entrada.correo);
  if (existente) {
    throw errorDuplicado('El correo ya está registrado.');
  }

  const id = await clienteModelo.crear({ ...entrada, estado: entrada.estado || 'activo' });
  return clienteModelo.buscarPorId(id);
}

/**
 * Modifica los datos de un cliente existente (FR-015, FR-018).
 * Conserva `fecha_registro` y `id_cliente`; el correo duplicado se rechaza.
 * @param {number} id - Cliente a modificar.
 * @param {Object} datos - Cuerpo de la petición.
 * @returns {Promise<Object>} Cliente actualizado.
 */
export async function modificarCliente(id, datos) {
  const existente = await clienteModelo.buscarPorId(id);
  if (!existente) {
    throw errorNoEncontrado('Cliente no encontrado.');
  }

  const entrada = normalizar(datos);
  const errores = validarActualizacionCliente(entrada);
  if (errores.length > 0) {
    throw errorValidacion('Revise los datos enviados.', errores);
  }

  if (entrada.correo && entrada.correo !== existente.correo) {
    const duplicado = await clienteModelo.buscarPorCorreo(entrada.correo);
    if (duplicado) throw errorDuplicado('El correo ya está registrado.');
  }

  const aGuardar = {};
  for (const campo of ['nombre', 'apellido', 'correo', 'telefono', 'direccion', 'estado']) {
    if (entrada[campo] !== undefined && entrada[campo] !== '') {
      aGuardar[campo] = entrada[campo];
    }
  }

  await clienteModelo.actualizar(id, aGuardar);
  return clienteModelo.buscarPorId(id);
}

/**
 * Lista los clientes con los campos permitidos para el rol (FR-016).
 * El entrenador únicamente recibe nombre, apellido y estado (clarify 2026-10-09).
 * @param {Object} usuario - Usuario autenticado (`{ rol }`).
 * @returns {Promise<Array>}
 */
export async function listarClientes(usuario) {
  const columnas =
    usuario.rol === 'entrenador'
      ? clienteModelo.COLUMNAS_CLIENTE_ENTRENADOR
      : clienteModelo.COLUMNAS_CLIENTE;
  return clienteModelo.listar(columnas);
}

/**
 * Devuelve un cliente con los campos permitidos para el rol (FR-016).
 * @param {number} id
 * @param {Object} usuario - Usuario autenticado.
 * @returns {Promise<Object>}
 */
export async function obtenerCliente(id, usuario) {
  const columnas =
    usuario.rol === 'entrenador'
      ? clienteModelo.COLUMNAS_CLIENTE_ENTRENADOR
      : clienteModelo.COLUMNAS_CLIENTE;

  const cliente = await clienteModelo.buscarPorId(id, columnas);
  if (!cliente) {
    throw errorNoEncontrado('Cliente no encontrado.');
  }
  return cliente;
}

export { normalizar as normalizarCliente };
