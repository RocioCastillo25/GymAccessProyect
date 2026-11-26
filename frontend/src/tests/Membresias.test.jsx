// Prueba de tipos de membresía disponibles en la pantalla de Membresías.

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
});
