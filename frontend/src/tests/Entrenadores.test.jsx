// Prueba de la gestión de entrenadores (HU1, FR-001 a FR-004).

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Entrenadores from '../pages/Entrenadores.jsx';
import { simularServidor } from './servidorFalso.js';

afterEach(() => {
  delete global.fetch;
});

const ENTRENADORES = {
  entrenadores: [
    {
      id: 1,
      nombre: 'Ana Torres',
      correo: 'ana@local',
      especialidad: 'Fuerza',
      telefono: '555-0001',
      estado: 'activo',
    },
  ],
};

const USUARIOS = {
  usuarios: [{ id: 9, nombre: 'Ana Torres', correo: 'ana@local', rol: 'entrenador', estado: 'activo' }],
};

describe('Gestión de entrenadores', () => {
  it('lista los entrenadores registrados', async () => {
    simularServidor([
      { ruta: '/api/entrenadores', cuerpo: ENTRENADORES },
      { ruta: '/api/usuarios', cuerpo: USUARIOS },
    ]);

    render(<Entrenadores />);

    expect(await screen.findByText('ana@local')).toBeInTheDocument();
    expect(screen.getByText('Fuerza')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Desactivar' })).toBeInTheDocument();
  });

  it('registra un entrenador y muestra el mensaje de éxito', async () => {
    simularServidor([
      { ruta: '/api/entrenadores', cuerpo: ENTRENADORES },
      { ruta: '/api/usuarios', cuerpo: USUARIOS },
      {
        metodo: 'POST',
        ruta: '/api/entrenadores',
        cuerpo: { mensaje: 'Entrenador registrado correctamente.' },
      },
    ]);

    render(<Entrenadores />);
    await screen.findByText('ana@local');

    fireEvent.change(screen.getByLabelText('Usuario con rol entrenador *'), {
      target: { value: '9' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Registrar entrenador' }));

    expect(await screen.findByText('Entrenador registrado correctamente.')).toBeInTheDocument();
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/entrenadores',
        expect.objectContaining({ method: 'POST' })
      );
    });
  });
});
