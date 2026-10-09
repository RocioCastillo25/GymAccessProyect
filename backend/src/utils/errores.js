// Errores de la aplicación con el formato de contracts/formato-errores.md (FR-034).

export class ErrorAplicacion extends Error {
  /**
   * @param {number} estado - Código HTTP de la respuesta.
   * @param {string} mensaje - Mensaje claro en español para la persona usuaria.
   * @param {string} codigo - Identificador estable del error (ej. VALIDACION).
   * @param {Array} errores - Lista opcional de errores por campo.
   */
  constructor(estado, mensaje, codigo, errores = undefined) {
    super(mensaje);
    this.estado = estado;
    this.mensaje = mensaje;
    this.codigo = codigo;
    this.errores = errores;
    this.esErrorAplicacion = true;
  }

  aRespuesta() {
    const cuerpo = { mensaje: this.mensaje, codigo: this.codigo };
    if (this.errores) cuerpo.errores = this.errores;
    return cuerpo;
  }
}

export const errorValidacion = (mensaje, errores) =>
  new ErrorAplicacion(400, mensaje, 'VALIDACION', errores);

export const errorAutenticacion = (mensaje = 'Credenciales incorrectas.') =>
  new ErrorAplicacion(401, mensaje, 'AUTENTICACION');

export const errorToken = (mensaje = 'La sesión no es válida o ha expirado.') =>
  new ErrorAplicacion(401, mensaje, 'AUTENTICACION');

export const errorAutorizacion = (
  mensaje = 'No tiene permisos para realizar esta operación.'
) => new ErrorAplicacion(403, mensaje, 'AUTORIZACION');

export const errorNoEncontrado = (mensaje = 'El recurso solicitado no existe.') =>
  new ErrorAplicacion(404, mensaje, 'NO_ENCONTRADO');

export const errorDuplicado = (mensaje = 'El correo ya está registrado.') =>
  new ErrorAplicacion(409, mensaje, 'DUPLICADO');

export const errorInterno = (
  mensaje = 'Ocurrió un error inesperado. Intente de nuevo.'
) => new ErrorAplicacion(500, mensaje, 'ERROR_INTERNO');

export const errorServicio = (
  mensaje = 'Servicio no disponible.'
) => new ErrorAplicacion(503, mensaje, 'SERVICIO_NO_DISPONIBLE');
