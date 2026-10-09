// Cliente HTTP centralizado del frontend (investigación R4 y R6).
// Adjunta el token de sesión, centraliza la URL base y limpia la sesión ante un 401.

const CLAVE_TOKEN = 'gymaccess_token';
const CLAVE_USUARIO = 'gymaccess_usuario';

export function guardarSesion(token, usuario) {
  localStorage.setItem(CLAVE_TOKEN, token);
  localStorage.setItem(CLAVE_USUARIO, JSON.stringify(usuario));
}

export function obtenerToken() {
  return localStorage.getItem(CLAVE_TOKEN);
}

export function obtenerUsuarioGuardado() {
  const crudo = localStorage.getItem(CLAVE_USUARIO);
  if (!crudo) return null;
  try {
    return JSON.parse(crudo);
  } catch {
    return null;
  }
}

export function limpiarSesion() {
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem(CLAVE_USUARIO);
}

/**
 * Realiza una petición a la API REST.
 * @param {string} ruta - Ruta relativa, por ejemplo `/api/clientes`.
 * @param {Object} opciones - Opciones de fetch (method, body).
 * @returns {Promise<Object>} Cuerpo de la respuesta en JSON.
 * @throws {Error} Con `status` y `mensaje` legible en español.
 */
export async function pedir(ruta, opciones = {}) {
  const token = obtenerToken();
  const cabeceras = { 'Content-Type': 'application/json', ...(opciones.cabeceras || {}) };
  if (token) cabeceras.Authorization = `Bearer ${token}`;

  let respuesta;
  try {
    respuesta = await fetch(ruta, { ...opciones, headers: cabeceras });
  } catch {
    const error = new Error('No se pudo conectar con el servidor. Intente de nuevo.');
    error.status = 0;
    throw error;
  }

  let cuerpo = null;
  try {
    cuerpo = await respuesta.json();
  } catch {
    cuerpo = null;
  }

  if (respuesta.status === 401) {
    // La sesión ya no es válida: se limpia para volver a la pantalla de inicio.
    limpiarSesion();
    window.dispatchEvent(new CustomEvent('sesion-expirada'));
  }

  if (!respuesta.ok) {
    const error = new Error(cuerpo?.mensaje || 'Ocurrió un error inesperado.');
    error.status = respuesta.status;
    error.codigo = cuerpo?.codigo;
    error.errores = cuerpo?.errores;
    throw error;
  }

  return cuerpo;
}
