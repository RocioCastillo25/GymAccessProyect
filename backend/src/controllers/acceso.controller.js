// Controladores de control de acceso (contracts/api-rest.md §4 bis y §4.1).

import {
  validarAcceso,
  listarAccesos,
  obtenerAcceso,
  listarAccesosPropios,
} from '../services/acceso.service.js';
import {
  presentarAcceso,
  presentarListaAccesos,
  presentarListaAccesosEntrenador,
  presentarResultadoValidacion,
} from '../presenters/acceso.presentador.js';

export async function validar(req, res, next) {
  try {
    const resultado = await validarAcceso(req.body, req.usuario);
    return res.status(200).json(presentarResultadoValidacion(resultado));
  } catch (error) {
    return next(error);
  }
}

export async function listar(req, res, next) {
  try {
    const accesos = await listarAccesos(req.query);
    const lista =
      req.usuario.rol === 'entrenador'
        ? presentarListaAccesosEntrenador(accesos)
        : presentarListaAccesos(accesos);
    return res.status(200).json({ accesos: lista, total: lista.length });
  } catch (error) {
    return next(error);
  }
}

export async function obtener(req, res, next) {
  try {
    const acceso = await obtenerAcceso(Number(req.params.id));
    return res.status(200).json({ acceso: presentarAcceso(acceso) });
  } catch (error) {
    return next(error);
  }
}

export async function obtenerPropios(req, res, next) {
  try {
    const accesos = await listarAccesosPropios(req.usuario.correo);
    const lista = presentarListaAccesos(accesos);
    return res.status(200).json({ accesos: lista, total: lista.length });
  } catch (error) {
    return next(error);
  }
}
