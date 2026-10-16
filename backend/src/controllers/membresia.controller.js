// Controladores de membresías (contracts/api-rest.md §2).

import {
  asignar,
  listarMembresias,
  obtenerMembresia,
  cambiarEstadoMembresia,
  obtenerMembresiaPropia,
} from '../services/membresia.service.js';
import {
  presentarMembresia,
  presentarListaMembresias,
} from '../presenters/membresia.presentador.js';

export async function crear(req, res, next) {
  try {
    const membresia = await asignar(req.body, req.usuario);
    return res.status(201).json({
      mensaje: 'Membresía asignada correctamente.',
      membresia: presentarMembresia(membresia),
    });
  } catch (error) {
    return next(error);
  }
}

export async function listar(req, res, next) {
  try {
    const membresias = await listarMembresias();
    const lista = presentarListaMembresias(membresias);
    return res.status(200).json({ membresias: lista, total: lista.length });
  } catch (error) {
    return next(error);
  }
}

export async function obtener(req, res, next) {
  try {
    const id = Number(req.params.id);
    const membresia = await obtenerMembresia(id);
    return res.status(200).json({ membresia: presentarMembresia(membresia) });
  } catch (error) {
    return next(error);
  }
}

export async function cambiarEstado(req, res, next) {
  try {
    const id = Number(req.params.id);
    const membresia = await cambiarEstadoMembresia(id, req.body.estado, req.usuario);
    return res.status(200).json({
      mensaje: 'Estado de la membresía actualizado correctamente.',
      membresia: presentarMembresia(membresia),
    });
  } catch (error) {
    return next(error);
  }
}

export async function obtenerPropia(req, res, next) {
  try {
    const membresia = await obtenerMembresiaPropia(req.usuario.correo);
    return res.status(200).json({ membresia: presentarMembresia(membresia) });
  } catch (error) {
    return next(error);
  }
}
