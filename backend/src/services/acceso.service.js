// Servicio de control de acceso: identificación facial, validación de membresía
// y registro de intentos (FR-018 a FR-027).

import * as accesoModelo from '../models/acceso.model.js';
import * as rostroModelo from '../models/rostro.model.js';
import * as clienteModelo from '../models/cliente.model.js';
import * as membresiaModelo from '../models/membresia.model.js';
import {
  validarDescriptorFacial,
  validarFecha,
  validarId,
  validarTipoAcceso,
} from '../validators/comunes.validator.js';
import { errorDescriptorInvalido } from '../utils/codigosError.js';
import { errorNoEncontrado, errorValidacion } from '../utils/errores.js';
import { distanciaEuclidea, mejorCoincidencia } from '../utils/distanciaFacial.js';
import { config } from '../config/entorno.js';
import { registrarAccion } from './auditoria.service.js';

const MODULO = 'accesos';
const RESULTADOS = ['autorizado', 'rechazado'];

// Se conserva el nombre anterior como alias para no romper importaciones existentes.
export const distanciaEuclidiana = distanciaEuclidea;

function validarFiltros(filtros = {}) {
  const limpios = {};

  if (filtros.resultado) {
    if (!RESULTADOS.includes(filtros.resultado)) {
      throw errorValidacion('Revise los datos enviados.', [
        {
          campo: 'resultado',
          error: `El resultado debe ser uno de: ${RESULTADOS.join(', ')}.`,
        },
      ]);
    }
    limpios.resultado = filtros.resultado;
  }

  if (filtros.idCliente !== undefined && filtros.idCliente !== '') {
    const errorId = validarId(filtros.idCliente, 'idCliente');
    if (errorId) {
      throw errorValidacion('Revise los datos enviados.', [{ campo: 'idCliente', error: errorId }]);
    }
    limpios.idCliente = Number(filtros.idCliente);
  }

  for (const campo of ['desde', 'hasta']) {
    if (filtros[campo]) {
      const errorFecha = validarFecha(filtros[campo], campo);
      if (errorFecha) {
        throw errorValidacion('Revise los datos enviados.', [{ campo, error: errorFecha }]);
      }
      limpios[campo] = filtros[campo];
    }
  }

  return limpios;
}

function motivoMembresia(ultima) {
  if (!ultima) return 'El cliente no tiene una membresía registrada.';
  const membresia = membresiaModelo.conVigencia(ultima);
  if (membresia.estado === 'vencida') return 'La membresía está vencida.';
  if (membresia.estado === 'suspendida') return 'La membresía está suspendida.';
  if (membresia.estado === 'cancelada') return 'La membresía está cancelada.';
  return 'La membresía no está vigente.';
}

/**
 * Identifica al cliente por su descriptor facial y valida su membresía.
 * Todo intento se registra, autorizado o rechazado (FR-024).
 * @param {Object} datos - `{ descriptorFacial, tipo? }`.
 * @param {Object} usuario - Usuario autenticado.
 * @returns {Promise<Object>}
 */
export async function validarAcceso(datos, usuario) {
  const errorDescriptor = validarDescriptorFacial(datos.descriptorFacial);
  if (errorDescriptor) {
    throw errorDescriptorInvalido(errorDescriptor);
  }

  const tipo = datos.tipo ?? 'entrada';
  const errorTipo = validarTipoAcceso(tipo);
  if (errorTipo) {
    throw errorValidacion('Revise los datos enviados.', [{ campo: 'tipo', error: errorTipo }]);
  }

  const rostros = await rostroModelo.listarActivos();
  const candidatos = rostros.map((rostro) => ({
    idCliente: rostro.id_cliente,
    descriptorFacial: rostro.descriptor_facial,
  }));
  const mejor = mejorCoincidencia(
    datos.descriptorFacial,
    candidatos,
    config.facial.umbral
  );

  let cliente = null;
  let membresia = null;
  let motivo = 'Rostro no reconocido.';
  let resultado = 'rechazado';

  if (mejor && mejor.distancia <= config.facial.umbral) {
    cliente = await clienteModelo.buscarPorId(mejor.idCliente);
    if (!cliente) {
      motivo = 'Cliente no encontrado.';
    } else if (cliente.estado !== 'activo') {
      motivo = 'El cliente está inactivo.';
    } else {
      const vigente = await membresiaModelo.buscarVigentePorCliente(cliente.id_cliente);
      if (vigente) {
        resultado = 'autorizado';
        membresia = vigente;
        motivo = null;
      } else {
        const ultima = await membresiaModelo.buscarUltimaPorCliente(cliente.id_cliente);
        motivo = motivoMembresia(ultima);
      }
    }
  }

  const idAcceso = await accesoModelo.crear({
    idCliente: cliente?.id_cliente ?? null,
    tipo,
    resultado,
    motivoRechazo: motivo,
  });
  const acceso = await accesoModelo.buscarPorId(idAcceso);

  await registrarAccion({
    idUsuario: usuario?.id ?? null,
    accion: 'validar_acceso',
    modulo: MODULO,
    resultado: resultado === 'autorizado' ? 'exito' : 'error',
    descripcion: cliente
      ? `Acceso ${resultado} para el cliente ${cliente.id_cliente}`
      : 'Intento de acceso con rostro no reconocido',
  });

  return { resultado, cliente, membresia, motivo, acceso };
}

/**
 * Lista accesos con filtros (FR-026).
 * @param {Object} filtros
 * @returns {Promise<Array>}
 */
export async function listarAccesos(filtros) {
  return accesoModelo.listar(validarFiltros(filtros));
}

/**
 * Devuelve un acceso por identificador.
 * @param {number} id
 * @returns {Promise<Object>}
 */
export async function obtenerAcceso(id) {
  const numero = Number(id);
  const errorId = validarId(numero, 'id');
  if (errorId) {
    throw errorValidacion('Revise los datos enviados.', [{ campo: 'id', error: errorId }]);
  }

  const acceso = await accesoModelo.buscarPorId(numero);
  if (!acceso) {
    throw errorNoEncontrado('Acceso no encontrado.');
  }
  return acceso;
}

/**
 * Lista el historial propio de un cliente (FR-027).
 * @param {string} correo
 * @returns {Promise<Array>}
 */
export async function listarAccesosPropios(correo) {
  const cliente = await clienteModelo.buscarPorCorreo(correo);
  if (!cliente) {
    throw errorNoEncontrado('Cliente no encontrado.');
  }
  return accesoModelo.listarPorCliente(cliente.id_cliente);
}
