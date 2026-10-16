// Controladores de progresos (contracts/api-rest.md §3.1 bis).

import {
  registrarProgreso,
  listarProgresos,
  listarProgresosDeCliente,
  listarProgresosPropios,
} from '../services/progreso.service.js';
import {
  presentarProgreso,
  presentarListaProgresos,
} from '../presenters/objetivo.presentador.js';

export async function crear(req, res, next) {
  try {
    const progreso = await registrarProgreso(req.body, req.usuario);
    return res.status(201).json({
      mensaje: 'Progreso registrado correctamente.',
      progreso: presentarProgreso(progreso),
    });
  } catch (error) {
    return next(error);
  }
}

export async function listar(req, res, next) {
  try {
    const progresos = await listarProgresos(req.query);
    const lista = presentarListaProgresos(progresos);
    return res.status(200).json({ progresos: lista, total: lista.length });
  } catch (error) {
    return next(error);
  }
}

export async function listarDeCliente(req, res, next) {
  try {
    const progresos = await listarProgresosDeCliente(Number(req.params.idCliente));
    const lista = presentarListaProgresos(progresos);
    return res.status(200).json({ progresos: lista, total: lista.length });
  } catch (error) {
    return next(error);
  }
}

export async function listarPropios(req, res, next) {
  try {
    const progresos = await listarProgresosPropios(req.usuario.correo);
    const lista = presentarListaProgresos(progresos);
    return res.status(200).json({ progresos: lista, total: lista.length });
  } catch (error) {
    return next(error);
  }
}
