// Middleware de autenticación (FR-003, FR-004).
// Verifica el token JWT en el backend: sin token, con token expirado o manipulado
// la petición se rechaza con 401.

import jwt from 'jsonwebtoken';
import { config } from '../config/entorno.js';
import { errorToken } from '../utils/errores.js';

export function autenticar(req, res, next) {
  const cabecera = req.headers.authorization || '';
  const [esquema, token] = cabecera.split(' ');

  if (esquema !== 'Bearer' || !token) {
    return next(errorToken('Se requiere iniciar sesión para acceder a este recurso.'));
  }

  try {
    const payload = jwt.verify(token, config.jwt.secreto);
    req.usuario = {
      id: payload.sub,
      nombre: payload.nombre,
      correo: payload.correo,
      rol: payload.rol,
    };
    return next();
  } catch (error) {
    const mensaje =
      error.name === 'TokenExpiredError'
        ? 'La sesión ha expirado. Inicie sesión de nuevo.'
        : 'La sesión no es válida o ha expirado.';
    return next(errorToken(mensaje));
  }
}
