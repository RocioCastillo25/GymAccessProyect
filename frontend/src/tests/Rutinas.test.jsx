// Prueba de la creación de rutinas (HU3, FR-009 a FR-012).

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Rutinas from '../pages/Rutinas.jsx';
import { simularServidor } from './servidorFalso.js';

afterEach(() => {
  delete global.fetch;
});

const ASIGNACIONES = {
  asignaciones: [{ id: 1, idCliente: 7, cliente: 'Luis Gómez', estado: 'activa' }],
};

const RUTINAS = {
  rutinas: [
    {
      id: 1,
      nombre: 'Full body',
      estado: 'activa',
      descripcion: 'Tres días por semana',
      ejercicios: [{ id: 1, nombre: 'Sentadilla', series: 3, repeticiones: '10' }],
    },
  ],
};

describe('Creación de rutinas', () => {
  it('lista las rutinas del cliente seleccionado', async () => {
    simularServidor([
      { ruta: '/api/asignaciones/yo', cuerpo: ASIGNACIONES },
      { ruta: '/api/rutinas/cliente/7', cuerpo: RUTINAS },
    ]);

    render(<Rutinas />);
    await screen.findByText('Luis Gómez');

    fireEvent.change(screen.getByLabelText('Cliente a su cargo *'), { target: { value: '7' } });

    expect(await screen.findByText('Full body')).toBeInTheDocument();
    expect(screen.getByText(/Sentadilla/)).toBeInTheDocument();
  });

  it('crea una rutina con un ejercicio y muestra el mensaje de éxito', async () => {
    simularServidor([
      { ruta: '/api/asignaciones/yo', cuerpo: ASIGNACIONES },
      { ruta: '/api/rutinas/cliente/7', cuerpo: { rutinas: [] } },
      { metodo: 'POST', ruta: '/api/rutinas', cuerpo: { mensaje: 'Rutina creada correctamente.' } },
    ]);

    render(<Rutinas />);
    await screen.findByText('Luis Gómez');
    fireEvent.change(screen.getByLabelText('Cliente a su cargo *'), { target: { value: '7' } });

    fireEvent.change(screen.getByLabelText('Nombre *'), { target: { value: 'Full body' } });
    fireEvent.change(screen.getByPlaceholderText('Nombre del ejercicio'), {
      target: { value: 'Sentadilla' },
    });
    fireEvent.submit(screen.getByRole('button', { name: 'Crear rutina' }));

    expect(await screen.findByText('Rutina creada correctamente.')).toBeInTheDocument();
  });
});
