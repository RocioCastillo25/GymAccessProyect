// T015 - Pruebas de la vista de pagos propios del cliente (005-FR-002, 005-FR-006).

import { describe, it, expect, afterEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SesionProvider } from '../context/SesionContext.jsx';
import MisPagos from '../pages/MisPagos.jsx';
import { simularServidor } from './servidorFalso.js';

function autenticar() {
  localStorage.setItem(
    'gymaccess_usuario',
    JSON.stringify({ id: 9, nombre: 'Cliente Prueba', correo: 'cliente@local', rol: 'cliente' })
  );
  localStorage.setItem('gymaccess_token', 'token-de-prueba');
}

function pintar() {
  autenticar();
  return render(
    <SesionProvider>
      <MisPagos />
    </SesionProvider>
  );
}

function urlCon(parametros) {
  return `/api/pagos/mios?${new URLSearchParams(parametros).toString()}`;
}

const URL_INICIAL = urlCon({ limite: 50, offset: 0 });

function pagosPropios() {
  return {
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
      {
        id: 20,
        idCliente: 3,
        idMembresia: 2,
        monto: 100,
        fechaPago: '2026-11-01T09:00:00.000Z',
        metodoPago: 'efectivo',
        estado: 'completado',
      },
    ],
    total: 2,
    montoTotal: 450,
    limite: 50,
    offset: 0,
  };
}

afterEach(() => {
  delete global.fetch;
  vi.restoreAllMocks();
});

describe('Vista de mis pagos', () => {
  it('muestra solo los pagos del cliente y no ofrece selector de cliente', async () => {
    simularServidor([{ ruta: URL_INICIAL, cuerpo: pagosPropios() }]);
    pintar();

    expect(await screen.findByText('350')).toBeInTheDocument();
    expect(screen.getAllByText('100').length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Mis pagos' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Cliente')).not.toBeInTheDocument();
  });

  it('aplica filtros de fecha y estado sin campo de cliente', async () => {
    const fetchSimulado = simularServidor([
      { ruta: URL_INICIAL, cuerpo: pagosPropios() },
      {
        ruta: urlCon({
          fechaInicio: '2026-11-01',
          fechaFin: '2026-11-30',
          estado: 'pendiente',
          limite: 50,
          offset: 0,
        }),
        cuerpo: { ...pagosPropios(), pagos: [pagosPropios().pagos[0]], total: 1 },
      },
    ]);
    pintar();
    await screen.findByText('350');

    fireEvent.change(screen.getByLabelText('Fecha inicio'), { target: { value: '2026-11-01' } });
    fireEvent.change(screen.getByLabelText('Fecha fin'), { target: { value: '2026-11-30' } });
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'pendiente' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    await waitFor(() => expect(screen.getByText('Total de registros: 1')).toBeInTheDocument());
    expect(fetchSimulado.mock.calls.map(([ruta]) => ruta)).toContain(
      urlCon({
        fechaInicio: '2026-11-01',
        fechaFin: '2026-11-30',
        estado: 'pendiente',
        limite: 50,
        offset: 0,
      })
    );
  });

  it('muestra el mensaje de estado vacío en español', async () => {
    simularServidor([
      {
        ruta: URL_INICIAL,
        cuerpo: {
          pagos: [],
          total: 0,
          montoTotal: 0,
          limite: 50,
          offset: 0,
          mensaje: 'No hay pagos para los filtros seleccionados.',
        },
      },
    ]);
    pintar();

    expect(await screen.findByText('No hay pagos para los filtros seleccionados.')).toBeInTheDocument();
  });
});
