// Controladores de entrenadores (contracts/api-rest.md §1).

import {
  registrar,
  listarEntrenadores,
  obtenerEntrenador,
  obtenerEntrenadorPropio,
  actualizarEntrenador,
  cambiarEstadoEntrenador,
} from '../services/entrenador.service.js';
import {
  presentarEntrenador,
  presentarListaEntrenadores,
} from '../presenters/entrenador.presentador.js';

export async function crear(req, res, next) {
  try {
    const entrenador = await registrar(req.body, req.usuario);
    return res.status(201).json({
      mensaje: 'Entrenador registrado correctamente.',
      entrenador: presentarEntrenador(entrenador),
    });
  } catch (error) {
    return next(error);
  }
}

export async function listar(req, res, next) {
  try {
    const entrenadores = await listarEntrenadores();
    const lista = presentarListaEntrenadores(entrenadores);
    return res.status(200).json({ entrenadores: lista, total: lista.length });
  } catch (error) {
    return next(error);
  }
}

export async function obtener(req, res, next) {
  try {
    const entrenador = await obtenerEntrenador(Number(req.params.id));
    return res.status(200).json({ entrenador: presentarEntrenador(entrenador) });
  } catch (error) {
    return next(error);
  }
}

export async function obtenerPropio(req, res, next) {
  try {
    const entrenador = await obtenerEntrenadorPropio(req.usuario.correo);
    return res.status(200).json({ entrenador: presentarEntrenador(entrenador) });
  } catch (error) {
    return next(error);
  }
}

export async function actualizar(req, res, next) {
  try {
    const entrenador = await actualizarEntrenador(Number(req.params.id), req.body, req.usuario);
    return res.status(200).json({
      mensaje: 'Entrenador actualizado correctamente.',
      entrenador: presentarEntrenador(entrenador),
    });
  } catch (error) {
    return next(error);
  }
}

export async function cambiarEstado(req, res, next) {
  try {
    const entrenador = await cambiarEstadoEntrenador(
      Number(req.params.id),
      req.body.estado,
      req.usuario
    );
    return res.status(200).json({
      mensaje: 'Estado del entrenador actualizado correctamente.',
      entrenador: presentarEntrenador(entrenador),
    });
  } catch (error) {
    return next(error);
  }
}
