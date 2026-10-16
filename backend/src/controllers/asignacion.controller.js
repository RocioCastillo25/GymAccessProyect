// Controladores de asignaciones de entrenador (contracts/api-rest.md §2).

import {
  asignar,
  listarAsignaciones,
  obtenerAsignacion,
  listarPorEntrenador,
  listarPropiasEntrenador,
  cambiarEstadoAsignacion,
} from '../services/asignacion.service.js';
import {
  presentarAsignacion,
  presentarListaAsignaciones,
} from '../presenters/asignacion.presentador.js';

export async function crear(req, res, next) {
  try {
    const asignacion = await asignar(req.body, req.usuario);
    return res.status(201).json({
      mensaje: 'Entrenador asignado correctamente.',
      asignacion: presentarAsignacion(asignacion),
    });
  } catch (error) {
    return next(error);
  }
}

export async function listar(req, res, next) {
  try {
    const asignaciones = await listarAsignaciones(req.query);
    const lista = presentarListaAsignaciones(asignaciones);
    return res.status(200).json({ asignaciones: lista, total: lista.length });
  } catch (error) {
    return next(error);
  }
}

export async function obtener(req, res, next) {
  try {
    const asignacion = await obtenerAsignacion(Number(req.params.id));
    return res.status(200).json({ asignacion: presentarAsignacion(asignacion) });
  } catch (error) {
    return next(error);
  }
}

export async function listarDeEntrenador(req, res, next) {
  try {
    const asignaciones = await listarPorEntrenador(Number(req.params.idEntrenador));
    const lista = presentarListaAsignaciones(asignaciones);
    return res.status(200).json({ asignaciones: lista, total: lista.length });
  } catch (error) {
    return next(error);
  }
}

export async function listarPropias(req, res, next) {
  try {
    const asignaciones = await listarPropiasEntrenador(req.usuario.correo);
    const lista = presentarListaAsignaciones(asignaciones);
    return res.status(200).json({ asignaciones: lista, total: lista.length });
  } catch (error) {
    return next(error);
  }
}

export async function cambiarEstado(req, res, next) {
  try {
    const asignacion = await cambiarEstadoAsignacion(
      Number(req.params.id),
      req.body.estado,
      req.usuario
    );
    return res.status(200).json({
      mensaje: 'Estado de la asignación actualizado correctamente.',
      asignacion: presentarAsignacion(asignacion),
    });
  } catch (error) {
    return next(error);
  }
}
