// Prueba de la navegación por rutas independientes y del control de acceso por rol.

import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App.jsx';

function responder(ruta) {
  if (ruta === '/api/rutinas/yo') return { rutina: null };
  if (ruta === '/api/objetivos/yo') return { objetivos: [] };
  if (ruta === '/api/progresos/yo') return { progresos: [] };
  if (ruta === '/api/clientes') return { clientes: [] };
  if (ruta === '/api/membresias') return { membresias: [] };
  if (ruta.startsWith('/api/dashboard')) return { resumen: { clientesActivos: 1 } };
  return {};
}

function simularApi() {
  global.fetch = vi.fn(async (ruta) => ({
    ok: true,
    status: 200,
    json: async () => responder(ruta),
  }));
}

function autenticar(rol) {
  localStorage.setItem(
    'gymaccess_usuario',
    JSON.stringify({ id: 1, nombre: 'Usuario Prueba', correo: 'prueba@local', rol })
  );
  localStorage.setItem('gymaccess_token', 'token-de-prueba');
}

afterEach(() => {
  delete global.fetch;
  window.history.pushState({}, '', '/');
});

describe('Navegación por módulos', () => {
  it('muestra el login cuando no hay sesión iniciada', () => {
    window.history.pushState({}, '', '/dashboard');
    simularApi();

    render(<App />);

    expect(screen.getByRole('heading', { name: 'Iniciar sesión' })).toBeInTheDocument();
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
  });

  it('abre el dashboard del administrador desde la raíz', async () => {
    autenticar('administrador');
    simularApi();
    window.history.pushState({}, '', '/');

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Dashboard administrativo' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Clientes' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/dashboard');
  });

  it('muestra el submenú de clientes en la ruta /clients', async () => {
    autenticar('recepcionista');
    simularApi();
    window.history.pushState({}, '', '/clients');

    render(<App />);

    expect(await screen.findByRole('heading', { name: 'Clientes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Registro' })).toBeInTheDocument();
    expect(window.location.pathname).toBe('/clients');
  });

  it('redirige al cliente que intenta entrar a /users', async () => {
    autenticar('cliente');
    simularApi();
    window.history.pushState({}, '', '/users');

    render(<App />);

    await waitFor(() => expect(window.location.pathname).toBe('/me/training'));
    expect(await screen.findByRole('heading', { name: 'Mi rutina' })).toBeInTheDocument();
  });

  it('redirige al entrenador que intenta entrar a /payments', async () => {
    autenticar('entrenador');
    simularApi();
    window.history.pushState({}, '', '/payments');

    render(<App />);

    await waitFor(() => expect(window.location.pathname).toBe('/dashboard'));
    expect(await screen.findByRole('heading', { name: 'Resumen operativo' })).toBeInTheDocument();
  });
});
