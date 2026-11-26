// T025 - Pruebas de las alertas de vencimiento del dashboard (US3).

import { describe, it, expect, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SesionProvider } from '../context/SesionContext.jsx';
import Dashboard from '../pages/Dashboard.jsx';
import { simularServidor } from './servidorFalso.js';
import { aInputFecha } from './helpersReportes.jsx';

const fechaFin = aInputFecha(new Date());

function pintarDashboard(rol) {
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

function rutaResumen(rol) {
  return rol === 'administrador' ? '/api/dashboard' : '/api/dashboard/personal';
}

function alerta() {
  return {
    alertas: [
      {
        idMembresia: 5,
        cliente: 'Ana Vencida',
        tipoMembresia: 'Mensual',
        fechaFin,
        diasRestantes: 2,
      },
    ],
  };
}

afterEach(() => {
  delete global.fetch;
});

describe('Alertas de vencimiento próximo', () => {
  it('muestra la alerta al administrador con el color de advertencia', async () => {
    simularServidor([
      { ruta: '/api/dashboard', cuerpo: { resumen: { clientesActivos: 3 } } },
      { ruta: '/api/reports/expiring-memberships', cuerpo: alerta() },
    ]);

    pintarDashboard('administrador');

    expect(
      await screen.findByRole('heading', { name: 'Alertas de vencimiento próximo' })
    ).toBeInTheDocument();
    expect(screen.getByText('Ana Vencida')).toBeInTheDocument();
    expect(screen.getByText('Mensual')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('2').closest('td').querySelector('.advertencia')).not.toBeNull();
  });

  it('muestra la alerta también al recepcionista', async () => {
    simularServidor([
      { ruta: '/api/dashboard/personal', cuerpo: { resumen: { asignacionesActivas: 1 } } },
      { ruta: '/api/reports/expiring-memberships', cuerpo: alerta() },
    ]);

    pintarDashboard('recepcionista');

    expect(await screen.findByText('Ana Vencida')).toBeInTheDocument();
  });

  it('muestra el mensaje cuando no hay membresías por vencer', async () => {
    simularServidor([
      { ruta: '/api/dashboard', cuerpo: { resumen: {} } },
      { ruta: '/api/reports/expiring-memberships', cuerpo: { alertas: [] } },
    ]);

    pintarDashboard('administrador');

    expect(
      await screen.findByText('No hay membresías por vencer en los próximos 5 días.')
    ).toBeInTheDocument();
  });

  it('oculta la sección y no consulta alertas para el entrenador', async () => {
    const servidor = simularServidor([
      { ruta: rutaResumen('entrenador'), cuerpo: { resumen: { rutinasActivas: 2 } } },
    ]);

    pintarDashboard('entrenador');

    expect(await screen.findByText('Rutinas activas')).toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Alertas de vencimiento próximo' })
    ).not.toBeInTheDocument();
    expect(
      servidor.mock.calls.some(([ruta]) => ruta === '/api/reports/expiring-memberships')
    ).toBe(false);
  });

  it('muestra el mensaje de error cuando falla la consulta de alertas', async () => {
    simularServidor([
      { ruta: rutaResumen('administrador'), cuerpo: { resumen: {} } },
      {
        ruta: '/api/reports/expiring-memberships',
        cuerpo: { mensaje: 'No tiene permiso para consultar las alertas.' },
        status: 403,
      },
    ]);

    pintarDashboard('administrador');

    expect(
      await screen.findByText('No tiene permiso para consultar las alertas.')
    ).toBeInTheDocument();
  });
});
