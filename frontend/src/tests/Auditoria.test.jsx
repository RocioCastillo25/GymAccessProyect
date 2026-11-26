// Pruebas de la consulta de auditoría (FR-036).

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Auditoria from '../pages/Auditoria.jsx';
import { simularServidor } from './servidorFalso.js';

afterEach(() => {
  delete global.fetch;
});

function pintar() {
  return render(<Auditoria />);
}

describe('Consulta de auditoría', () => {
  it('muestra las acciones registradas sin datos sensibles', async () => {
    simularServidor([
      {
        ruta: '/api/auditoria',
        cuerpo: {
          auditoria: [
            {
              id: 30,
              idUsuario: 1,
              accion: 'registrar_pago',
              modulo: 'pagos',
              fecha: '2026-11-25T10:30:00.000Z',
              resultado: 'exito',
              descripcion: 'Pago #10 registrado para el cliente #1',
            },
          ],
          total: 1,
        },
      },
    ]);

    pintar();

    expect(await screen.findByRole('heading', { name: 'Auditoría del sistema' })).toBeInTheDocument();
    expect(screen.getByText('Pago #10 registrado para el cliente #1')).toBeInTheDocument();
    expect(screen.getByText('registrar_pago')).toBeInTheDocument();
    expect(document.body.textContent).not.toContain('password');
    expect(document.body.textContent).not.toContain('descriptorFacial');
  });

  it('envía los filtros de módulo y resultado al backend', async () => {
    const servidor = simularServidor([
      { ruta: '/api/auditoria', cuerpo: { auditoria: [], total: 0 } },
      {
        ruta: '/api/auditoria?modulo=pagos&resultado=error',
        cuerpo: { auditoria: [], total: 0 },
      },
    ]);

    pintar();
    expect(await screen.findByText(/No hay acciones registradas/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Módulo'), { target: { value: 'pagos' } });
    fireEvent.change(screen.getByLabelText('Resultado'), { target: { value: 'error' } });
    fireEvent.click(screen.getByRole('button', { name: 'Aplicar filtros' }));

    await waitFor(() =>
      expect(servidor).toHaveBeenCalledWith('/api/auditoria?modulo=pagos&resultado=error', {
        headers: expect.any(Object),
      })
    );
  });

  it('muestra el mensaje de error cuando el backend rechaza la consulta', async () => {
    simularServidor([
      {
        ruta: '/api/auditoria',
        cuerpo: { mensaje: 'No tiene permiso para consultar la auditoría.' },
        status: 403,
      },
    ]);

    pintar();

    expect(await screen.findByRole('heading', { name: 'Auditoría del sistema' })).toBeInTheDocument();
    expect(
      await screen.findByText('No tiene permiso para consultar la auditoría.')
    ).toBeInTheDocument();
  });
});
