// Asignación de entrenadores a clientes (HU2, FR-005 a FR-008).

import { useCallback, useEffect, useState } from 'react';
import { pedir } from '../services/api.js';

const FORMULARIO_INICIAL = { idCliente: '', idEntrenador: '', esPrincipal: true };

export default function Asignaciones() {
  const [asignaciones, setAsignaciones] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [entrenadores, setEntrenadores] = useState([]);
  const [datos, setDatos] = useState(FORMULARIO_INICIAL);
  const [exito, setExito] = useState('');
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [respuestaAsignaciones, respuestaClientes, respuestaEntrenadores] = await Promise.all([
        pedir('/api/asignaciones'),
        pedir('/api/clientes'),
        pedir('/api/entrenadores'),
      ]);
      setAsignaciones(respuestaAsignaciones.asignaciones);
      setClientes(respuestaClientes.clientes);
      setEntrenadores(respuestaEntrenadores.entrenadores);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function asignar(evento) {
    evento.preventDefault();
    setExito('');
    setError('');
    try {
      const respuesta = await pedir('/api/asignaciones', {
        method: 'POST',
        body: JSON.stringify({
          idCliente: Number(datos.idCliente),
          idEntrenador: Number(datos.idEntrenador),
          esPrincipal: datos.esPrincipal,
        }),
      });
      setExito(respuesta.mensaje);
      setDatos(FORMULARIO_INICIAL);
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function finalizar(asignacion) {
    setExito('');
    setError('');
    try {
      const respuesta = await pedir(`/api/asignaciones/${asignacion.id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: 'finalizada' }),
      });
      setExito(respuesta.mensaje);
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  const clientesActivos = clientes.filter((cliente) => cliente.estado === 'activo');
  const entrenadoresActivos = entrenadores.filter((entrenador) => entrenador.estado === 'activo');

  return (
    <>
      <section className="tarjeta formulario">
        <h2>Asignar entrenador</h2>

        {exito && <div className="mensaje-exito">{exito}</div>}
        {error && <div className="mensaje-error">{error}</div>}

        <form onSubmit={asignar}>
          <div className="campo">
            <label htmlFor="cliente-asignacion">Cliente *</label>
            <select
              id="cliente-asignacion"
              value={datos.idCliente}
              onChange={(evento) => setDatos({ ...datos, idCliente: evento.target.value })}
            >
              <option value="">Seleccione un cliente</option>
              {clientesActivos.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre} {cliente.apellido}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="entrenador-asignacion">Entrenador *</label>
            <select
              id="entrenador-asignacion"
              value={datos.idEntrenador}
              onChange={(evento) => setDatos({ ...datos, idEntrenador: evento.target.value })}
            >
              <option value="">Seleccione un entrenador</option>
              {entrenadoresActivos.map((entrenador) => (
                <option key={entrenador.id} value={entrenador.id}>
                  {entrenador.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="principal-asignacion">
              <input
                id="principal-asignacion"
                type="checkbox"
                checked={datos.esPrincipal}
                onChange={(evento) => setDatos({ ...datos, esPrincipal: evento.target.checked })}
              />{' '}
              Entrenador principal
            </label>
          </div>

          <div className="acciones">
            <button type="submit" disabled={!datos.idCliente || !datos.idEntrenador}>
              Asignar entrenador
            </button>
          </div>
        </form>
      </section>

      <section className="tarjeta">
        <h2>Asignaciones registradas</h2>

        {asignaciones.length === 0 && (
          <p className="textosuave">No hay asignaciones registradas todavía.</p>
        )}

        {asignaciones.length > 0 && (
          <table className="tabla">
            <thead>
              <tr>
                <th>Id</th>
                <th>Cliente</th>
                <th>Entrenador</th>
                <th>Principal</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {asignaciones.map((asignacion) => (
                <tr key={asignacion.id}>
                  <td>{asignacion.id}</td>
                  <td>{asignacion.cliente}</td>
                  <td>{asignacion.entrenador}</td>
                  <td>{asignacion.esPrincipal ? 'Sí' : 'No'}</td>
                  <td>
                    <span className={`etiqueta-estado ${asignacion.estado}`}>
                      {asignacion.estado}
                    </span>
                  </td>
                  <td className="acciones">
                    {asignacion.estado === 'activa' && (
                      <button type="button" className="secundario" onClick={() => finalizar(asignacion)}>
                        Finalizar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
