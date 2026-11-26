// Configuración facial del navegador (R4). El valor puede ajustarse con
// VITE_FACIAL_MAX_INTENTOS; por defecto se usa el mismo límite del backend.

const valor = Number(import.meta.env.VITE_FACIAL_MAX_INTENTOS);

export const FACIAL_MAX_INTENTOS =
  Number.isInteger(valor) && valor > 0 ? valor : 3;
