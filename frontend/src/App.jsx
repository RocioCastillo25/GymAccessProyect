// Componente raíz: controla la sesión y la navegación por estado entre páginas
// (investigación R4: sin dependencia de enrutador).

import { useState } from 'react';
import { SesionProvider, useSesion } from './context/SesionContext.jsx';
import MenuPrincipal from './components/MenuPrincipal.jsx';
import Login from './pages/Login.jsx';
import ClientesRegistro from './pages/ClientesRegistro.jsx';
import ClientesEdicion from './pages/ClientesEdicion.jsx';
import ClientesLista from './pages/ClientesLista.jsx';
import Usuarios from './pages/Usuarios.jsx';
import MiPerfil from './pages/MiPerfil.jsx';
import TiposMembresia from './pages/TiposMembresia.jsx';
import Membresias from './pages/Membresias.jsx';
import PagosRegistro from './pages/PagosRegistro.jsx';
import Entrenadores from './pages/Entrenadores.jsx';
import Asignaciones from './pages/Asignaciones.jsx';
import Rutinas from './pages/Rutinas.jsx';
import Progreso from './pages/Progreso.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PersonalAsignado from './pages/PersonalAsignado.jsx';
import MiEntrenamiento from './pages/MiEntrenamiento.jsx';

// Registro de vistas: cada historia de usuario añade su página aquí.
const VISTAS = {
  inicio: null,
  'clientes-registro': ClientesRegistro,
  'clientes-edicion': ClientesEdicion,
  'clientes-lista': ClientesLista,
  usuarios: Usuarios,
  'tipos-membresia': TiposMembresia,
  membresias: Membresias,
  'pagos-registro': PagosRegistro,
  entrenadores: Entrenadores,
  asignaciones: Asignaciones,
  rutinas: Rutinas,
  progreso: Progreso,
  dashboard: Dashboard,
  'personal-asignado': PersonalAsignado,
  'mi-entrenamiento': MiEntrenamiento,
  'mi-perfil': MiPerfil,
};

function Aplicacion() {
  const { autenticado } = useSesion();
  const [vista, setVista] = useState('inicio');

  if (!autenticado) {
    return <Login />;
  }

  const Contenido = VISTAS[vista];

  return (
    <div className="aplicacion">
      <MenuPrincipal vistaActual={vista} onNavegar={setVista} />
      <main className="contenido">
        {Contenido ? (
          <Contenido />
        ) : (
          <section className="tarjeta">
            <h2>Bienvenido</h2>
            <p>
              Seleccione una opción del menú. Con su rol actual no hay secciones disponibles más
              allá de esta bienvenida.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SesionProvider>
      <Aplicacion />
    </SesionProvider>
  );
}
