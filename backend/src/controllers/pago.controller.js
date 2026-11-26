// Controladores de pagos (contracts/api-rest.md §3).

import {
  registrar,
  listarPagos,
  listarPagosPropios,
  obtenerAdeudos,
  obtenerAdeudosPropios,
} from '../services/pago.service.js';
import { presentarPago, presentarListaPagos } from '../presenters/pago.presentador.js';

export async function crear(req, res, next) {
  try {
    const pago = await registrar(req.body, req.usuario);
    return res.status(201).json({
      mensaje: 'Pago registrado correctamente.',
      pago: presentarPago(pago),
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/pagos: historial general (005-FR-001).
 * @param {Object} req - Petición con `req.query` ya validada por el servicio.
 * @param {Object} res - Respuesta Express.
 * @param {Function} next - Manejador centralizado de errores.
 */
export async function listar(req, res, next) {
  try {
    const resultado = await listarPagos(req.query);
    return res.status(200).json({
      ...resultado,
      pagos: presentarListaPagos(resultado.pagos),
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/pagos/mios: historial del cliente autenticado (005-FR-002).
 * @param {Object} req - Petición con `req.usuario.correo` y `req.query`.
 * @param {Object} res - Respuesta Express.
 * @param {Function} next - Manejador centralizado de errores.
 */
export async function listarPropios(req, res, next) {
  try {
    const resultado = await listarPagosPropios(req.usuario.correo, req.query);
    return res.status(200).json({
      ...resultado,
      pagos: presentarListaPagos(resultado.pagos),
    });
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/pagos/adeudos: adeudos agrupados por cliente (005-FR-009).
 * @param {Object} req - Petición con `req.query`.
 * @param {Object} res - Respuesta Express.
 * @param {Function} next - Manejador centralizado de errores.
 */
export async function listarAdeudos(req, res, next) {
  try {
    const resultado = await obtenerAdeudos(req.query);
    return res.status(200).json(resultado);
  } catch (error) {
    return next(error);
  }
}

/**
 * GET /api/pagos/adeudos/mios: adeudo del cliente autenticado (005-FR-010).
 * @param {Object} req - Petición con `req.usuario.correo` y `req.query`.
 * @param {Object} res - Respuesta Express.
 * @param {Function} next - Manejador centralizado de errores.
 */
export async function listarAdeudosPropios(req, res, next) {
  try {
    const resultado = await obtenerAdeudosPropios(req.usuario.correo, req.query);
    return res.status(200).json(resultado);
  } catch (error) {
    return next(error);
  }
}
