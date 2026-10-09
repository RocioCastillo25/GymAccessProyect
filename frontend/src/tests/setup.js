// Configuración común de las pruebas del frontend.
import '@testing-library/jest-dom/vitest';

// localStorage está disponible en jsdom; se limpia entre pruebas.
beforeEach(() => {
  localStorage.clear();
});
