// T023 - Pruebas de la vista de adeudos propios (005-FR-010, 005-FR-011, 005-FR-013).

import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SesionProvider } from '../context/SesionContext.jsx';
import MisAdeudos from '../pages/MisAdeudos.jsx';
import { simularServidor } from './servidorFalso.js';

function pintar() {
  localStorage.setItem(
    'gymaccess_usuario',
    JSON.stringify({ id: 9, nombre: 'Cliente Prueba', correo: 'cliente@local', rol: 'cliente' })
  );
  localStorage.setItem('gymaccess_token', 'token-de-prueba');
  return render(
    <SesionProvider>
      <MisAdeudos />
    </SesionProvider>
  );
}

const URL_INICIAL = '/api/pagos/adeudos/mios';

afterEach(() => {
  delete global.fetch;
  vi.restoreAllMocks();
});

describe('Vista de mis adeudos', () => {
  it('muestra el total propio y el detalle de pagos pendientes', async () => {
    simularServidor([
      {
        ruta: URL_INICIAL,
        cuerpo: {
          cliente: {
            id: 3,
            nombre: 'Ana',
            apellido: 'Pérez',
            correo: 'ana@example.com',
          },
          totalAdeudado: 350,
          pagos: [
            {
              id: 21,
              idCliente: 3,
              idMembresia: null,
              monto: 350,
              fechaPago: '2026-11-12T09:00:00.000Z',
              metodoPago: 'transferencia',
              estado: 'pendiente',
            },
          ],
        },
      },
    ]);
    pintar();

    expect(await screen.findByText('Mis adeudos')).toBeInTheDocument();
    expect(screen.getByText('Total adeudado: 350')).toBeInTheDocument();
    expect(screen.getByText('350')).toBeInTheDocument();
    expect(screen.getByText('pendiente')).toBeInTheDocument();
    expect(screen.queryByLabelText('Cliente')).not.toBeInTheDocument();
  });

  it('muestra el mensaje de estado vacío con total en cero', async () => {
    simularServidor([
      {
        ruta: URL_INICIAL,
        cuerpo: {
          cliente: {
            id: 3,
            nombre: 'Ana',
            apellido: 'Pérez',
            correo: 'ana@example.com',
          },
          totalAdeudado: 0,
          pagos: [],
          mensaje: 'No hay adeudos registrados.',
        },
      },
    ]);
    pintar();

    expect(await screen.findByText('No hay adeudos registrados.')).toBeInTheDocument();
    expect(screen.getByText('Total adeudado: 0')).toBeInTheDocument();
  });
});
