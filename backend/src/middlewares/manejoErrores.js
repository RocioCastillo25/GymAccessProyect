// Manejo centralizado de errores (FR-034, investigación R10).
// Nunca se envían stack traces, nombres de tablas ni credenciales al cliente.

import { ErrorAplicacion, errorInterno, errorNoEncontrado } from '../utils/errores.js';

// Middleware de ruta no encontrada (404 con el formato estándar).
export function recursoNoEncontrado(req, res) {
  res.status(404).json(errorNoEncontrado('La ruta solicitada no existe.').aRespuesta());
}

// Middleware final de errores: centraliza la traducción a JSON.
export function manejarErrores(error, req, res, next) {
  if (res.headersSent) return next(error);

  if (error instanceof ErrorAplicacion) {
    return res.status(error.estado).json(error.aRespuesta());
  }

  // Errores de MySQL por clave duplicada (código 1062).
  if (error && error.code === 'ER_DUP_ENTRY') {
    return res
      .status(409)
      .json({ mensaje: 'El registro ya existe.', codigo: 'DUPLICADO' });
  }

  // Error de clave foránea: se referencia un registro inexistente (FR-029).
  if (error && (error.code === 'ER_NO_REFERENCED_ROW_2' || error.code === 'ER_NO_REFERENCED_ROW')) {
    return res.status(400).json({
      mensaje: 'Los datos hacen referencia a un registro que no existe.',
      codigo: 'VALIDACION',
    });
  }

  // Error de restricción: se intenta borrar un registro con historial (FR-014, FR-025).
  if (error && (error.code === 'ER_ROW_IS_REFERENCED_2' || error.code === 'ER_ROW_IS_REFERENCED')) {
    return res.status(409).json({
      mensaje: 'El registro tiene información relacionada y no puede eliminarse.',
      codigo: 'DUPLICADO',
    });
  }

  // Cualquier otro fallo: se registra solo en el servidor y se responde genérico.
  console.error(
    `[${new Date().toISOString()}] [error] ${req.method} ${req.originalUrl}:`,
    error
  );
  const interno = errorInterno();
  return res.status(500).json(interno.aRespuesta());
}
