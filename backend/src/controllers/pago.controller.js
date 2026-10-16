// Controladores de pagos (contracts/api-rest.md §3).

import { registrar } from '../services/pago.service.js';
import { presentarPago } from '../presenters/pago.presentador.js';

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
