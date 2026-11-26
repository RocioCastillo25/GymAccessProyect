// Prueba de tipos de membresía disponibles en la pantalla de Membresías.

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Membresias from '../pages/Membresias.jsx';
import { simularServidor } from './servidorFalso.js';

afterEach(() => {
  delete global.fetch;
});

function pintar() {
  return render(
    <MemoryRouter>
      <Membresias />
    </MemoryRouter>
  );
}

describe('Membresías', () => {
  it('muestra los tipos activos y permite seleccionar uno', async () => {
    simularServidor([
      { ruta: '/api/membresias', cuerpo: { membresias: [] } },
      { ruta: '/api/clientes', cuerpo: { clientes: [] } },
      {
        ruta: '/api/tipos-membresia',
        cuerpo: {
          tiposMembresia: [
            {
              id: 1,
              nombre: 'Mensual',
              descripcion: 'Acceso por 30 días',
              duracion: 30,
              precio: 650,
              estado: 'activo',
            },
            {
              id: 2,
              nombre: 'Anual',
              descripcion: 'Acceso por 365 días',
              duracion: 365,
              precio: 6000,
              estado: 'activo',
            },
          ],
        },
      },
    ]);

    pintar();

    expect(
      await screen.findByRole('heading', { name: 'Tipos de membresía disponibles' })
    ).toBeInTheDocument();
    expect(screen.getAllByText('Mensual').length).toBeGreaterThan(0);
    expect(screen.getAllByText(/650\.00/).length).toBeGreaterThan(0);
    expect(screen.getByText('Gestionar tipos')).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole('button', { name: 'Usar este tipo' })[0]);

    expect(screen.getByRole('button', { name: 'Tipo seleccionado' })).toBeInTheDocument();
  });

  it('confirma la renovación de una membresía conservando el historial', async () => {
    const datosComunes = [
      {
        ruta: '/api/membresias',
        cuerpo: {
          membresias: [
            {
              id: 5,
              idCliente: 3,
              idTipoMembresia: 1,
              fechaInicio: '2026-11-01',
              fechaFin: '2026-12-01',
              estado: 'activa',
            },
          ],
        },
      },
      {
        ruta: '/api/clientes',
        cuerpo: { clientes: [{ id: 3, nombre: 'Ana', apellido: 'Pérez' }] },
      },
      {
        ruta: '/api/tipos-membresia',
        cuerpo: {
          tiposMembresia: [
            { id: 1, nombre: 'Mensual', duracion: 30, precio: 650, estado: 'activo' },
            { id: 2, nombre: 'Anual', duracion: 365, precio: 6000, estado: 'activo' },
          ],
        },
      },
    ];
    const servidor = simularServidor([
      ...datosComunes,
      {
        metodo: 'POST',
        ruta: '/api/membresias/5/renovar',
        cuerpo: {
          mensaje: 'Membresía renovada correctamente.',
          membresia: {
            id: 6,
            idCliente: 3,
            idTipoMembresia: 2,
            fechaInicio: '2026-12-01',
            fechaFin: '2027-12-01',
            estado: 'activa',
          },
        },
        status: 201,
      },
    ]);

    pintar();

    expect(await screen.findByRole('button', { name: 'Renovar' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Renovar' }));

    const confirmacion = screen.getByRole('dialog', { name: 'Confirmar renovación' });
    expect(within(confirmacion).getByText(/¿Renovar la membresía 5 de Ana Pérez?/)).toBeInTheDocument();
    fireEvent.change(within(confirmacion).getByLabelText('Tipo para la renovación'), {
      target: { value: '2' },
    });
    fireEvent.click(within(confirmacion).getByRole('button', { name: 'Confirmar renovación' }));

    await waitFor(() =>
      expect(servidor).toHaveBeenCalledWith(
        '/api/membresias/5/renovar',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ idTipoMembresia: 2 }),
        })
      )
    );
    expect(await screen.findByText('Membresía renovada correctamente.')).toBeInTheDocument();
    expect(screen.queryByRole('dialog', { name: 'Confirmar renovación' })).not.toBeInTheDocument();
  });
});
