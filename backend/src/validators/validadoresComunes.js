// Validaciones comunes reutilizables (FR-018, investigación R5).
// Son funciones puras: devuelven `null` cuando el valor es válido o un mensaje
// de error en español cuando no lo es. El backend es siempre la única autoridad.

export const LONGITUD_MINIMA_PASSWORD = 8;
export const LONGITUD_MAXIMA_CORREO = 150;

const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Valida el formato de un correo electrónico.
 * @returns {string|null} Mensaje de error o `null` si es válido.
 */
export function validarCorreo(correo) {
  if (typeof correo !== 'string' || correo.trim() === '') {
    return 'El correo es obligatorio.';
  }
  if (correo.length > LONGITUD_MAXIMA_CORREO) {
    return `El correo no puede superar ${LONGITUD_MAXIMA_CORREO} caracteres.`;
  }
  if (!PATRON_CORREO.test(correo.trim())) {
    return 'El correo no tiene un formato válido.';
  }
  return null;
}

/**
 * Valida la contraseña: mínimo 8 caracteres, sin exigir otros caracteres
 * (clarify 2026-10-09).
 * @returns {string|null} Mensaje de error o `null` si es válida.
 */
export function validarPassword(password) {
  if (typeof password !== 'string' || password === '') {
    return 'La contraseña es obligatoria.';
  }
  if (password.length < LONGITUD_MINIMA_PASSWORD) {
    return `La contraseña debe tener al menos ${LONGITUD_MINIMA_PASSWORD} caracteres.`;
  }
  return null;
}

/**
 * Valida un campo de texto obligatorio con longitud máxima.
 * @param {string} valor - Valor recibido.
 * @param {string} nombre - Nombre legible del campo para el mensaje.
 * @param {number} maxima - Longitud máxima permitida.
 * @returns {string|null}
 */
export function validarTextoObligatorio(valor, nombre, maxima = 100) {
  if (typeof valor !== 'string' || valor.trim() === '') {
    return `El campo ${nombre} es obligatorio.`;
  }
  if (valor.trim().length > maxima) {
    return `El campo ${nombre} no puede superar ${maxima} caracteres.`;
  }
  return null;
}

/**
 * Valida un campo opcional de texto con longitud máxima.
 * @returns {string|null}
 */
export function validarTextoOpcional(valor, nombre, maxima = 200) {
  if (valor === undefined || valor === null || valor === '') return null;
  if (typeof valor !== 'string') {
    return `El campo ${nombre} debe ser texto.`;
  }
  if (valor.trim().length > maxima) {
    return `El campo ${nombre} no puede superar ${maxima} caracteres.`;
  }
  return null;
}

/**
 * Valida un teléfono opcional: solo dígitos, espacios, guiones, paréntesis y `+`.
 * @returns {string|null}
 */
export function validarTelefono(telefono) {
  if (telefono === undefined || telefono === null || telefono === '') return null;
  if (!/^[+\d][\d\s()-]{5,29}$/.test(String(telefono).trim())) {
    return 'El teléfono no tiene un formato válido.';
  }
  return null;
}

/**
 * Valida un estado de usuario o cliente: únicamente `activo` o `inactivo`.
 * @returns {string|null}
 */
export function validarEstado(estado) {
  if (!['activo', 'inactivo'].includes(estado)) {
    return "El estado debe ser 'activo' o 'inactivo'.";
  }
  return null;
}

/**
 * Valida que el rol pertenezca a los cuatro roles definidos (FR-008).
 * @returns {string|null}
 */
export function validarRol(rol) {
  const rolesPermitidos = ['administrador', 'recepcionista', 'entrenador', 'cliente'];
  if (!rolesPermitidos.includes(rol)) {
    return `El rol debe ser uno de: ${rolesPermitidos.join(', ')}.`;
  }
  return null;
}

/**
 * Agrupa los resultados de varias validaciones.
 * @param {Object<string, string|null} resultados - Mapa campo → mensaje de error.
 * @returns {Array<{campo: string, error: string}>} Errores no nulos.
 */
export function recopilarErrores(resultados) {
  return Object.entries(resultados)
    .filter(([, error]) => error !== null)
    .map(([campo, error]) => ({ campo, error }));
}
