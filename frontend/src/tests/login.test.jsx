// Prueba de la pantalla de inicio de sesión (HU1).

import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SesionProvider } from '../context/SesionContext.jsx';
import Login from '../pages/Login.jsx';

function pintar() {
  return render(
    <SesionProvider>
      <Login />
    </SesionProvider>
  );
}

describe('Pantalla de inicio de sesión', () => {
  it('muestra los campos de correo y contraseña con textos en español', () => {
    pintar();

    expect(screen.getByLabelText('Correo')).toBeInTheDocument();
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Ingresar' })).toBeInTheDocument();
  });

  it('muestra un mensaje de error cuando el formulario está vacío', async () => {
    pintar();

    fireEvent.submit(screen.getByRole('button', { name: 'Ingresar' }));

    expect(await screen.findByText('Revise los datos enviados.')).toBeInTheDocument();
  });
});
