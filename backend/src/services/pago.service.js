// Servicio de pagos (FR-011 a FR-015, FR-036).

import * as pagoModelo from '../models/pago.model.js';
import * as clienteModelo from '../models/cliente.model.js';
import * as membresiaModelo from '../models/membresia.model.js';
import { validarPago } from '../validators/pago.validator.js';
import { errorValidacion, errorDuplicado, errorNoEncontrado } from '../utils/errores.js';
import { registrarAccion } from './auditoria.service.js';

const MODULO = 'pagos';

/**
 * Registra un pago asociado a un cliente y, opcionalmente, a una membresía del
 * mismo cliente (FR-011, FR-014). Evita duplicar un pago completado.
 * @param {Object} datos - `{ idCliente, idMembresia?, monto, metodoPago, estado? }`.
 * @param {Object} usuario - Usuario autenticado (`{ id }`).
 * @returns {Promise<Object>} Pago creado.
 */
export async function registrar(datos, usuario) {
  const errores = validarPago(datos);
  if (errores.length > 0) {
    throw errorValidacion('Revise los datos enviados.', errores);
  }

  const idCliente = Number(datos.idCliente);
  const cliente = await clienteModelo.buscarPorId(idCliente);
  if (!cliente) {
    throw errorNoEncontrado('Cliente no encontrado.');
  }

  const idMembresia = datos.idMembresia ? Number(datos.idMembresia) : null;
  if (idMembresia) {
    const membresia = await membresiaModelo.buscarPorId(idMembresia);
    if (!membresia) {
      throw errorNoEncontrado('Membresía no encontrada.');
    }
    if (membresia.id_cliente !== idCliente) {
      throw errorValidacion('Revise los datos enviados.', [
        { campo: 'idMembresia', error: 'La membresía no pertenece al cliente.' },
      ]);
    }
  }

  const estado = datos.estado || 'completado';
  const monto = Number(datos.monto);

  if (estado === 'completado' && idMembresia) {
    const duplicado = await pagoModelo.existePagoCompletado(idCliente, idMembresia, monto);
    if (duplicado) {
      throw errorDuplicado('Ya existe un pago completado para esa membresía y monto.');
    }
  }

  const id = await pagoModelo.crear({
    idCliente,
    idMembresia,
    monto,
    metodoPago: datos.metodoPago,
    estado,
  });

  await registrarAccion({
    idUsuario: usuario?.id ?? null,
    accion: 'registrar_pago',
    modulo: MODULO,
    resultado: 'exito',
    descripcion: `Pago de ${monto} registrado para el cliente ${idCliente}`,
  });

  return pagoModelo.buscarPorId(id);
}
