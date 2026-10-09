// Listado de clientes con los campos permitidos según el rol (HU6, FR-016).

import { useEffect, useState } from 'react';
import { pedir } from '../services/api.js';
import { useSesion } from '../context/SesionContext.jsx';

export default function ClientesLista() {
  const { rol } = useSesion();
  const [clientes, setClientes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const entrenador = rol === 'entrenador';

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const respuesta = await pedir('/api/clientes');
        if (activo) {
          setClientes(respuesta.clientes);
          setError('');
        }
      } catch (err) {
        if (activo) setError(err.message);
      } finally {
        if (activo) setCargando(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, []);

  return (
    <section className="tarjeta">
      <h2>Clientes</h2>

      {cargando && <p className="textosuave">Cargando clientes…</p>}
      {error && <div className="mensaje-error">{error}</div>}

      {!cargando && !error && clientes.length === 0 && (
        <p className="textosuave">No hay clientes registrados todavía.</p>
      )}

      {!cargando && clientes.length > 0 && (
        <table className="tabla">
          <thead>
            <tr>
              <th>Id</th>
              <th>Nombre</th>
              <th>Apellido</th>
              {!entrenador && <th>Correo</th>}
              {!entrenador && <th>Teléfono</th>}
              {!entrenador && <th>Estado</th>}
              {entrenador && <th>Estado</th>}
            </tr>
          </thead>
          <tbody>
            {clientes.map((cliente) => (
              <tr key={cliente.id}>
                <td>{cliente.id}</td>
                <td>{cliente.nombre}</td>
                <td>{cliente.apellido}</td>
                {!entrenador && <td>{cliente.correo}</td>}
                {!entrenador && <td>{cliente.telefono || '—'}</td>}
                <td>
                  <span className={`etiqueta-estado ${cliente.estado}`}>{cliente.estado}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
