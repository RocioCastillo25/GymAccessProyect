// T014 - Pruebas del reporte financiero: filtro por método, totales, estado vacío y permisos (US1).

import { describe, it, expect, afterEach, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { simularServidor } from './servidorFalso.js';
import {
  generarReportes,
  pintarReportes,
  rangoActual,
  rutasAdministrador,
  seccionDe,
} from './helpersReportes.jsx';

const filtros = rangoActual();

afterEach(() => {
  delete global.fetch;
  vi.restoreAllMocks();
});

describe('Reporte financiero', () => {
  it('aplica el filtro por método de pago y muestra totales y desgloses', async () => {
    const servidor = simularServidor(rutasAdministrador(filtros, { metodoPago: 'tarjeta' }));
    pintarReportes('administrador');

    fireEvent.change(screen.getByLabelText('Método de pago (opcional)'), {
      target: { value: 'tarjeta' },
    });
    generarReportes();

    expect(await screen.findByRole('heading', { name: 'Reporte financiero' })).toBeInTheDocument();
    expect(
      servidor.mock.calls.some(
        ([ruta]) =>
          ruta.startsWith('/api/reports/financial?') && ruta.includes('metodoPago=tarjeta')
      )
    ).toBe(true);

    const seccion = seccionDe('Reporte financiero');
    expect(within(seccion).getAllByText(/150/).length).toBeGreaterThan(0);
    expect(within(seccion).getByText('Mensual')).toBeInTheDocument();
    expect(within(seccion).getByText('tarjeta')).toBeInTheDocument();
  });

  it('muestra el mensaje de periodo vacío cuando no hay transacciones', async () => {
    simularServidor(rutasAdministrador(filtros, { financieroVacio: true }));
    pintarReportes('administrador');

    generarReportes();

    expect(await screen.findByText('No hay registros para este periodo.')).toBeInTheDocument();
    expect(screen.queryByText('Ingresos por método de pago')).not.toBeInTheDocument();
  });

  it('muestra el mensaje de permisos cuando el backend rechaza el reporte', async () => {
    const mensaje = 'No tiene permiso para consultar el reporte financiero.';
    const rutas = rutasAdministrador(filtros).map((ruta) =>
      ruta.ruta.startsWith('/api/reports/financial')
        ? { ...ruta, status: 403, cuerpo: { mensaje, codigo: 'AUTORIZACION' } }
        : ruta
    );
    simularServidor(rutas);
    pintarReportes('administrador');

    generarReportes();

    expect(await screen.findByText(mensaje)).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Reporte financiero' })).not.toBeInTheDocument();
  });
});
