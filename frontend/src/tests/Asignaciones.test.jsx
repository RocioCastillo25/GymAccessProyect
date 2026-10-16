// Prueba de la asignación de entrenadores (HU2, FR-005 a FR-008).

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Asignaciones from '../pages/Asignaciones.jsx';
import { simularServidor } from './servidorFalso.js';

afterEach(() => {
  delete global.fetch;
});

describe('Asignación de entrenadores', () => {
  it('lista las asignaciones con cliente, entrenador y estado', async () => {
    simularServidor([
      {
        ruta: '/api/asignaciones',
        cuerpo: {
          asignaciones: [
            { id: 1, cliente: 'Luis Gómez', entrenador: 'Ana Torres', esPrincipal: true, estado: 'activa' },
          ],
        },
      },
      { ruta: '/api/clientes', cuerpo: { clientes: [{ id: 2, nombre: 'Luis', estado: 'activo' }] } },
      { ruta: '/api/entrenadores', cuerpo: { entrenadores: [{ id: 3, nombre: 'Ana', estado: 'activo' }] } },
    ]);

    render(<Asignaciones />);

    expect(await screen.findByText('Luis Gómez')).toBeInTheDocument();
    expect(screen.getByText('Ana Torres')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Finalizar' })).toBeInTheDocument();
  });

  it('muestra los clientes y entrenadores activos en el formulario', async () => {
    simularServidor([
      { ruta: '/api/asignaciones', cuerpo: { asignaciones: [] } },
      { ruta: '/api/clientes', cuerpo: { clientes: [{ id: 2, nombre: 'Luis', estado: 'activo' }] } },
      { ruta: '/api/entrenadores', cuerpo: { entrenadores: [{ id: 3, nombre: 'Ana', estado: 'activo' }] } },
    ]);

    render(<Asignaciones />);

    expect(await screen.findByText('Luis')).toBeInTheDocument();
    expect(screen.getByText('Ana')).toBeInTheDocument();
    expect(screen.getByText('No hay asignaciones registradas todavía.')).toBeInTheDocument();
  });
});
