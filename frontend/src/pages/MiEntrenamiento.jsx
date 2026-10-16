// Rutina y evolución del cliente autenticado (HU5, FR-017 a FR-018).

import { useEffect, useState } from 'react';
import { pedir } from '../services/api.js';

export default function MiEntrenamiento() {
  const [rutina, setRutina] = useState(null);
  const [sinRutina, setSinRutina] = useState(false);
  const [objetivos, setObjetivos] = useState([]);
  const [progresos, setProgresos] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    pedir('/api/rutinas/yo')
      .then((respuesta) => setRutina(respuesta.rutina))
      .catch((err) => {
        if (err.codigo === 'SIN_RUTINA') {
          setSinRutina(true);
        } else {
          setError(err.message);
        }
      });

    pedir('/api/objetivos/yo')
      .then((respuesta) => setObjetivos(respuesta.objetivos))
      .catch((err) => setError(err.message));

    pedir('/api/progresos/yo')
      .then((respuesta) => setProgresos(respuesta.progresos))
      .catch((err) => setError(err.message));
  }, []);

  return (
    <>
      <section className="tarjeta">
        <h2>Mi rutina</h2>
        {error && <div className="mensaje-error">{error}</div>}
        {sinRutina && <p className="textosuave">Aún no tienes una rutina asignada.</p>}
        {rutina && (
          <>
            <p>
              <strong>{rutina.nombre}</strong> ({rutina.estado})
            </p>
            {rutina.ejercicios.length === 0 && (
              <p className="textosuave">La rutina no tiene ejercicios registrados.</p>
            )}
            {rutina.ejercicios.length > 0 && (
              <table className="tabla">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Ejercicio</th>
                    <th>Series</th>
                    <th>Repeticiones</th>
                    <th>Peso</th>
                    <th>Descanso</th>
                  </tr>
                </thead>
                <tbody>
                  {rutina.ejercicios.map((ejercicio, indice) => (
                    <tr key={ejercicio.id ?? indice}>
                      <td>{ejercicio.orden ?? indice + 1}</td>
                      <td>{ejercicio.nombre}</td>
                      <td>{ejercicio.series ?? '—'}</td>
                      <td>{ejercicio.repeticiones ?? '—'}</td>
                      <td>{ejercicio.peso ?? '—'}</td>
                      <td>{ejercicio.descanso ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </>
        )}
      </section>

      <section className="tarjeta">
        <h2>Mis objetivos</h2>
        {objetivos.length === 0 && (
          <p className="textosuave">No tienes objetivos registrados.</p>
        )}
        {objetivos.length > 0 && (
          <ul>
            {objetivos.map((objetivo) => (
              <li key={objetivo.id}>
                {objetivo.descripcion} ({objetivo.estado})
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="tarjeta">
        <h2>Mi evolución</h2>
        {progresos.length === 0 && (
          <p className="textosuave">Aún no hay progresos registrados.</p>
        )}
        {progresos.length > 0 && (
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Valor</th>
                <th>Unidad</th>
                <th>Observaciones</th>
              </tr>
            </thead>
            <tbody>
              {progresos.map((progreso) => (
                <tr key={progreso.id}>
                  <td>{progreso.fechaRegistro}</td>
                  <td>{progreso.valor}</td>
                  <td>{progreso.unidad || '—'}</td>
                  <td>{progreso.observaciones || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
