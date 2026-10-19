// Menú superior flotante en cápsula (pill header) del sistema de diseño
// Dark Fitness & Warm Orange Accent. Solo se muestra con sesión iniciada.

import { NavLink } from 'react-router-dom';
import { useSesion } from '../context/SesionContext.jsx';

// Enlaces de navegación filtrados por rol (FR-006): ocultar opciones no es una
// medida de seguridad, el backend valida cada permiso.
const ENLACES = [
  { ruta: '/dashboard', etiqueta: 'Dashboard', roles: ['administrador', 'recepcionista', 'entrenador'] },
  { ruta: '/users', etiqueta: 'Usuarios', roles: ['administrador'] },
  { ruta: '/clients', etiqueta: 'Clientes', roles: ['administrador', 'recepcionista', 'entrenador'] },
  { ruta: '/memberships', etiqueta: 'Membresías', roles: ['administrador', 'recepcionista', 'entrenador'] },
  { ruta: '/payments', etiqueta: 'Pagos', roles: ['administrador', 'recepcionista'] },
  { ruta: '/access', etiqueta: 'Acceso', roles: ['administrador', 'recepcionista'] },
  { ruta: '/training', etiqueta: 'Entrenamiento', roles: ['administrador', 'recepcionista', 'entrenador'] },
  { ruta: '/me/training', etiqueta: 'Mi entrenamiento', roles: ['cliente'] },
  { ruta: '/me/profile', etiqueta: 'Mi perfil', roles: ['cliente'] },
];

// Icono deportivo del branding (mancuerna).
function IconoMancuerna() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" />
    </svg>
  );
}

export default function Navbar() {
  const { usuario, cerrarSesion } = useSesion();
  const visibles = ENLACES.filter((enlace) => enlace.roles.includes(usuario?.rol));

  return (
    <header className="navbar">
      <div className="navbar-marca">
        <IconoMancuerna />
        <strong>GYM ACCESS</strong>
      </div>

      <nav className="navbar-enlaces" aria-label="Navegación principal">
        {visibles.map((enlace) => (
          <NavLink
            key={enlace.ruta}
            to={enlace.ruta}
            className={({ isActive }) => (isActive ? 'navbar-enlace activo' : 'navbar-enlace')}
          >
            {enlace.etiqueta}
          </NavLink>
        ))}
      </nav>

      <div className="navbar-acciones">
        <span className="navbar-usuario">
          {usuario?.nombre} · {usuario?.rol}
        </span>
        <button type="button" className="navbar-sesion" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </div>
    </header>
  );
}
