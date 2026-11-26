// Prueba del menú principal por rol (HU1, FR-006).

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SesionProvider } from '../context/SesionContext.jsx';
import MenuPrincipal from '../components/MenuPrincipal.jsx';

function pintarConRol(rol) {
  localStorage.setItem(
    'gymaccess_usuario',
    JSON.stringify({ id: 1, nombre: 'Usuario Prueba', correo: 'prueba@local', rol })
  );
  localStorage.setItem('gymaccess_token', 'token-de-prueba');

  return render(
    <SesionProvider>
      <MenuPrincipal vistaActual="inicio" onNavegar={() => {}} />
    </SesionProvider>
  );
}

describe('Menú principal por rol', () => {
  it('muestra las opciones de administrador', () => {
    pintarConRol('administrador');

    expect(screen.getByText('Usuarios')).toBeInTheDocument();
    expect(screen.getByText('Registrar cliente')).toBeInTheDocument();
    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.queryByText('Mi información')).not.toBeInTheDocument();
  });

  it('muestra solo la consulta de clientes al entrenador', () => {
    pintarConRol('entrenador');

    expect(screen.getByText('Clientes')).toBeInTheDocument();
    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument();
    expect(screen.queryByText('Registrar cliente')).not.toBeInTheDocument();
    expect(screen.queryByText('Mi información')).not.toBeInTheDocument();
  });

  it('muestra únicamente su información al cliente', () => {
    pintarConRol('cliente');

    expect(screen.getByText('Mi información')).toBeInTheDocument();
    expect(screen.queryByText('Usuarios')).not.toBeInTheDocument();
    expect(screen.queryByText('Registrar cliente')).not.toBeInTheDocument();
    expect(screen.queryByText('Clientes')).not.toBeInTheDocument();
  });

  it('ofrece cerrar sesión', () => {
    pintarConRol('recepcionista');

    expect(screen.getByRole('button', { name: 'Cerrar sesión' })).toBeInTheDocument();
  });
});
