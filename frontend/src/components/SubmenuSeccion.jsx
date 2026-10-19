// Menú de secciones (submenú en píldoras) de cada módulo.
// Solo muestra las vistas a las que el rol actual tiene acceso.

import { NavLink } from 'react-router-dom';

export default function SubmenuSeccion({ base, vistas }) {
  if (vistas.length < 2) return null;

  return (
    <nav className="subnav" aria-label="Secciones del módulo">
      {vistas.map((vista) => (
        <NavLink
          key={vista.ruta}
          end={vista.ruta === ''}
          to={vista.ruta === '' ? base : `${base}/${vista.ruta}`}
          className={({ isActive }) => (isActive ? 'subnav-enlace activo' : 'subnav-enlace')}
        >
          {vista.etiqueta}
        </NavLink>
      ))}
    </nav>
  );
}
