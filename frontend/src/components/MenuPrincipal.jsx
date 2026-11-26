// Menú principal filtrado por rol (FR-006).
// Ocultar opciones NO es una medida de seguridad: el backend valida cada permiso.

import { useSesion } from '../context/SesionContext.jsx';

// Opciones disponibles por rol en el Sprint 1 (project-context.md §6 y FR-014 a FR-017).
const OPCIONES = [
  { id: 'usuarios', etiqueta: 'Usuarios', roles: ['administrador'] },
  { id: 'clientes-lista', etiqueta: 'Clientes', roles: ['administrador', 'recepcionista', 'entrenador'] },
  { id: 'clientes-registro', etiqueta: 'Registrar cliente', roles: ['administrador', 'recepcionista'] },
  { id: 'clientes-edicion', etiqueta: 'Modificar cliente', roles: ['administrador', 'recepcionista'] },
  { id: 'mi-perfil', etiqueta: 'Mi información', roles: ['cliente'] },
];

export default function MenuPrincipal({ vistaActual, onNavegar }) {
  const { usuario, cerrarSesion } = useSesion();

  const visibles = OPCIONES.filter((opcion) => opcion.roles.includes(usuario?.rol));

  return (
    <header className="menu-principal">
      <div className="marca">
        <strong>Gimnasio</strong> · {usuario?.nombre} ({usuario?.rol})
      </div>

      <nav>
        <button
          type="button"
          className={vistaActual === 'inicio' ? '' : 'secundario'}
          onClick={() => onNavegar('inicio')}
        >
          Inicio
        </button>
        {visibles.map((opcion) => (
          <button
            key={opcion.id}
            type="button"
            className={vistaActual === opcion.id ? '' : 'secundario'}
            onClick={() => onNavegar(opcion.id)}
          >
            {opcion.etiqueta}
          </button>
        ))}
      </nav>

      <button type="button" className="secundario" onClick={cerrarSesion}>
        Cerrar sesión
      </button>
    </header>
  );
}
