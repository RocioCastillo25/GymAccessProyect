// Prueba de la pantalla "Mi entrenamiento" del cliente (HU5, FR-017 a FR-018).

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import MiEntrenamiento from '../pages/MiEntrenamiento.jsx';
import { simularServidor } from './servidorFalso.js';

afterEach(() => {
  delete global.fetch;
});

describe('Mi entrenamiento', () => {
  it('muestra la rutina, los objetivos y la evolución del cliente', async () => {
    simularServidor([
      {
        ruta: '/api/rutinas/yo',
        cuerpo: {
          rutina: {
            nombre: 'Full body',
            estado: 'activa',
            ejercicios: [{ id: 1, nombre: 'Sentadilla', orden: 1, series: 3 }],
          },
        },
      },
      { ruta: '/api/objetivos/yo', cuerpo: { objetivos: [{ id: 1, descripcion: 'Bajar peso', estado: 'en_progreso' }] } },
      {
        ruta: '/api/progresos/yo',
        cuerpo: {
          progresos: [{ id: 1, valor: 80, unidad: 'kg', observaciones: 'Inicio', fechaRegistro: '2026-01-01' }],
        },
      },
    ]);

    render(<MiEntrenamiento />);

    expect(await screen.findByText('Full body')).toBeInTheDocument();
    expect(screen.getByText('Sentadilla')).toBeInTheDocument();
    expect(screen.getByText(/Bajar peso/)).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
  });

  it('informa cuando el cliente aún no tiene rutina', async () => {
    simularServidor([
      {
        ruta: '/api/rutinas/yo',
        status: 404,
        cuerpo: { codigo: 'SIN_RUTINA', mensaje: 'El cliente no tiene una rutina activa.' },
      },
      { ruta: '/api/objetivos/yo', cuerpo: { objetivos: [] } },
      { ruta: '/api/progresos/yo', cuerpo: { progresos: [] } },
    ]);

    render(<MiEntrenamiento />);

    expect(await screen.findByText('Aún no tienes una rutina asignada.')).toBeInTheDocument();
  });
});
