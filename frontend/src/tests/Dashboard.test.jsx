// Prueba del dashboard por rol (HU6, FR-019 a FR-021).

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SesionProvider } from '../context/SesionContext.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import { simularServidor } from './servidorFalso.js';

afterEach(() => {
  delete global.fetch;
});

function pintarConRol(rol) {
  localStorage.setItem(
    'gymaccess_usuario',
    JSON.stringify({ id: 1, nombre: 'Usuario Prueba', correo: 'prueba@local', rol })
  );
  localStorage.setItem('gymaccess_token', 'token-de-prueba');

  return render(
    <SesionProvider>
      <Dashboard />
    </SesionProvider>
  );
}

describe('Dashboard', () => {
  it('muestra el resumen general para el administrador', async () => {
    simularServidor([
      { ruta: '/api/dashboard', cuerpo: { resumen: { clientesActivos: 3, rutinasActivas: 2 } } },
    ]);

    pintarConRol('administrador');

    expect(await screen.findByText('Clientes activos')).toBeInTheDocument();
    expect(screen.getByText('Rutinas activas')).toBeInTheDocument();
  });

  it('muestra el resumen operativo para el recepcionista', async () => {
    simularServidor([
      { ruta: '/api/dashboard/personal', cuerpo: { resumen: { asignacionesActivas: 2 } } },
    ]);

    pintarConRol('recepcionista');

    expect(await screen.findByText('Clientes con entrenador')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
