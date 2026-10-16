// Controladores de objetivos (contracts/api-rest.md §3.1).

import {
  crearObjetivo,
  listarObjetivos,
  listarObjetivosDeCliente,
  listarObjetivosPropios,
  cambiarEstadoObjetivo,
} from '../services/objetivo.service.js';
import {
  presentarObjetivo,
  presentarListaObjetivos,
} from '../presenters/objetivo.presentador.js';

export async function crear(req, res, next) {
  try {
    const objetivo = await crearObjetivo(req.body, req.usuario);
    return res.status(201).json({
      mensaje: 'Objetivo registrado correctamente.',
      objetivo: presentarObjetivo(objetivo),
    });
  } catch (error) {
    return next(error);
  }
}

export async function listar(req, res, next) {
  try {
    const objetivos = await listarObjetivos(req.query);
    const lista = presentarListaObjetivos(objetivos);
    return res.status(200).json({ objetivos: lista, total: lista.length });
  } catch (error) {
    return next(error);
  }
}

export async function listarDeCliente(req, res, next) {
  try {
    const objetivos = await listarObjetivosDeCliente(Number(req.params.idCliente));
    const lista = presentarListaObjetivos(objetivos);
    return res.status(200).json({ objetivos: lista, total: lista.length });
  } catch (error) {
    return next(error);
  }
}

export async function listarPropios(req, res, next) {
  try {
    const objetivos = await listarObjetivosPropios(req.usuario.correo);
    const lista = presentarListaObjetivos(objetivos);
    return res.status(200).json({ objetivos: lista, total: lista.length });
  } catch (error) {
    return next(error);
  }
}

export async function cambiarEstado(req, res, next) {
  try {
    const objetivo = await cambiarEstadoObjetivo(
      Number(req.params.id),
      req.body.estado,
      req.usuario
    );
    return res.status(200).json({
      mensaje: 'Estado del objetivo actualizado correctamente.',
      objetivo: presentarObjetivo(objetivo),
    });
  } catch (error) {
    return next(error);
  }
}
