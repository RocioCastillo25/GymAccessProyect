// T056 - Pruebas de la pantalla de control de acceso con captura reutilizable.

import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Acceso from '../pages/Acceso.jsx';
import { simularServidor } from './servidorFalso.js';

const descriptor = Array.from({ length: 128 }, (_, indice) => indice / 128);

vi.mock('../components/CapturaFacial.jsx', () => ({
  default: ({ onCaptura }) => (
    <button type="button" onClick={() => onCaptura(descriptor)}>
      Simular captura
    </button>
  ),
}));

afterEach(() => {
  delete global.fetch;
});

function pintar() {
  return render(<Acceso />);
}

describe('Control de acceso', () => {
  it('valida el acceso con el descriptor capturado', async () => {
    const servidor = simularServidor([
      { ruta: '/api/clientes', cuerpo: { clientes: [] } },
      { ruta: '/api/accesos', cuerpo: { accesos: [] } },
      {
        metodo: 'POST',
        ruta: '/api/accesos/validar',
        cuerpo: {
          resultado: 'autorizado',
          cliente: { id: 4, nombre: 'Luis', apellido: 'Pérez' },
          membresia: { estado: 'activa', fechaFin: '2026-12-31' },
        },
      },
    ]);

    pintar();
    expect(await screen.findByRole('button', { name: 'Simular captura' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Simular captura' }));

    await waitFor(() =>
      expect(servidor).toHaveBeenCalledWith(
        '/api/accesos/validar',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ descriptorFacial: descriptor }),
        })
      )
    );
    expect(await screen.findByRole('heading', { name: 'Acceso autorizado' })).toBeInTheDocument();
  });

  it('registra el rostro del cliente seleccionado', async () => {
    const servidor = simularServidor([
      {
        ruta: '/api/clientes',
        cuerpo: { clientes: [{ id: 9, nombre: 'Ana', apellido: 'Pérez' }] },
      },
      { ruta: '/api/accesos', cuerpo: { accesos: [] } },
      { ruta: '/api/rostros/9', cuerpo: { tieneRostro: false } },
      {
        metodo: 'POST',
        ruta: '/api/rostros',
        cuerpo: { mensaje: 'Rostro registrado correctamente.' },
        status: 201,
      },
    ]);

    pintar();
    fireEvent.change(await screen.findByLabelText('Cliente para registrar su rostro'), {
      target: { value: '9' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Modo: registrar rostro' }));
    fireEvent.click(screen.getByRole('button', { name: 'Simular captura' }));

    await waitFor(() =>
      expect(servidor).toHaveBeenCalledWith(
        '/api/rostros',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ idCliente: 9, descriptorFacial: descriptor }),
        })
      )
    );
    expect(await screen.findByText('Rostro registrado correctamente.')).toBeInTheDocument();
  });
});
