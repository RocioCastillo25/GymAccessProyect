// T020 - Pruebas del reporte de accesos: filtros, franjas horarias, motivos y estado vacío (US2).

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

describe('Reporte de accesos', () => {
  it('filtra por resultado y cliente y muestra horas y motivos de rechazo', async () => {
    const rutas = rutasAdministrador(filtros, { resultado: 'rechazado', idCliente: '7' });
    rutas[0].cuerpo = { clientes: [{ id: 7, nombre: 'Ana', apellido: 'Vencida' }] };
    const servidor = simularServidor(rutas);
    pintarReportes('administrador');
    await screen.findByRole('option', { name: /Ana\s+Vencida/ });

    fireEvent.change(screen.getByLabelText('Resultado de acceso (opcional)'), {
      target: { value: 'rechazado' },
    });
    fireEvent.change(screen.getByLabelText('Cliente (opcional, accesos)'), {
      target: { value: '7' },
    });
    generarReportes();

    expect(await screen.findByRole('heading', { name: 'Reporte de accesos' })).toBeInTheDocument();
    expect(
      servidor.mock.calls.some(
        ([ruta]) =>
          ruta.startsWith('/api/reports/access?') &&
          ruta.includes('resultado=rechazado') &&
          ruta.includes('idCliente=7')
      )
    ).toBe(true);

    const seccion = seccionDe('Reporte de accesos');
    expect(within(seccion).getByText('09:00')).toBeInTheDocument();
    expect(within(seccion).getByText('La membresía está vencida.')).toBeInTheDocument();
    expect(within(seccion).getAllByText('4').length).toBeGreaterThan(0);
    expect(seccion.textContent).not.toContain('descriptorFacial');
  });

  it('muestra el mensaje de periodo sin accesos', async () => {
    simularServidor(rutasAdministrador(filtros, { accesosVacios: true }));
    pintarReportes('administrador');

    generarReportes();

    expect(await screen.findByText('No hay registros para este periodo.')).toBeInTheDocument();
    expect(screen.queryByText('Motivos de rechazo')).not.toBeInTheDocument();
  });
});
