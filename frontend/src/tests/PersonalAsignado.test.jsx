// Prueba de la consulta del personal asignado (HU7, FR-008).

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PersonalAsignado from '../pages/PersonalAsignado.jsx';
import { simularServidor } from './servidorFalso.js';

afterEach(() => {
  delete global.fetch;
});

describe('Personal asignado', () => {
  it('lista los clientes del entrenador seleccionado', async () => {
    simularServidor([
      { ruta: '/api/entrenadores', cuerpo: { entrenadores: [{ id: 3, nombre: 'Ana Torres' }] } },
      {
        ruta: '/api/asignaciones/entrenador/3',
        cuerpo: {
          asignaciones: [{ id: 1, cliente: 'Luis Gómez', esPrincipal: true, estado: 'activa' }],
        },
      },
    ]);

    render(<PersonalAsignado />);
    await screen.findByText('Ana Torres');

    fireEvent.change(screen.getByLabelText('Entrenador *'), { target: { value: '3' } });

    expect(await screen.findByText('Luis Gómez')).toBeInTheDocument();
    expect(screen.getByText('Sí')).toBeInTheDocument();
    expect(screen.getByText('activa')).toBeInTheDocument();
  });

  it('informa cuando el entrenador no tiene clientes asignados', async () => {
    simularServidor([
      { ruta: '/api/entrenadores', cuerpo: { entrenadores: [{ id: 3, nombre: 'Ana Torres' }] } },
      { ruta: '/api/asignaciones/entrenador/3', cuerpo: { asignaciones: [] } },
    ]);

    render(<PersonalAsignado />);
    await screen.findByText('Ana Torres');

    fireEvent.change(screen.getByLabelText('Entrenador *'), { target: { value: '3' } });

    expect(
      await screen.findByText('El entrenador no tiene clientes asignados.')
    ).toBeInTheDocument();
  });
});
