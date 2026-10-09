// Controladores de clientes (contracts/api-rest.md §3).
// Las respuestas usan el presentador para exponer el identificador como `id`.

import {
  registrarCliente,
  modificarCliente,
  listarClientes,
  obtenerCliente,
} from '../services/cliente.service.js';
import { consultar } from '../config/baseDatos.js';
import { errorNoEncontrado } from '../utils/errores.js';
import {
  presentarCliente,
  presentarListaClientes,
} from '../presenters/cliente.presentador.js';

export async function crear(req, res, next) {
  try {
    const cliente = await registrarCliente(req.body);
    return res.status(201).json({
      mensaje: 'Cliente registrado correctamente.',
      cliente: presentarCliente(cliente),
    });
  } catch (error) {
    return next(error);
  }
}

export async function modificar(req, res, next) {
  try {
    const id = Number(req.params.id);
    const cliente = await modificarCliente(id, req.body);
    return res.status(200).json({
      mensaje: 'Cliente actualizado correctamente.',
      cliente: presentarCliente(cliente),
    });
  } catch (error) {
    return next(error);
  }
}

export async function listar(req, res, next) {
  try {
    const clientes = await listarClientes(req.usuario);
    const lista = presentarListaClientes(clientes);
    return res.status(200).json({ clientes: lista, total: lista.length });
  } catch (error) {
    return next(error);
  }
}

export async function obtener(req, res, next) {
  try {
    const id = Number(req.params.id);
    const cliente = await obtenerCliente(id, req.usuario);
    return res.status(200).json({ cliente: presentarCliente(cliente) });
  } catch (error) {
    return next(error);
  }
}

export async function obtenerPropio(req, res, next) {
  try {
    // Un usuario con rol cliente corresponde a un registro de `clientes` con el
    // mismo correo (ambos son únicos en el sistema). FR-017, RN-14.
    const filas = await consultar('SELECT id_cliente FROM clientes WHERE correo = ? LIMIT 1;', [
      req.usuario.correo,
    ]);
    if (filas.length === 0) {
      throw errorNoEncontrado('Cliente no encontrado.');
    }
    const cliente = await obtenerCliente(filas[0].id_cliente, req.usuario);
    return res.status(200).json({ cliente: presentarCliente(cliente) });
  } catch (error) {
    return next(error);
  }
}
