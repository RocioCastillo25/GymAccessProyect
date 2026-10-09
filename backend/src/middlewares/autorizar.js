// Middleware de autorización por roles (FR-006, FR-013, SC-002).
// Siempre se valida en el backend: ocultar una opción en la interfaz no basta.

import { errorAutorizacion } from '../utils/errores.js';

/**
 * @param {...string} roles - Roles permitidos para la ruta.
 * @returns {Function} Middleware que responde 403 si el rol no está permitido.
 */
export function autorizar(...roles) {
  return (req, res, next) => {
    if (!req.usuario) {
      return next(errorAutorizacion('Debe iniciar sesión para realizar esta operación.'));
    }
    if (!roles.includes(req.usuario.rol)) {
      return next(errorAutorizacion());
    }
    return next();
  };
}
