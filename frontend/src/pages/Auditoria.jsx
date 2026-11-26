// Consulta de auditoría exclusiva del administrador (FR-036).

import { useCallback, useEffect, useState } from 'react';
import { pedir } from '../services/api.js';

function formatearFechaHora(valor) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleString('es-GT');
}

/**
 * Construye la ruta de consulta omitiendo los filtros vacíos.
 * @returns {string}
 */
export function construirRutaAuditoria(filtros) {
  const parametros = new URLSearchParams();
  for (const campo of ['modulo', 'idUsuario', 'resultado', 'desde', 'hasta']) {
    if (filtros[campo]) parametros.set(campo, String(filtros[campo]));
  }
  const consulta = parametros.toString();
  return consulta ? `/api/auditoria?${consulta}` : '/api/auditoria';
}

export default function Auditoria() {
  const [filtros, setFiltros] = useState({
    modulo: '',
    idUsuario: '',
    resultado: '',
    desde: '',
    hasta: '',
  });
  const [acciones, setAcciones] = useState([]);
  const [error, setError] = useState('');

  const cargar = useCallback(async (filtrosActuales) => {
    try {
      setError('');
      const respuesta = await pedir(construirRutaAuditoria(filtrosActuales));
      setAcciones(respuesta.auditoria ?? []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    cargar({});
  }, [cargar]);

  function cambiar(campo, valor) {
    setFiltros({ ...filtros, [campo]: valor });
  }

  function aplicar(evento) {
    evento.preventDefault();
    cargar(filtros);
  }

  function limpiar() {
    setFiltros({ modulo: '', idUsuario: '', resultado: '', desde: '', hasta: '' });
    cargar({});
  }

  return (
    <>
      <section className="tarjeta">
        <h2>Auditoría del sistema</h2>
        <p className="textosuave">
          Consulta las acciones registradas por módulo, usuario, resultado o periodo. Solo el
          administrador tiene acceso a esta información.
        </p>

        {error && <div className="mensaje-error">{error}</div>}

        <form className="rejilla-filtros" onSubmit={aplicar}>
          <div className="campo">
            <label htmlFor="auditoria-modulo">Módulo</label>
            <input
              id="auditoria-modulo"
              type="text"
              value={filtros.modulo}
              onChange={(evento) => cambiar('modulo', evento.target.value)}
              placeholder="Ej. membresias"
            />
          </div>
          <div className="campo">
            <label htmlFor="auditoria-usuario">ID del usuario</label>
            <input
              id="auditoria-usuario"
              type="number"
              min="1"
              value={filtros.idUsuario}
              onChange={(evento) => cambiar('idUsuario', evento.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className="campo">
            <label htmlFor="auditoria-resultado">Resultado</label>
            <select
              id="auditoria-resultado"
              value={filtros.resultado}
              onChange={(evento) => cambiar('resultado', evento.target.value)}
            >
              <option value="">Todos</option>
              <option value="exito">Éxito</option>
              <option value="error">Error</option>
            </select>
          </div>
          <div className="campo">
            <label htmlFor="auditoria-desde">Desde</label>
            <input
              id="auditoria-desde"
              type="date"
              value={filtros.desde}
              onChange={(evento) => cambiar('desde', evento.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor="auditoria-hasta">Hasta</label>
            <input
              id="auditoria-hasta"
              type="date"
              value={filtros.hasta}
              onChange={(evento) => cambiar('hasta', evento.target.value)}
            />
          </div>
          <div className="acciones">
            <button type="submit">Aplicar filtros</button>
            <button type="button" className="secundario" onClick={limpiar}>
              Limpiar
            </button>
          </div>
        </form>
      </section>

      <section className="tarjeta">
        <h3>Acciones registradas</h3>
        {acciones.length === 0 ? (
          <p className="textosuave">No hay acciones registradas para los filtros seleccionados.</p>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Módulo</th>
                <th>Acción</th>
                <th>Usuario</th>
                <th>Resultado</th>
                <th>Descripción</th>
              </tr>
            </thead>
            <tbody>
              {acciones.map((accion) => (
                <tr key={accion.id}>
                  <td>{formatearFechaHora(accion.fecha)}</td>
                  <td>{accion.modulo}</td>
                  <td>{accion.accion}</td>
                  <td>{accion.idUsuario ?? '—'}</td>
                  <td>
                    <span className={`etiqueta-estado ${accion.resultado}`}>{accion.resultado}</span>
                  </td>
                  <td>{accion.descripcion || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
