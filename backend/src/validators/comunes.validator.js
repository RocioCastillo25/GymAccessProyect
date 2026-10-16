// Validaciones comunes del Sprint 2 reutilizables por varias historias
// (FR-029, research R4/R8). Funciones puras: `null` si el valor es válido o un
// mensaje de error en español cuando no lo es.

export const LONGITUD_DESCRIPTOR_FACIAL = 128;
export const METODOS_PAGO = ['efectivo', 'tarjeta', 'transferencia'];
export const ESTADOS_PAGO = ['pendiente', 'completado', 'cancelado'];
export const ESTADOS_MEMBRESIA = ['activa', 'vencida', 'suspendida', 'cancelada'];
export const TIPOS_ACCESO = ['entrada', 'salida'];

/**
 * Valida un identificador entero positivo.
 * @returns {string|null}
 */
export function validarId(valor, nombre = 'identificador') {
  if (valor === undefined || valor === null || valor === '') {
    return `El campo ${nombre} es obligatorio.`;
  }
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) {
    return `El campo ${nombre} debe ser un número entero positivo.`;
  }
  return null;
}

/**
 * Valida un monto: número mayor que cero (FR-011).
 * @returns {string|null}
 */
export function validarMonto(monto) {
  if (monto === undefined || monto === null || monto === '') {
    return 'El monto es obligatorio.';
  }
  const numero = Number(monto);
  if (Number.isNaN(numero)) {
    return 'El monto debe ser un número.';
  }
  if (numero <= 0) {
    return 'El monto debe ser mayor que cero.';
  }
  return null;
}

/**
 * Valida una duración en días: entero mayor que cero (FR-004).
 * @returns {string|null}
 */
export function validarDuracion(duracion) {
  if (duracion === undefined || duracion === null || duracion === '') {
    return 'La duración es obligatoria.';
  }
  const numero = Number(duracion);
  if (!Number.isInteger(numero) || numero <= 0) {
    return 'La duración debe ser un número entero mayor que cero.';
  }
  return null;
}

/**
 * Valida un precio: número mayor o igual que cero (FR-004).
 * @returns {string|null}
 */
export function validarPrecio(precio) {
  if (precio === undefined || precio === null || precio === '') {
    return 'El precio es obligatorio.';
  }
  const numero = Number(precio);
  if (Number.isNaN(numero)) {
    return 'El precio debe ser un número.';
  }
  if (numero < 0) {
    return 'El precio no puede ser negativo.';
  }
  return null;
}

/**
 * Valida una fecha en formato ISO `YYYY-MM-DD` o un `Date` válido.
 * @returns {string|null}
 */
export function validarFecha(fecha, nombre = 'fecha') {
  if (fecha === undefined || fecha === null || fecha === '') {
    return `El campo ${nombre} es obligatorio.`;
  }
  const valor = fecha instanceof Date ? fecha : new Date(fecha);
  if (Number.isNaN(valor.getTime())) {
    return `El campo ${nombre} no tiene una fecha válida.`;
  }
  return null;
}

/**
 * Valida el método de pago contra el catálogo fijo (research R8).
 * @returns {string|null}
 */
export function validarMetodoPago(metodo) {
  if (!METODOS_PAGO.includes(metodo)) {
    return `El método de pago debe ser uno de: ${METODOS_PAGO.join(', ')}.`;
  }
  return null;
}

/**
 * Valida el estado de un pago (FR-011).
 * @returns {string|null}
 */
export function validarEstadoPago(estado) {
  if (!ESTADOS_PAGO.includes(estado)) {
    return `El estado del pago debe ser uno de: ${ESTADOS_PAGO.join(', ')}.`;
  }
  return null;
}

/**
 * Valida el estado de una membresía (FR-007).
 * @returns {string|null}
 */
export function validarEstadoMembresia(estado) {
  if (!ESTADOS_MEMBRESIA.includes(estado)) {
    return `El estado de la membresía debe ser uno de: ${ESTADOS_MEMBRESIA.join(', ')}.`;
  }
  return null;
}

/**
 * Valida el tipo de acceso (FR-024).
 * @returns {string|null}
 */
export function validarTipoAcceso(tipo) {
  if (!TIPOS_ACCESO.includes(tipo)) {
    return `El tipo de acceso debe ser uno de: ${TIPOS_ACCESO.join(', ')}.`;
  }
  return null;
}

/**
 * Valida el descriptor facial: arreglo numérico de exactamente 128 posiciones
 * generadas por el modelo en el navegador (FR-018, research R4).
 * @returns {string|null}
 */
export function validarDescriptorFacial(descriptor) {
  if (!Array.isArray(descriptor)) {
    return 'No se recibió una captura facial válida.';
  }
  if (descriptor.length !== LONGITUD_DESCRIPTOR_FACIAL) {
    return 'La captura facial no tiene el formato esperado.';
  }
  if (!descriptor.every((valor) => typeof valor === 'number' && Number.isFinite(valor))) {
    return 'La captura facial contiene valores no válidos.';
  }
  return null;
}

/**
 * Valida un texto obligatorio con longitud máxima (FR-023).
 * @returns {string|null}
 */
export function validarTextoObligatorio(valor, nombre, longitudMaxima) {
  if (valor === undefined || valor === null || String(valor).trim() === '') {
    return `El campo ${nombre} es obligatorio.`;
  }
  if (longitudMaxima && String(valor).length > longitudMaxima) {
    return `El campo ${nombre} no puede superar ${longitudMaxima} caracteres.`;
  }
  return null;
}

/**
 * Valida un texto opcional con longitud máxima. Ausente o vacío es válido.
 * @returns {string|null}
 */
export function validarTextoOpcional(valor, nombre, longitudMaxima) {
  if (valor === undefined || valor === null || String(valor).trim() === '') {
    return null;
  }
  if (longitudMaxima && String(valor).length > longitudMaxima) {
    return `El campo ${nombre} no puede superar ${longitudMaxima} caracteres.`;
  }
  return null;
}

/**
 * Valida un booleano (acepta `true`/`false` booleanos o en texto).
 * @returns {string|null}
 */
export function validarBooleano(valor, nombre) {
  if (typeof valor === 'boolean') return null;
  if (valor === 'true' || valor === 'false') return null;
  return `El campo ${nombre} debe ser verdadero o falso.`;
}

/**
 * Valida un entero mayor que cero (obligatorio).
 * @returns {string|null}
 */
export function validarEnteroPositivo(valor, nombre) {
  if (valor === undefined || valor === null || valor === '') {
    return `El campo ${nombre} es obligatorio.`;
  }
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero <= 0) {
    return `El campo ${nombre} debe ser un número entero mayor que cero.`;
  }
  return null;
}

/**
 * Valida un entero mayor o igual que cero (opcional).
 * @returns {string|null}
 */
export function validarEnteroNoNegativo(valor, nombre) {
  if (valor === undefined || valor === null || valor === '') return null;
  const numero = Number(valor);
  if (!Number.isInteger(numero) || numero < 0) {
    return `El campo ${nombre} debe ser un número entero mayor o igual que cero.`;
  }
  return null;
}

/**
 * Valida un número mayor o igual que cero (obligatorio).
 * @returns {string|null}
 */
export function validarNumeroPositivo(valor, nombre) {
  if (valor === undefined || valor === null || valor === '') {
    return `El campo ${nombre} es obligatorio.`;
  }
  const numero = Number(valor);
  if (Number.isNaN(numero)) {
    return `El campo ${nombre} debe ser un número.`;
  }
  if (numero < 0) {
    return `El campo ${nombre} no puede ser negativo.`;
  }
  return null;
}

/**
 * Valida un número mayor o igual que cero (opcional).
 * @returns {string|null}
 */
export function validarNumeroOpcional(valor, nombre) {
  if (valor === undefined || valor === null || valor === '') return null;
  const numero = Number(valor);
  if (Number.isNaN(numero)) {
    return `El campo ${nombre} debe ser un número.`;
  }
  if (numero < 0) {
    return `El campo ${nombre} no puede ser negativo.`;
  }
  return null;
}

/**
 * Valida un teléfono opcional (FR-023).
 * @returns {string|null}
 */
export function validarTelefono(valor) {
  if (valor === undefined || valor === null || String(valor).trim() === '') return null;
  if (!/^[0-9+\-() ]{5,30}$/.test(String(valor))) {
    return 'El teléfono no tiene un formato válido.';
  }
  return null;
}
