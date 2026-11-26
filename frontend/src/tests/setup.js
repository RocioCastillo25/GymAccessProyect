// Configuración común de las pruebas del frontend.
import '@testing-library/jest-dom/vitest';

const almacenamiento = new Map();

const localStorageMock = {
  get length() {
    return almacenamiento.size;
  },
  clear() {
    almacenamiento.clear();
  },
  getItem(clave) {
    return almacenamiento.has(clave) ? almacenamiento.get(clave) : null;
  },
  key(indice) {
    return Array.from(almacenamiento.keys())[indice] ?? null;
  },
  removeItem(clave) {
    almacenamiento.delete(clave);
  },
  setItem(clave, valor) {
    almacenamiento.set(clave, String(valor));
  },
};

Object.defineProperty(globalThis, 'localStorage', {
  configurable: true,
  value: localStorageMock,
});
Object.defineProperty(window, 'localStorage', {
  configurable: true,
  value: localStorageMock,
});

// Se limpia entre pruebas para evitar sesiones filtradas entre casos.
beforeEach(() => {
  localStorage.clear();
});
