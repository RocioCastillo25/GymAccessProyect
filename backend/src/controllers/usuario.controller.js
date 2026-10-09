// Controladores de usuarios (contracts/api-rest.md §2).
// Las respuestas usan el presentador para exponer el identificador como `id`.

import {
  crearUsuario,
  listarUsuarios,
  obtenerUsuario,
  modificarUsuario,
  restablecerPassword,
  asignarRol,
  cambiarEstado,
} from '../services/usuario.service.js';
import {
  presentarUsuario,
  presentarListaUsuarios,
} from '../presenters/usuario.presentador.js';

export async function listar(req, res, next) {
  try {
    const usuarios = await listarUsuarios();
    const lista = presentarListaUsuarios(usuarios);
    return res.status(200).json({ usuarios: lista, total: lista.length });
  } catch (error) {
    return next(error);
  }
}

export async function obtener(req, res, next) {
  try {
    const usuario = await obtenerUsuario(Number(req.params.id));
    return res.status(200).json({ usuario: presentarUsuario(usuario) });
  } catch (error) {
    return next(error);
  }
}

export async function crear(req, res, next) {
  try {
    const usuario = await crearUsuario(req.body);
    return res
      .status(201)
      .json({ mensaje: 'Usuario creado correctamente.', usuario: presentarUsuario(usuario) });
  } catch (error) {
    return next(error);
  }
}

export async function modificar(req, res, next) {
  try {
    const id = Number(req.params.id);
    const usuario = await modificarUsuario(id, req.body);
    return res
      .status(200)
      .json({ mensaje: 'Usuario actualizado correctamente.', usuario: presentarUsuario(usuario) });
  } catch (error) {
    return next(error);
  }
}

export async function cambiarPassword(req, res, next) {
  try {
    const id = Number(req.params.id);
    await restablecerPassword(id, req.body?.password);
    return res.status(200).json({ mensaje: 'Contraseña actualizada correctamente.' });
  } catch (error) {
    return next(error);
  }
}

export async function cambiarRol(req, res, next) {
  try {
    const id = Number(req.params.id);
    const usuario = await asignarRol(id, req.body?.rol);
    return res
      .status(200)
      .json({ mensaje: 'Rol actualizado correctamente.', usuario: presentarUsuario(usuario) });
  } catch (error) {
    return next(error);
  }
}

export async function cambiarEstadoUsuario(req, res, next) {
  try {
    const id = Number(req.params.id);
    const usuario = await cambiarEstado(id, req.body?.estado);
    return res
      .status(200)
      .json({ mensaje: 'Estado actualizado correctamente.', usuario: presentarUsuario(usuario) });
  } catch (error) {
    return next(error);
  }
}
