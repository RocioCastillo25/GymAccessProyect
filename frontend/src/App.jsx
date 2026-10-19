// Componente raíz: sesión y navegación por rutas independientes por módulo.
// Cada módulo vive en su propia URL limpia (/dashboard, /clients, /training...)
// y el menú superior flotante solo aparece con sesión iniciada.

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SesionProvider, useSesion } from './context/SesionContext.jsx';
import Navbar from './components/Navbar.jsx';
import SubmenuSeccion from './components/SubmenuSeccion.jsx';
import Login from './pages/Login.jsx';
import ClientesRegistro from './pages/ClientesRegistro.jsx';
import ClientesEdicion from './pages/ClientesEdicion.jsx';
import ClientesLista from './pages/ClientesLista.jsx';
import Usuarios from './pages/Usuarios.jsx';
import MiPerfil from './pages/MiPerfil.jsx';
import TiposMembresia from './pages/TiposMembresia.jsx';
import Membresias from './pages/Membresias.jsx';
import PagosRegistro from './pages/PagosRegistro.jsx';
import Acceso from './pages/Acceso.jsx';
import Entrenadores from './pages/Entrenadores.jsx';
import Asignaciones from './pages/Asignaciones.jsx';
import Rutinas from './pages/Rutinas.jsx';
import Progreso from './pages/Progreso.jsx';
import Dashboard from './pages/Dashboard.jsx';
import PersonalAsignado from './pages/PersonalAsignado.jsx';
import MiEntrenamiento from './pages/MiEntrenamiento.jsx';

const ROLES_ADMIN = ['administrador'];
const ROLES_RECEPCION = ['administrador', 'recepcionista'];

// Registro de módulos: cada módulo agrupa sus vistas bajo una ruta base.
const MODULOS = [
  {
    base: '/dashboard',
    titulo: 'Dashboard',
    vistas: [{ ruta: '', Componente: Dashboard, roles: ['administrador', 'recepcionista', 'entrenador'] }],
  },
  {
    base: '/users',
    titulo: 'Usuarios',
    vistas: [{ ruta: '', Componente: Usuarios, roles: ROLES_ADMIN }],
  },
  {
    base: '/clients',
    titulo: 'Clientes',
    vistas: [
      {
        ruta: '',
        etiqueta: 'Consulta',
        Componente: ClientesLista,
        roles: ['administrador', 'recepcionista', 'entrenador'],
      },
      { ruta: 'new', etiqueta: 'Registro', Componente: ClientesRegistro, roles: ROLES_RECEPCION },
      { ruta: 'edit', etiqueta: 'Modificación', Componente: ClientesEdicion, roles: ROLES_RECEPCION },
    ],
  },
  {
    base: '/memberships',
    titulo: 'Membresías',
    vistas: [
      { ruta: '', etiqueta: 'Asignación', Componente: Membresias, roles: ROLES_RECEPCION },
      {
        ruta: 'types',
        etiqueta: 'Tipos',
        Componente: TiposMembresia,
        roles: ['administrador', 'recepcionista', 'entrenador'],
      },
    ],
  },
  {
    base: '/payments',
    titulo: 'Pagos',
    vistas: [{ ruta: '', Componente: PagosRegistro, roles: ROLES_RECEPCION }],
  },
  {
    base: '/access',
    titulo: 'Acceso',
    vistas: [{ ruta: '', Componente: Acceso, roles: ROLES_RECEPCION }],
  },
  {
    base: '/training',
    titulo: 'Entrenamiento',
    vistas: [
      { ruta: '', etiqueta: 'Entrenadores', Componente: Entrenadores, roles: ROLES_ADMIN },
      { ruta: 'assignments', etiqueta: 'Asignaciones', Componente: Asignaciones, roles: ROLES_RECEPCION },
      { ruta: 'staff', etiqueta: 'Personal asignado', Componente: PersonalAsignado, roles: ROLES_RECEPCION },
      { ruta: 'routines', etiqueta: 'Rutinas', Componente: Rutinas, roles: ['entrenador'] },
      { ruta: 'progress', etiqueta: 'Objetivos y progreso', Componente: Progreso, roles: ['entrenador'] },
    ],
  },
  {
    base: '/me/training',
    titulo: 'Mi entrenamiento',
    vistas: [{ ruta: '', Componente: MiEntrenamiento, roles: ['cliente'] }],
  },
  {
    base: '/me/profile',
    titulo: 'Mi perfil',
    vistas: [{ ruta: '', Componente: MiPerfil, roles: ['cliente'] }],
  },
];

// Destino inicial permitido para cada rol.
function inicioPermitido(rol) {
  return rol === 'cliente' ? '/me/training' : '/dashboard';
}

// Renderiza las vistas de un módulo con su submenú y el control de roles.
function Modulo({ config }) {
  const { rol } = useSesion();
  const visibles = config.vistas.filter((vista) => vista.roles.includes(rol));

  if (visibles.length === 0) {
    return <Navigate to={inicioPermitido(rol)} replace />;
  }

  const principal = visibles.find((vista) => vista.ruta === '') || visibles[0];
  const Principal = principal.Componente;
  const rutaPrincipal = principal.ruta === '' ? config.base : `${config.base}/${principal.ruta}`;

  return (
    <div className="modulo">
      <SubmenuSeccion base={config.base} vistas={visibles.filter((vista) => vista.etiqueta)} />

      <Routes>
        <Route
          index
          element={principal.ruta === '' ? <Principal /> : <Navigate to={rutaPrincipal} replace />}
        />
        {visibles
          .filter((vista) => vista.ruta !== '')
          .map((vista) => {
            const Vista = vista.Componente;
            return <Route key={vista.ruta} path={vista.ruta} element={<Vista />} />;
          })}
        <Route path="*" element={<Navigate to={rutaPrincipal} replace />} />
      </Routes>
    </div>
  );
}

// Pantalla inicial: redirige al módulo permitido según el rol.
function Inicio() {
  const { rol } = useSesion();
  return <Navigate to={inicioPermitido(rol)} replace />;
}

// Esquema autenticado: navbar flotante + contenido de la ruta activa.
function EsquemaAplicacion() {
  const { autenticado } = useSesion();

  if (!autenticado) {
    return <Login />;
  }

  return (
    <div className="aplicacion">
      <Navbar />
      <main className="contenido">
        <Routes>
          <Route path="/" element={<Inicio />} />
          {MODULOS.map((config) => (
            <Route key={config.base} path={`${config.base}/*`} element={<Modulo config={config} />} />
          ))}
          <Route path="*" element={<Inicio />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <SesionProvider>
      <BrowserRouter>
        <EsquemaAplicacion />
      </BrowserRouter>
    </SesionProvider>
  );
}
