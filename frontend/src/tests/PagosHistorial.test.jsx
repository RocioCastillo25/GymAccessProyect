// T008 - Pruebas de la vista de historial de pagos (005-FR-001, 005-FR-003, 005-FR-008).

import { describe, it, expect, afterEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SesionProvider } from '../context/SesionContext.jsx';
import PagosHistorial from '../pages/PagosHistorial.jsx';
import { simularServidor } from './servidorFalso.js';

function autenticar() {
  localStorage.setItem(
    'gymaccess_usuario',
    JSON.stringify({ id: 1, nombre: 'Admin Prueba', correo: 'admin@local', rol: 'administrador' })
  );
  localStorage.setItem('gymaccess_token', 'token-de-prueba');
}

function pintar() {
  autenticar();
  return render(
    <SesionProvider>
      <PagosHistorial />
    </SesionProvider>
  );
}

function urlCon(parametros) {
  return `/api/pagos?${new URLSearchParams(parametros).toString()}`;
}

const URL_INICIAL = urlCon({ limite: 50, offset: 0 });

function pagosDeEjemplo() {
  return {
    pagos: [
      {
        id: 12,
        idCliente: 3,
        idMembresia: 7,
        monto: 350,
        fechaPago: '2026-11-10T10:30:00.000Z',
        metodoPago: 'efectivo',
        estado: 'completado',
      },
      {
        id: 11,
        idCliente: 4,
        idMembresia: null,
        monto: 120,
        fechaPago: '2026-11-09T09:00:00.000Z',
        metodoPago: 'tarjeta',
        estado: 'pendiente',
      },
    ],
    total: 2,
    montoTotal: 470,
    limite: 50,
    offset: 0,
  };
}

afterEach(() => {
  delete global.fetch;
  vi.restoreAllMocks();
});

describe('Vista de historial de pagos', () => {
  it('muestra la tabla con los pagos y los totales devueltos por la API', async () => {
    simularServidor([{ ruta: URL_INICIAL, cuerpo: pagosDeEjemplo() }]);
    pintar();

    expect(await screen.findByText('350')).toBeInTheDocument();
    expect(screen.getByText('120')).toBeInTheDocument();
    expect(screen.getByText('Total de registros: 2')).toBeInTheDocument();
    expect(screen.getByText('Monto total de la página: 470')).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Cliente' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Método' })).toBeInTheDocument();
  });

  it('aplica los filtros de fecha, cliente y estado en la consulta', async () => {
    const fetchSimulado = simularServidor([
      { ruta: URL_INICIAL, cuerpo: pagosDeEjemplo() },
      {
        ruta: urlCon({
          fechaInicio: '2026-11-01',
          fechaFin: '2026-11-30',
          idCliente: 3,
          estado: 'pendiente',
          limite: 50,
          offset: 0,
        }),
        cuerpo: { ...pagosDeEjemplo(), pagos: [pagosDeEjemplo().pagos[1]], total: 1 },
      },
    ]);
    pintar();
    await screen.findByText('350');

    fireEvent.change(screen.getByLabelText('Fecha inicio'), { target: { value: '2026-11-01' } });
    fireEvent.change(screen.getByLabelText('Fecha fin'), { target: { value: '2026-11-30' } });
    fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Estado'), { target: { value: 'pendiente' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    await waitFor(() => {
      expect(screen.getByText('Total de registros: 1')).toBeInTheDocument();
    });
    expect(fetchSimulado.mock.calls.map(([ruta]) => ruta)).toContain(
      urlCon({
        fechaInicio: '2026-11-01',
        fechaFin: '2026-11-30',
        idCliente: 3,
        estado: 'pendiente',
        limite: 50,
        offset: 0,
      })
    );
  });

  it('cambia de página con limite y offset', async () => {
    const fetchSimulado = simularServidor([
      { ruta: URL_INICIAL, cuerpo: { ...pagosDeEjemplo(), total: 51 } },
      {
        ruta: urlCon({ limite: 10, offset: 10 }),
        cuerpo: { ...pagosDeEjemplo(), total: 51, limite: 10, offset: 10 },
      },
    ]);
    pintar();
    await screen.findByText('350');

    fireEvent.change(screen.getByLabelText('Registros por página'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() => {
      expect(
        fetchSimulado.mock.calls.some(([ruta]) => ruta === urlCon({ limite: 10, offset: 10 }))
      ).toBe(true);
    });
  });

  it('muestra el mensaje de estado vacío', async () => {
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
    expect(screen.getByText('Total de registros: 0')).toBeInTheDocument();
  });

  it('muestra el mensaje de error de la API', async () => {
    simularServidor([
      {
        ruta: URL_INICIAL,
        status: 400,
        cuerpo: { mensaje: 'Revise los filtros enviados.', codigo: 'VALIDACION' },
      },
    ]);
    pintar();

    expect(await screen.findByText('Revise los filtros enviados.')).toBeInTheDocument();
  });
});
