// Pruebas del historial propio de accesos (FR-027).

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MisAccesos from '../pages/MisAccesos.jsx';
import { simularServidor } from './servidorFalso.js';

afterEach(() => {
  delete global.fetch;
});

function pintar() {
  return render(<MisAccesos />);
}

describe('Mis accesos', () => {
  it('muestra el historial devuelto por el backend sin pedir identificador', async () => {
    const servidor = simularServidor([
      {
        ruta: '/api/accesos/yo',
        cuerpo: {
          accesos: [
            {
              id: 3,
              fechaHora: '2026-11-25T09:00:00.000Z',
              tipo: 'entrada',
              resultado: 'autorizado',
              motivoRechazo: null,
            },
            {
              id: 2,
              fechaHora: '2026-11-24T09:00:00.000Z',
              tipo: 'salida',
              resultado: 'rechazado',
              motivoRechazo: 'La membresía está suspendida.',
            },
          ],
          total: 2,
        },
      },
    ]);

    pintar();

    expect(await screen.findByRole('heading', { name: 'Mis accesos' })).toBeInTheDocument();
    expect(servidor).toHaveBeenCalledWith('/api/accesos/yo', { headers: expect.any(Object) });
    expect(screen.getAllByRole('row')).toHaveLength(3);
    expect(screen.getByText('La membresía está suspendida.')).toBeInTheDocument();
  });

  it('muestra un mensaje claro cuando no hay accesos propios', async () => {
    simularServidor([{ ruta: '/api/accesos/yo', cuerpo: { accesos: [], total: 0 } }]);

    pintar();

    expect(
      await screen.findByText('Todavía no hay accesos registrados a su nombre.')
    ).toBeInTheDocument();
  });
});
