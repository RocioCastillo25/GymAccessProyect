// Clientes asignados por entrenador (HU7, FR-008).

import { useCallback, useEffect, useState } from 'react';
import { pedir } from '../services/api.js';

export default function PersonalAsignado() {
  const [entrenadores, setEntrenadores] = useState([]);
  const [idEntrenador, setIdEntrenador] = useState('');
  const [asignaciones, setAsignaciones] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    pedir('/api/entrenadores')
      .then((respuesta) => setEntrenadores(respuesta.entrenadores))
      .catch((err) => setError(err.message));
  }, []);

  const cargar = useCallback(async (id) => {
    if (!id) {
      setAsignaciones([]);
      return;
    }
    try {
      const respuesta = await pedir(`/api/asignaciones/entrenador/${id}`);
      setAsignaciones(respuesta.asignaciones);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    cargar(idEntrenador);
  }, [idEntrenador, cargar]);

  return (
    <>
      <section className="tarjeta formulario">
        <h2>Personal asignado</h2>
        {error && <div className="mensaje-error">{error}</div>}

        <div className="campo">
          <label htmlFor="entrenador-personal">Entrenador *</label>
          <select
            id="entrenador-personal"
            value={idEntrenador}
            onChange={(evento) => setIdEntrenador(evento.target.value)}
          >
            <option value="">Seleccione un entrenador</option>
            {entrenadores.map((entrenador) => (
              <option key={entrenador.id} value={entrenador.id}>
                {entrenador.nombre}
              </option>
            ))}
          </select>
        </div>
      </section>

      {idEntrenador && (
        <section className="tarjeta">
          <h2>Clientes asignados</h2>
          {asignaciones.length === 0 && (
            <p className="textosuave">El entrenador no tiene clientes asignados.</p>
          )}
          {asignaciones.length > 0 && (
            <table className="tabla">
              <thead>
                <tr>
                  <th>Id</th>
                  <th>Cliente</th>
                  <th>Principal</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {asignaciones.map((asignacion) => (
                  <tr key={asignacion.id}>
                    <td>{asignacion.id}</td>
                    <td>{asignacion.cliente}</td>
                    <td>{asignacion.esPrincipal ? 'Sí' : 'No'}</td>
                    <td>
                      <span className={`etiqueta-estado ${asignacion.estado}`}>
                        {asignacion.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </>
  );
}
