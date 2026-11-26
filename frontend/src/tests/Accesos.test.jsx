// Pruebas de la consulta de accesos con filtros (FR-026).

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Accesos from '../pages/Accesos.jsx';
import { simularServidor } from './servidorFalso.js';

afterEach(() => {
  delete global.fetch;
});

function pintar() {
  return render(<Accesos />);
}

describe('Consulta de accesos', () => {
  it('muestra el estado vacío cuando no hay registros', async () => {
    simularServidor([{ ruta: '/api/accesos', cuerpo: { accesos: [], total: 0 } }]);

    pintar();

    expect(
      await screen.findByText('No hay accesos registrados para los filtros seleccionados.')
    ).toBeInTheDocument();
  });

  it('aplica los filtros y muestra el resultado y el motivo de rechazo', async () => {
    const servidor = simularServidor([
      { ruta: '/api/accesos', cuerpo: { accesos: [], total: 0 } },
      {
        ruta: '/api/accesos?resultado=rechazado&idCliente=7',
        cuerpo: {
          accesos: [
            {
              id: 12,
              idCliente: 7,
              cliente: 'Ana Pérez',
              fechaHora: '2026-11-25T10:00:00.000Z',
              tipo: 'entrada',
              resultado: 'rechazado',
              motivoRechazo: 'La membresía está vencida.',
            },
          ],
          total: 1,
        },
      },
    ]);

    pintar();
    expect(await screen.findByText(/No hay accesos registrados/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Resultado'), { target: { value: 'rechazado' } });
    fireEvent.change(screen.getByLabelText('ID del cliente'), { target: { value: '7' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    await waitFor(() =>
      expect(servidor).toHaveBeenCalledWith('/api/accesos?resultado=rechazado&idCliente=7', {
        headers: expect.any(Object),
      })
    );
    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('La membresía está vencida.')).toBeInTheDocument();
    expect(screen.getByTestId('filtros-activos-accesos')).toHaveTextContent('resultado: rechazado');
  });
});
