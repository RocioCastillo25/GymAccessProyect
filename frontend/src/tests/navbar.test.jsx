// Prueba del menú superior flotante por rol (HU1, FR-006).

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SesionProvider } from '../context/SesionContext.jsx';
import Navbar from '../components/Navbar.jsx';

function pintarConRol(rol) {
  localStorage.setItem(
    'gymaccess_usuario',
    JSON.stringify({ id: 1, nombre: 'Usuario Prueba', correo: 'prueba@local', rol })
  );
  localStorage.setItem('gymaccess_token', 'token-de-prueba');

  return render(
    <SesionProvider>
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>
    </SesionProvider>
  );
}

describe('Menú superior por rol', () => {
  it('muestra las opciones de administrador', () => {
    pintarConRol('administrador');

    expect(screen.getByRole('link', { name: 'Usuarios' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Clientes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Mi perfil' })).not.toBeInTheDocument();
  });

  it('muestra solo la consulta de clientes al entrenador', () => {
    pintarConRol('entrenador');

    expect(screen.getByRole('link', { name: 'Clientes' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Entrenamiento' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Pagos' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Mi perfil' })).not.toBeInTheDocument();
  });

  it('muestra únicamente su información al cliente', () => {
    pintarConRol('cliente');

    expect(screen.getByRole('link', { name: 'Mi perfil' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Mi entrenamiento' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Usuarios' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Pagos' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Clientes' })).not.toBeInTheDocument();
  });

  it('ofrece cerrar sesión', () => {
    pintarConRol('recepcionista');

    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
  });
});
