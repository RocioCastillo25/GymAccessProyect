// Pruebas unitarias de los filtros y la exportación de reportes.

import { describe, it, expect } from 'vitest';
import {
  validarBuscar,
  validarExportacion,
  validarFiltrosReporte,
  validarIdCliente,
  validarMetodoPago,
  validarRango,
  validarResultado,
} from '../../src/validators/reporte.validator.js';

function capturarError(ejecutar) {
  try {
    ejecutar();
  } catch (error) {
    return error;
  }
  throw new Error('Se esperaba un error de validación.');
}

function primerError(ejecutar) {
  return capturarError(ejecutar).errores[0];
}

describe('Validador de reportes', () => {
  it('acepta un rango de fechas inclusivo válido', () => {
    expect(validarRango({ fechaInicio: '2026-01-01', fechaFin: '2026-01-31' })).toEqual({
      fechaInicio: '2026-01-01',
      fechaFin: '2026-01-31',
    });
  });

  it('rechaza fechas inexistentes y rangos invertidos', () => {
    expect(() => validarRango({ fechaInicio: '2026-02-30', fechaFin: '2026-03-01' })).toThrow(
      'Revise los filtros del reporte.'
    );
    expect(
      primerError(() => validarRango({ fechaInicio: '2026-03-01', fechaFin: '2026-02-01' }))
    ).toEqual({
      campo: 'fechaFin',
      error: 'La fecha de fin no puede ser anterior a la fecha de inicio.',
    });
  });

  it('rechaza un identificador de cliente inválido', () => {
    expect(primerError(() => validarIdCliente('abc'))).toEqual({
      campo: 'idCliente',
      error: 'El cliente debe ser un número entero positivo.',
    });
    expect(primerError(() => validarIdCliente(0))).toEqual({
      campo: 'idCliente',
      error: 'El cliente debe ser un número entero positivo.',
    });
    expect(validarIdCliente('5')).toBe(5);
    expect(validarIdCliente('')).toBeNull();
  });

  it('rechaza un método de pago vacío y recorta el texto válido', () => {
    expect(primerError(() => validarMetodoPago('   '))).toEqual({
      campo: 'metodoPago',
      error: 'El método de pago no puede estar vacío.',
    });
    expect(validarMetodoPago(' tarjeta ')).toBe('tarjeta');
    expect(validarMetodoPago(undefined)).toBeNull();
  });

  it('rechaza resultados fuera del enum y acepta los permitidos', () => {
    expect(primerError(() => validarResultado('desconocido'))).toEqual({
      campo: 'resultado',
      error: 'El resultado debe ser uno de: autorizado, rechazado.',
    });
    expect(validarResultado('autorizado')).toBe('autorizado');
    expect(validarResultado('rechazado')).toBe('rechazado');
  });

  it('valida la búsqueda opcional del reporte de vencidos', () => {
    expect(validarBuscar('  Ana  ')).toBe('Ana');
    expect(validarBuscar('   ')).toBeNull();
    expect(primerError(() => validarBuscar('x'.repeat(101)))).toEqual({
      campo: 'buscar',
      error: 'La búsqueda no puede superar los 100 caracteres.',
    });
  });

  it('compone los filtros permitidos y descarta los no aplicables', () => {
    const filtros = validarFiltrosReporte(
      {
        fechaInicio: '2026-01-01',
        fechaFin: '2026-01-31',
        resultado: 'rechazado',
        metodoPago: 'efectivo',
      },
      { permitirMetodoPago: false, permitirBuscar: false }
    );

    expect(filtros).toEqual({
      fechaInicio: '2026-01-01',
      fechaFin: '2026-01-31',
      idCliente: null,
      resultado: 'rechazado',
    });
  });

  it('valida el cuerpo de la exportación', () => {
    expect(
      validarExportacion({
        reporte: 'financiero',
        formato: 'csv',
        filtros: { fechaInicio: '2026-01-01', fechaFin: '2026-01-31' },
      })
    ).toMatchObject({ reporte: 'financiero', formato: 'csv' });

    expect(primerError(() => validarExportacion({ reporte: 'otro', formato: 'pdf' }))).toEqual({
      campo: 'reporte',
      error: 'El reporte debe ser uno de: financiero, accesos, vencidos.',
    });
    expect(primerError(() => validarExportacion({ reporte: 'vencidos', formato: 'xls' }))).toEqual({
      campo: 'formato',
      error: 'El formato debe ser uno de: csv, pdf.',
    });
  });
});
