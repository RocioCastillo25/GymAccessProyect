// Controladores de autenticación (contrato en contracts/api-rest.md §1).

import { iniciarSesion } from '../services/auth.service.js';

export async function login(req, res, next) {
  try {
    const { correo, password } = req.body || {};
    const resultado = await iniciarSesion(correo, password);
    return res.status(200).json(resultado);
  } catch (error) {
    return next(error);
  }
}

export async function yo(req, res, next) {
  try {
    return res.status(200).json({ usuario: req.usuario });
  } catch (error) {
    return next(error);
  }
}
