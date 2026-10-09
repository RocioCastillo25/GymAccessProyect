// Consulta de la información propia del cliente (HU7, FR-017, RN-14).

import { useEffect, useState } from 'react';
import { pedir } from '../services/api.js';

export default function MiPerfil() {
  const [cliente, setCliente] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let activo = true;
    (async () => {
      try {
        const respuesta = await pedir('/api/clientes/yo');
        if (activo) {
          setCliente(respuesta.cliente);
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

  if (cargando) return <p className="textosuave">Cargando su información…</p>;
  if (error) return <div className="mensaje-error">{error}</div>;
  if (!cliente) return <p className="textosuave">No se encontró su registro de cliente.</p>;

  return (
    <section className="tarjeta formulario">
      <h2>Mi información</h2>
      <table className="tabla">
        <tbody>
          <tr>
            <th>Nombre</th>
            <td>{cliente.nombre}</td>
          </tr>
          <tr>
            <th>Apellido</th>
            <td>{cliente.apellido}</td>
          </tr>
          <tr>
            <th>Correo</th>
            <td>{cliente.correo}</td>
          </tr>
          <tr>
            <th>Teléfono</th>
            <td>{cliente.telefono || '—'}</td>
          </tr>
          <tr>
            <th>Dirección</th>
            <td>{cliente.direccion || '—'}</td>
          </tr>
          <tr>
            <th>Fecha de registro</th>
            <td>{new Date(cliente.fecha_registro).toLocaleDateString('es-MX')}</td>
          </tr>
          <tr>
            <th>Estado</th>
            <td>
              <span className={`etiqueta-estado ${cliente.estado}`}>{cliente.estado}</span>
            </td>
          </tr>
        </tbody>
      </table>
      <p className="textosuave">
        Esta es su información registrada. Para modificarla, contacte al personal del gimnasio.
      </p>
    </section>
  );
}
