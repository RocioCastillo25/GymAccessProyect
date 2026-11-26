// Controladores de rostros (contracts/api-rest.md §4).

import { registrar, actualizar, obtenerEstado } from '../services/rostro.service.js';
import { presentarRostro } from '../presenters/rostro.presentador.js';

export async function crear(req, res, next) {
  try {
    const rostro = await registrar(req.body, req.usuario);
    return res.status(201).json({
      mensaje: 'Información facial registrada correctamente.',
      rostro: presentarRostro(rostro),
    });
  } catch (error) {
    return next(error);
  }
}

export async function modificar(req, res, next) {
  try {
    const rostro = await actualizar(
      Number(req.params.idCliente),
      req.body.descriptorFacial,
      req.usuario
    );
    return res.status(200).json({
      mensaje: 'Información facial actualizada correctamente.',
      rostro: presentarRostro(rostro),
    });
  } catch (error) {
    return next(error);
  }
}

export async function estado(req, res, next) {
  try {
    const resultado = await obtenerEstado(Number(req.params.idCliente));
    return res.status(200).json({
      idCliente: resultado.idCliente,
      tieneRostro: resultado.tieneRostro,
      fechaRegistro:
        resultado.fechaRegistro instanceof Date
          ? resultado.fechaRegistro.toISOString()
          : resultado.fechaRegistro,
    });
  } catch (error) {
    return next(error);
  }
}
