// Servicio de rostros: registro y actualización de descriptores faciales
// (FR-016 a FR-020). El descriptor nunca sale del backend.

import * as rostroModelo from '../models/rostro.model.js';
import * as clienteModelo from '../models/cliente.model.js';
import { validarDescriptorFacial, validarId } from '../validators/comunes.validator.js';
import { errorDescriptorInvalido, errorRostroYaRegistrado } from '../utils/codigosError.js';
import { errorNoEncontrado, errorValidacion } from '../utils/errores.js';
import { registrarAccion } from './auditoria.service.js';

const MODULO = 'rostros';

function validarDatos(idCliente, descriptorFacial) {
  const errores = [];
  const errorId = validarId(idCliente, 'idCliente');
  if (errorId) errores.push({ campo: 'idCliente', error: errorId });

  const errorDescriptor = validarDescriptorFacial(descriptorFacial);
  if (errorDescriptor) {
    throw errorDescriptorInvalido(errorDescriptor);
  }

  if (errores.length > 0) {
    throw errorValidacion('Revise los datos enviados.', errores);
  }
}

async function exigirCliente(idCliente) {
  const cliente = await clienteModelo.buscarPorId(idCliente);
  if (!cliente) {
    throw errorNoEncontrado('Cliente no encontrado.');
  }
  return cliente;
}

/**
 * Registra el rostro de un cliente existente (FR-016, FR-017).
 * @param {Object} datos - `{ idCliente, descriptorFacial }`.
 * @param {Object} usuario - Usuario autenticado.
 * @returns {Promise<Object>} Rostro registrado sin descriptor.
 */
export async function registrar(datos, usuario) {
  const idCliente = Number(datos.idCliente);
  validarDatos(idCliente, datos.descriptorFacial);
  await exigirCliente(idCliente);

  const existente = await rostroModelo.buscarPorCliente(idCliente);
  if (existente) {
    throw errorRostroYaRegistrado();
  }

  try {
    await rostroModelo.crear({ idCliente, descriptorFacial: datos.descriptorFacial });
  } catch (error) {
    if (error?.code === 'ER_DUP_ENTRY') {
      throw errorRostroYaRegistrado();
    }
    throw error;
  }

  await registrarAccion({
    idUsuario: usuario?.id ?? null,
    accion: 'registrar_rostro',
    modulo: MODULO,
    resultado: 'exito',
    descripcion: `Rostro registrado para el cliente ${idCliente}`,
  });

  return rostroModelo.buscarPorCliente(idCliente);
}

/**
 * Actualiza el rostro existente de un cliente (FR-017).
 * @param {number} idCliente
 * @param {Array<number>} descriptorFacial
 * @param {Object} usuario
 * @returns {Promise<Object>} Rostro actualizado sin descriptor.
 */
export async function actualizar(idCliente, descriptorFacial, usuario) {
  const id = Number(idCliente);
  validarDatos(id, descriptorFacial);
  await exigirCliente(id);

  const existente = await rostroModelo.buscarPorCliente(id);
  if (!existente) {
    throw errorNoEncontrado('El cliente no tiene información facial registrada.');
  }

  await rostroModelo.actualizar(id, descriptorFacial);
  await registrarAccion({
    idUsuario: usuario?.id ?? null,
    accion: 'actualizar_rostro',
    modulo: MODULO,
    resultado: 'exito',
    descripcion: `Rostro actualizado para el cliente ${id}`,
  });

  return rostroModelo.buscarPorCliente(id);
}

/**
 * Indica si un cliente tiene rostro registrado, sin exponer el descriptor (FR-020).
 * @param {number} idCliente
 * @returns {Promise<Object>}
 */
export async function obtenerEstado(idCliente) {
  const id = Number(idCliente);
  const errorId = validarId(id, 'idCliente');
  if (errorId) {
    throw errorValidacion('Revise los datos enviados.', [{ campo: 'idCliente', error: errorId }]);
  }

  await exigirCliente(id);
  const rostro = await rostroModelo.buscarPorCliente(id);
  return {
    idCliente: id,
    tieneRostro: Boolean(rostro),
    fechaRegistro: rostro?.fecha_registro ?? null,
  };
}
