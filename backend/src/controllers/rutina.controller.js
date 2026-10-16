// Controladores de rutinas y ejercicios (contracts/api-rest.md §3).

import {
  crearRutina,
  listarRutinas,
  obtenerRutina,
  listarRutinasDeCliente,
  obtenerRutinaPropia,
  actualizarRutina,
  reemplazarEjercicios,
} from '../services/rutina.service.js';
import {
  presentarRutina,
  presentarListaRutinas,
} from '../presenters/rutina.presentador.js';

export async function crear(req, res, next) {
  try {
    const rutina = await crearRutina(req.body, req.usuario);
    return res.status(201).json({
      mensaje: 'Rutina creada correctamente.',
      rutina: presentarRutina(rutina, rutina.ejercicios),
    });
  } catch (error) {
    return next(error);
  }
}

export async function listar(req, res, next) {
  try {
    const rutinas = await listarRutinas(req.query);
    const lista = presentarListaRutinas(rutinas);
    return res.status(200).json({ rutinas: lista, total: lista.length });
  } catch (error) {
    return next(error);
  }
}

export async function obtener(req, res, next) {
  try {
    const rutina = await obtenerRutina(Number(req.params.id));
    return res.status(200).json({ rutina: presentarRutina(rutina, rutina.ejercicios) });
  } catch (error) {
    return next(error);
  }
}

export async function listarDeCliente(req, res, next) {
  try {
    const rutinas = await listarRutinasDeCliente(Number(req.params.idCliente));
    const lista = presentarListaRutinas(rutinas);
    return res.status(200).json({ rutinas: lista, total: lista.length });
  } catch (error) {
    return next(error);
  }
}

export async function obtenerPropia(req, res, next) {
  try {
    const rutina = await obtenerRutinaPropia(req.usuario.correo);
    return res.status(200).json({ rutina: presentarRutina(rutina, rutina.ejercicios) });
  } catch (error) {
    return next(error);
  }
}

export async function actualizar(req, res, next) {
  try {
    const rutina = await actualizarRutina(Number(req.params.id), req.body, req.usuario);
    return res.status(200).json({
      mensaje: 'Rutina actualizada correctamente.',
      rutina: presentarRutina(rutina, rutina.ejercicios),
    });
  } catch (error) {
    return next(error);
  }
}

export async function actualizarEjercicios(req, res, next) {
  try {
    const rutina = await reemplazarEjercicios(Number(req.params.id), req.body, req.usuario);
    return res.status(200).json({
      mensaje: 'Ejercicios de la rutina actualizados correctamente.',
      rutina: presentarRutina(rutina, rutina.ejercicios),
    });
  } catch (error) {
    return next(error);
  }
}
