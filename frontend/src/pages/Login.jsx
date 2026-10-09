// Pantalla de inicio de sesión (HU1, FR-001, FR-005).

import { useState } from 'react';
import { pedir } from '../services/api.js';
import { useSesion } from '../context/SesionContext.jsx';

export default function Login() {
  const { iniciarSesion } = useSesion();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar(evento) {
    evento.preventDefault();
    setError('');

    // Validación espejo: la autoridad sigue siendo el backend (FR-018).
    if (!correo.trim() || !password) {
      setError('Revise los datos enviados.');
      return;
    }

    setCargando(true);
    try {
      const respuesta = await pedir('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ correo: correo.trim(), password }),
      });
      iniciarSesion(respuesta.token, respuesta.usuario);
    } catch (err) {
      // Mensaje genérico del backend: no revela si el correo existe.
      setError(err.message || 'No se pudo iniciar sesión.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="contenedor-login">
      <form className="tarjeta formulario-login" onSubmit={enviar}>
        <h1>Iniciar sesión</h1>
        <p className="textosuave">Sistema de Gestión para Gimnasio</p>

        {error && <div className="mensaje-error">{error}</div>}

        <div className="campo">
          <label htmlFor="correo">Correo</label>
          <input
            id="correo"
            type="email"
            autoComplete="username"
            value={correo}
            onChange={(evento) => setCorreo(evento.target.value)}
            required
          />
        </div>

        <div className="campo">
          <label htmlFor="password">Contraseña</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(evento) => setPassword(evento.target.value)}
            required
          />
        </div>

        <button type="submit" disabled={cargando}>
          {cargando ? 'Ingresando…' : 'Ingresar'}
        </button>
      </form>
    </div>
  );
}
