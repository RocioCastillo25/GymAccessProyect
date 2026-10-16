// Controladores de tipos de membresía (contracts/api-rest.md §1).

import {
  crearTipo,
  modificarTipo,
  cambiarEstadoTipo,
  listarTipos,
  obtenerTipo,
} from '../services/tipoMembresia.service.js';
import {
  presentarTipoMembresia,
  presentarListaTiposMembresia,
} from '../presenters/tipoMembresia.presentador.js';

export async function crear(req, res, next) {
  try {
    const tipo = await crearTipo(req.body, req.usuario);
    return res.status(201).json({
      mensaje: 'Tipo de membresía creado correctamente.',
      tipoMembresia: presentarTipoMembresia(tipo, req.usuario.rol),
    });
  } catch (error) {
    return next(error);
  }
}

export async function modificar(req, res, next) {
  try {
    const id = Number(req.params.id);
    const tipo = await modificarTipo(id, req.body, req.usuario);
    return res.status(200).json({
      mensaje: 'Tipo de membresía actualizado correctamente.',
      tipoMembresia: presentarTipoMembresia(tipo, req.usuario.rol),
    });
  } catch (error) {
    return next(error);
  }
}

export async function cambiarEstado(req, res, next) {
  try {
    const id = Number(req.params.id);
    const tipo = await cambiarEstadoTipo(id, req.body.estado, req.usuario);
    return res.status(200).json({
      mensaje: 'Estado del tipo de membresía actualizado correctamente.',
      tipoMembresia: presentarTipoMembresia(tipo, req.usuario.rol),
    });
  } catch (error) {
    return next(error);
  }
}

export async function listar(req, res, next) {
  try {
    const tipos = await listarTipos();
    const lista = presentarListaTiposMembresia(tipos, req.usuario.rol);
    return res.status(200).json({ tiposMembresia: lista, total: lista.length });
  } catch (error) {
    return next(error);
  }
}

export async function obtener(req, res, next) {
  try {
    const id = Number(req.params.id);
    const tipo = await obtenerTipo(id);
    return res
      .status(200)
      .json({ tipoMembresia: presentarTipoMembresia(tipo, req.usuario.rol) });
  } catch (error) {
    return next(error);
  }
}
