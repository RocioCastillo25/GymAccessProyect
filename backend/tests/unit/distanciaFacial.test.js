// T045 - Pruebas unitarias de comparación facial (HU7, FR-018, FR-019, R14).

import { describe, it, expect } from 'vitest';
import {
  distanciaEuclidea,
  mejorCoincidencia,
} from '../../src/utils/distanciaFacial.js';

describe('Distancia facial', () => {
  it('calcula la distancia euclídea correctamente', () => {
    expect(distanciaEuclidea([0, 0], [3, 4])).toBe(5);
    expect(distanciaEuclidea([0.1, 0.2, 0.3], [0.1, 0.2, 0.3])).toBe(0);
  });

  it('devuelve el candidato cuando la distancia está dentro del umbral', () => {
    const resultado = mejorCoincidencia(
      [0, 0],
      [{ idCliente: 7, descriptorFacial: [0.3, 0] }],
      0.6
    );

    expect(resultado).not.toBeNull();
    expect(resultado.idCliente).toBe(7);
    expect(resultado.distancia).toBeCloseTo(0.3, 5);
  });

  it('rechaza al candidato cuando la distancia supera el umbral', () => {
    const resultado = mejorCoincidencia(
      [1, 1],
      [{ idCliente: 7, descriptorFacial: [0, 0] }],
      0.6
    );

    expect(resultado).toBeNull();
  });

  it('selecciona el mejor candidato entre varios rostros similares', () => {
    const resultado = mejorCoincidencia(
      [0, 0],
      [
        { idCliente: 1, descriptorFacial: [0.5, 0] },
        { idCliente: 2, descriptorFacial: [0.1, 0] },
        { idCliente: 3, descriptorFacial: [0.4, 0] },
      ],
      0.6
    );

    expect(resultado.idCliente).toBe(2);
  });

  it('interpreta descriptores almacenados como JSON', () => {
    const resultado = mejorCoincidencia(
      [0, 0],
      [{ idCliente: 4, descriptorFacial: JSON.stringify([0, 0]) }],
      0.6
    );

    expect(resultado.idCliente).toBe(4);
  });
});
