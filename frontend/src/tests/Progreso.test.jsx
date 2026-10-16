// Prueba de objetivos y progreso del entrenador (HU4, FR-013 a FR-016).

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Progreso from '../pages/Progreso.jsx';
import { simularServidor } from './servidorFalso.js';

afterEach(() => {
  delete global.fetch;
});

const ASIGNACIONES = {
  asignaciones: [{ id: 1, idCliente: 7, cliente: 'Luis Gómez', estado: 'activa' }],
};

const OBJETIVOS = { objetivos: [{ id: 1, descripcion: 'Bajar peso', estado: 'en_progreso' }] };

const PROGRESOS = {
  progresos: [
    { id: 1, valor: 80, unidad: 'kg', observaciones: 'Inicio', fechaRegistro: '2026-01-01' },
  ],
};

describe('Objetivos y progreso', () => {
  it('muestra objetivos y progresos del cliente seleccionado', async () => {
    simularServidor([
      { ruta: '/api/asignaciones/yo', cuerpo: ASIGNACIONES },
      { ruta: '/api/objetivos/cliente/7', cuerpo: OBJETIVOS },
      { ruta: '/api/progresos/cliente/7', cuerpo: PROGRESOS },
    ]);

    render(<Progreso />);
    await screen.findByText('Luis Gómez');

    fireEvent.change(screen.getByLabelText('Cliente *'), { target: { value: '7' } });

    expect(await screen.findByText('Bajar peso')).toBeInTheDocument();
    expect(screen.getByText('80')).toBeInTheDocument();
    expect(screen.getByText('Inicio')).toBeInTheDocument();
  });

  it('registra un progreso y muestra el mensaje de éxito', async () => {
    simularServidor([
      { ruta: '/api/asignaciones/yo', cuerpo: ASIGNACIONES },
      { ruta: '/api/objetivos/cliente/7', cuerpo: OBJETIVOS },
      { ruta: '/api/progresos/cliente/7', cuerpo: { progresos: [] } },
      { metodo: 'POST', ruta: '/api/progresos', cuerpo: { mensaje: 'Progreso registrado correctamente.' } },
    ]);

    render(<Progreso />);
    await screen.findByText('Luis Gómez');
    fireEvent.change(screen.getByLabelText('Cliente *'), { target: { value: '7' } });

    fireEvent.change(screen.getByLabelText('Valor *'), { target: { value: '78' } });
    fireEvent.submit(screen.getByRole('button', { name: 'Registrar progreso' }));

    expect(await screen.findByText('Progreso registrado correctamente.')).toBeInTheDocument();
  });
});
