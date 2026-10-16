// Ayudante para simular el servidor en las pruebas de componentes del frontend.
// No es un archivo de prueba: solo expone utilidades reutilizables.

import { vi } from 'vitest';

function crearRespuesta(cuerpo, status) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => cuerpo,
  };
}

/**
 * Reemplaza `global.fetch` por un doble controlado.
 * @param {Array<{metodo?: string, ruta: string, cuerpo: any, status?: number}>} rutas
 *   Respuestas por ruta y método (`GET` por defecto).
 * @returns {import('vitest').Mock} El doble para inspeccionar llamadas.
 */
export function simularServidor(rutas) {
  global.fetch = vi.fn(async (ruta, opciones = {}) => {
    const metodo = (opciones.method || 'GET').toUpperCase();
    const coincidencia = rutas.find((item) => (item.metodo || 'GET') === metodo && item.ruta === ruta);
    if (!coincidencia) {
      throw new Error(`Ruta no simulada: ${metodo} ${ruta}`);
    }
    const status = coincidencia.status ?? 200;
    const cuerpo = typeof coincidencia.cuerpo === 'function' ? coincidencia.cuerpo() : coincidencia.cuerpo;
    return crearRespuesta(cuerpo, status);
  });
  return global.fetch;
}
