// Utilidades de fechas para membresías y accesos (Sprint 2, R5/R6).
// Se trabaja con cadenas ISO 'YYYY-MM-DD', comparables lexicográficamente.

/**
 * Convierte un valor de fecha (string ISO, `YYYY-MM-DD` o `Date`) a 'YYYY-MM-DD'.
 * @returns {string}
 */
export function aFechaIso(valor) {
  if (valor instanceof Date) {
    const anio = valor.getFullYear();
    const mes = String(valor.getMonth() + 1).padStart(2, '0');
    const dia = String(valor.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }
  return String(valor).slice(0, 10);
}

/**
 * Devuelve la fecha de hoy en formato 'YYYY-MM-DD' (hora local).
 * @returns {string}
 */
export function hoyIso(fecha = new Date()) {
  return aFechaIso(fecha);
}

/**
 * Suma días a una fecha (en UTC para evitar desfases de zona horaria).
 * @param {string|Date} fecha
 * @param {number} dias
 * @returns {string} 'YYYY-MM-DD'
 */
export function sumarDias(fecha, dias) {
  const base = new Date(`${aFechaIso(fecha)}T00:00:00Z`);
  base.setUTCDate(base.getUTCDate() + Number(dias));
  return base.toISOString().slice(0, 10);
}

/**
 * Indica si `fechaA` es estrictamente posterior a `fechaB`.
 * @returns {boolean}
 */
export function esPosterior(fechaA, fechaB) {
  return aFechaIso(fechaA) > aFechaIso(fechaB);
}

/**
 * Devuelve la mayor de dos fechas.
 * @returns {string} 'YYYY-MM-DD'
 */
export function fechaMayor(a, b) {
  return aFechaIso(a) >= aFechaIso(b) ? aFechaIso(a) : aFechaIso(b);
}
