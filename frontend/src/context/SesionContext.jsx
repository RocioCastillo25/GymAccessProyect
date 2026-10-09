// Contexto global de sesión: token, usuario y rol (investigación R4 y R6).

import { createContext, useContext, useEffect, useState } from 'react';
import {
  guardarSesion,
  obtenerToken,
  obtenerUsuarioGuardado,
  limpiarSesion,
} from '../services/api.js';

const SesionContexto = createContext(null);

export function SesionProvider({ children }) {
  const [token, setToken] = useState(() => obtenerToken());
  const [usuario, setUsuario] = useState(() => obtenerUsuarioGuardado());

  useEffect(() => {
    // El cliente HTTP avisa cuando el backend responde 401 (token expirado).
    const alExpirar = () => {
      setToken(null);
      setUsuario(null);
    };
    window.addEventListener('sesion-expirada', alExpirar);
    return () => window.removeEventListener('sesion-expirada', alExpirar);
  }, []);

  const iniciarSesion = (nuevoToken, nuevoUsuario) => {
    guardarSesion(nuevoToken, nuevoUsuario);
    setToken(nuevoToken);
    setUsuario(nuevoUsuario);
  };

  const cerrarSesion = () => {
    limpiarSesion();
    setToken(null);
    setUsuario(null);
  };

  const valor = {
    token,
    usuario,
    autenticado: Boolean(token && usuario),
    rol: usuario?.rol || null,
    iniciarSesion,
    cerrarSesion,
  };

  return <SesionContexto.Provider value={valor}>{children}</SesionContexto.Provider>;
}

export function useSesion() {
  return useContext(SesionContexto);
}
