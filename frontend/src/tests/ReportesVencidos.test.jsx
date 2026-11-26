// T046 - Pruebas del reporte de clientes vencidos (US7).

import { describe, it, expect, afterEach, vi } from 'vitest';
import { fireEvent, screen, within } from '@testing-library/react';
import { simularServidor } from './servidorFalso.js';
import {
  generarReportes,
  pintarReportes,
  rangoActual,
  rutaVencidos,
  rutasAdministrador,
  seccionDe,
} from './helpersReportes.jsx';

const filtros = rangoActual();

afterEach(() => {
  delete global.fetch;
  vi.restoreAllMocks();
});

describe('Reporte de clientes vencidos', () => {
  it('aplica la búsqueda y muestra la tabla sin cálculos de adeudo', async () => {
    const servidor = simularServidor(rutasAdministrador(filtros, { buscar: 'ana' }));
    pintarReportes('administrador');

    fireEvent.change(screen.getByLabelText('Buscar cliente vencido (opcional)'), {
      target: { value: 'ana' },
    });
    generarReportes();

    expect(await screen.findByRole('heading', { name: 'Clientes vencidos' })).toBeInTheDocument();
    expect(
      servidor.mock.calls.some(
        ([ruta]) => ruta.startsWith('/api/reports/expired-clients?') && ruta.includes('buscar=ana')
      )
    ).toBe(true);

    const seccion = seccionDe('Clientes vencidos');
    expect(within(seccion).getByText('Ana Vencida')).toBeInTheDocument();
    expect(within(seccion).getByText('ana@local')).toBeInTheDocument();
    expect(within(seccion).getByText('vencida')).toBeInTheDocument();
    expect(within(seccion).getByText(/No se calculan adeudos\./)).toBeInTheDocument();
    expect(seccion.textContent).not.toMatch(/Q\s*[\d,]+\.\d{2}/);
  });

  it('muestra el mensaje cuando no hay clientes vencidos', async () => {
    simularServidor(rutasAdministrador(filtros, { vencidosVacios: true }));
    pintarReportes('administrador');

    generarReportes();

    expect(
      await screen.findByText('No hay clientes vencidos para este periodo.')
    ).toBeInTheDocument();
  });

  it('permite al recepcionista consultarlo sin ver reportes financieros ni de accesos', async () => {
    const servidor = simularServidor([
      { ruta: rutaVencidos(filtros), cuerpo: { reporte: { total: 0, clientes: [] } } },
    ]);
    pintarReportes('recepcionista');

    generarReportes();

    expect(await screen.findByRole('heading', { name: 'Clientes vencidos' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Reporte financiero' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Reporte de accesos' })).not.toBeInTheDocument();
    expect(screen.queryByLabelText('Método de pago (opcional)')).not.toBeInTheDocument();
    expect(
      servidor.mock.calls.some(([ruta]) => ruta.startsWith('/api/reports/financial?'))
    ).toBe(false);
  });

  it('deshabilita la generación para el entrenador', () => {
    simularServidor([]);
    pintarReportes('entrenador');

    expect(screen.getByRole('button', { name: 'Generar reportes' })).toBeDisabled();
  });
});
