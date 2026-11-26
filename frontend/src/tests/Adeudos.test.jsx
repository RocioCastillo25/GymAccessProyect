// T022 - Pruebas de la vista de adeudos generales (005-FR-009, 005-FR-011, 005-FR-012).

import { describe, it, expect, afterEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { SesionProvider } from '../context/SesionContext.jsx';
import Adeudos from '../pages/Adeudos.jsx';
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
      <Adeudos />
    </SesionProvider>
  );
}

function urlCon(parametros) {
  return `/api/pagos/adeudos?${new URLSearchParams(parametros).toString()}`;
}

const URL_INICIAL = urlCon({ limite: 50, offset: 0 });

function pago(id, monto) {
  return {
    id,
    idCliente: 3,
    idMembresia: null,
    monto,
    fechaPago: '2026-11-12T09:00:00.000Z',
    metodoPago: 'transferencia',
    estado: 'pendiente',
  };
}

function adeudosDeEjemplo() {
  return {
    adeudos: [
      {
        cliente: { id: 3, nombre: 'Ana', apellido: 'Pérez', correo: 'ana@example.com' },
        totalAdeudado: 300,
        pagos: [pago(22, 200), pago(21, 100)],
      },
      {
        cliente: { id: 4, nombre: 'Luis', apellido: 'Gómez', correo: 'luis@example.com' },
        totalAdeudado: 50,
        pagos: [pago(20, 50)],
      },
    ],
    total: 2,
    limite: 50,
    offset: 0,
  };
}

afterEach(() => {
  delete global.fetch;
  vi.restoreAllMocks();
});

describe('Vista de adeudos generales', () => {
  it('muestra los adeudos agrupados con su total y detalle de pagos', async () => {
    simularServidor([{ ruta: URL_INICIAL, cuerpo: adeudosDeEjemplo() }]);
    pintar();

    expect(await screen.findByText('Ana Pérez')).toBeInTheDocument();
    expect(screen.getByText('Luis Gómez')).toBeInTheDocument();
    expect(screen.getByText('Total adeudado: 300')).toBeInTheDocument();
    expect(screen.getByText('Total adeudado: 50')).toBeInTheDocument();
    expect(screen.getByText('Clientes con adeudo: 2')).toBeInTheDocument();
    expect(screen.getAllByText('transferencia')).toHaveLength(3);
  });

  it('filtra por cliente y respeta la paginación', async () => {
    const fetchSimulado = simularServidor([
      { ruta: URL_INICIAL, cuerpo: { ...adeudosDeEjemplo(), total: 51 } },
      {
        ruta: urlCon({ idCliente: 3, limite: 10, offset: 10 }),
        cuerpo: { ...adeudosDeEjemplo(), total: 51, adeudos: [adeudosDeEjemplo().adeudos[0]] },
      },
    ]);
    pintar();
    await screen.findByText('Ana Pérez');

    fireEvent.change(screen.getByLabelText('Cliente'), { target: { value: '3' } });
    fireEvent.change(screen.getByLabelText('Registros por página'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente' }));

    await waitFor(() => {
      expect(
        fetchSimulado.mock.calls.some(([ruta]) => ruta === urlCon({ idCliente: 3, limite: 10, offset: 10 }))
      ).toBe(true);
    });
  });

  it('muestra el mensaje de estado vacío', async () => {
    simularServidor([
      {
        ruta: URL_INICIAL,
        cuerpo: {
          adeudos: [],
          total: 0,
          limite: 50,
          offset: 0,
          mensaje: 'No hay adeudos registrados.',
        },
      },
    ]);
    pintar();

    expect(await screen.findByText('No hay adeudos registrados.')).toBeInTheDocument();
    expect(screen.getByText('Clientes con adeudo: 0')).toBeInTheDocument();
  });
});
