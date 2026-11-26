// T003 - Pruebas unitarias de validación de filtros de consulta de pagos (005-FR-003, 005-FR-007).

import { describe, it, expect } from 'vitest';
import { validarConsultaPagos } from '../../src/validators/pagoConsulta.validator.js';

describe('Validador de consulta de pagos', () => {
  it('aplica limite 50 y offset 0 cuando no se envían', () => {
    const resultado = validarConsultaPagos({});

    expect(resultado.errores).toEqual([]);
    expect(resultado.valores.limite).toBe(50);
    expect(resultado.valores.offset).toBe(0);
  });

  it('acepta limite entre 1 y 200 y offset entero mayor o igual que cero', () => {
    const minimo = validarConsultaPagos({ limite: 1, offset: 0 });
    const maximo = validarConsultaPagos({ limite: 200, offset: 100 });

    expect(minimo.errores).toEqual([]);
    expect(maximo.errores).toEqual([]);
    expect(maximo.valores.limite).toBe(200);
    expect(maximo.valores.offset).toBe(100);
  });

  it('rechaza limite fuera de rango y offset negativo con campo y error', () => {
    const resultado = validarConsultaPagos({ limite: 201, offset: -1 });

    expect(resultado.errores).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ campo: 'limite' }),
        expect.objectContaining({ campo: 'offset' }),
      ])
    );
    expect(resultado.errores.every((item) => typeof item.error === 'string')).toBe(true);
    expect(resultado.errores.find((item) => item.campo === 'limite').error).toContain('200');
  });

  it('rechaza una fecha de inicio posterior a la fecha de fin', () => {
    const resultado = validarConsultaPagos({ fechaInicio: '2026-11-20', fechaFin: '2026-11-19' });

    expect(resultado.errores.length).toBeGreaterThan(0);
    expect(resultado.errores.some((item) => item.error.includes('posterior'))).toBe(true);
  });

  it('acepta estados pendiente, completado y cancelado y rechaza otros', () => {
    const validos = ['pendiente', 'completado', 'cancelado'].map((estado) =>
      validarConsultaPagos({ estado })
    );
    const invalido = validarConsultaPagos({ estado: 'desconocido' });

    expect(validos.every((resultado) => resultado.errores.length === 0)).toBe(true);
    expect(invalido.errores.some((item) => item.campo === 'estado')).toBe(true);
  });

  it('acepta un idCliente entero positivo y rechaza cero y textos', () => {
    const valido = validarConsultaPagos({ idCliente: 7 });
    const invalidos = [validarConsultaPagos({ idCliente: 0 }), validarConsultaPagos({ idCliente: 'abc' })];

    expect(valido.errores).toEqual([]);
    expect(valido.valores.idCliente).toBe(7);
    expect(invalidos.every((resultado) => resultado.errores.some((item) => item.campo === 'idCliente'))).toBe(
      true
    );
  });

  it('devuelve fechas válidas sin errores', () => {
    const resultado = validarConsultaPagos({ fechaInicio: '2026-11-01', fechaFin: '2026-11-30' });

    expect(resultado.errores).toEqual([]);
    expect(resultado.valores.fechaInicio).toBe('2026-11-01');
    expect(resultado.valores.fechaFin).toBe('2026-11-30');
  });
});
