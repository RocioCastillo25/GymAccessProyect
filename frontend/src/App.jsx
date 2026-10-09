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

// Registro de vistas: cada historia de usuario añade su página aquí.
const VISTAS = {
  inicio: null,
  'clientes-registro': ClientesRegistro,
  'clientes-edicion': ClientesEdicion,
  'clientes-lista': ClientesLista,
  usuarios: Usuarios,
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
