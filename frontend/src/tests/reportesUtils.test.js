// Pruebas de las utilidades de exportación de reportes (US-S4-04).

import { describe, it, expect, afterEach, vi } from 'vitest';
import {
  construirCsv,
  descargarCsv,
  escaparCsv,
  filasAccesosCsv,
  filasFinancieroCsv,
  filasVencidosCsv,
  formatearFiltrosActivos,
  generarNombreArchivo,
} from '../utils/reportes.js';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Utilidades de reportes', () => {
  it('escapa comillas y construye CSV con BOM y separador punto y coma', () => {
    expect(escaparCsv('texto "con" comillas')).toBe('"texto ""con"" comillas"');

    const csv = construirCsv([
      ['Nombre', 'Detalle'],
      ['Ana', 'Línea 1\nLínea 2'],
    ]);
    expect(csv.startsWith('\uFEFF')).toBe(true);
    expect(csv).toContain('"Nombre";"Detalle"');
    expect(csv).toContain('"Ana";"Línea 1\nLínea 2"');
    expect(csv.endsWith('\r\n') === false).toBe(true);
  });

  it('genera nombres de archivo estables sin acentos ni caracteres inválidos', () => {
    expect(
      generarNombreArchivo('financiero', {
        fechaInicio: '2026-01-01',
        fechaFin: '2026-01-31',
        metodoPago: 'Tarjeta',
      })
    ).toBe('reporte-financiero-2026-01-01-2026-01-31-tarjeta.csv');

    expect(generarNombreArchivo('vencidos', { buscar: 'José Pérez' }, 'pdf')).toBe(
      'reporte-vencidos-jos-p-rez.pdf'
    );
  });

  it('formatea solo los filtros activos', () => {
    expect(
      formatearFiltrosActivos({
        fechaInicio: '2026-01-01',
        fechaFin: '',
        metodoPago: null,
        resultado: 'rechazado',
      })
    ).toEqual(['Desde: 2026-01-01', 'Resultado: rechazado']);
  });

  it('incluye metadatos y filas del reporte financiero', () => {
    const filas = filasFinancieroCsv({
      fechaInicio: '2026-01-01',
      fechaFin: '2026-01-31',
      filtros: { fechaInicio: '2026-01-01', fechaFin: '2026-01-31' },
      resumen: { totalRecaudado: 150, totalTransacciones: 2 },
      porMetodoPago: [{ metodoPago: 'efectivo', totalTransacciones: 1, ingresos: 100 }],
      porTipoMembresia: [{ tipoMembresia: 'Mensual', totalTransacciones: 2, ingresos: 150 }],
    });

    expect(filas[0]).toEqual(['Reporte financiero GymAccess']);
    expect(filas).toContainEqual(['Desde', '2026-01-01']);
    expect(filas).toContainEqual(['Total recaudado', 150]);
    expect(filas).toContainEqual(['efectivo', 1, 100]);
    expect(filas).toContainEqual(['Mensual', 2, 150]);
  });

  it('incluye accesos y motivos de rechazo', () => {
    const filas = filasAccesosCsv({
      filtros: { fechaInicio: '2026-01-01', fechaFin: '2026-01-31' },
      resumen: { totalAccesos: 4, autorizados: 1, rechazados: 3 },
      porHora: [{ fecha: '2026-01-10', hora: 9, total: 2, autorizados: 1, rechazados: 1 }],
      porMotivoRechazo: [{ motivo: 'Membresía vencida', total: 3 }],
    });

    expect(filas).toContainEqual(['Total accesos', 4]);
    expect(filas).toContainEqual(['2026-01-10', '09:00', 2, 1, 1]);
    expect(filas).toContainEqual(['Membresía vencida', 3]);
  });

  it('incluye los clientes vencidos y usa valores por defecto', () => {
    const filas = filasVencidosCsv({
      filtros: { fechaInicio: '2026-01-01', fechaFin: '2026-01-31' },
      clientes: [
        {
          cliente: 'Ana Pérez',
          correo: 'ana@local',
          telefono: null,
          tipoMembresia: null,
          fechaFin: null,
          estado: 'vencida',
        },
      ],
    });

    expect(filas).toContainEqual([
      'Ana Pérez',
      'ana@local',
      '',
      'Sin membresía',
      'Sin fecha',
      'vencida',
    ]);
  });

  it('incluye la leyenda de estado vacío en los CSV', () => {
    expect(
      filasFinancieroCsv({
        resumen: { totalRecaudado: 0, totalTransacciones: 0 },
      })
    ).toContainEqual(['Leyenda', 'No hay registros para este periodo']);

    expect(
      filasAccesosCsv({
        resumen: { totalAccesos: 0, autorizados: 0, rechazados: 0 },
      })
    ).toContainEqual(['Leyenda', 'No hay registros para este periodo']);

    expect(
      filasVencidosCsv({
        clientes: [],
      })
    ).toContainEqual(['Leyenda', 'No hay clientes vencidos para este periodo']);
  });

  it('descarga el CSV y libera la URL temporal', () => {
    URL.createObjectURL = vi.fn(() => 'blob:reporte');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});

    descargarCsv('reporte.csv', [['A', 'B']]);

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:reporte');
    expect(document.querySelector('a[download="reporte.csv"]')).toBeNull();
  });
});
