// Historial propio de accesos del cliente (FR-027).

import { useCallback, useEffect, useState } from 'react';
import { pedir } from '../services/api.js';

function formatearFechaHora(valor) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleString('es-GT');
}

export default function MisAccesos() {
  const [accesos, setAccesos] = useState([]);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      setError('');
      const respuesta = await pedir('/api/accesos/yo');
      setAccesos(respuesta.accesos ?? []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <section className="tarjeta">
      <h2>Mis accesos</h2>
      <p className="textosuave">
        Aquí puede consultar sus intentos de acceso. El backend obtiene el historial a partir de su
        sesión, sin necesidad de indicar su identificador.
      </p>

      {error && <div className="mensaje-error">{error}</div>}

      {accesos.length === 0 ? (
        <p className="textosuave">Todavía no hay accesos registrados a su nombre.</p>
      ) : (
        <table className="tabla">
          <thead>
            <tr>
              <th>Fecha y hora</th>
              <th>Tipo</th>
              <th>Resultado</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            {accesos.map((acceso) => (
              <tr key={acceso.id ?? acceso.fechaHora}>
                <td>{formatearFechaHora(acceso.fechaHora)}</td>
                <td>{acceso.tipo}</td>
                <td>
                  <span className={`etiqueta-estado ${acceso.resultado}`}>{acceso.resultado}</span>
                </td>
                <td>{acceso.motivoRechazo || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
