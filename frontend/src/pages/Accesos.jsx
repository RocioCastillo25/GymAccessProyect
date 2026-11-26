// Consulta de accesos registrados con filtros operativos (FR-026).

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
export function construirRutaAccesos(filtros) {
  const parametros = new URLSearchParams();
  for (const campo of ['resultado', 'idCliente', 'desde', 'hasta']) {
    if (filtros[campo]) parametros.set(campo, String(filtros[campo]));
  }
  const consulta = parametros.toString();
  return consulta ? `/api/accesos?${consulta}` : '/api/accesos';
}

export default function Accesos() {
  const [filtros, setFiltros] = useState({
    resultado: '',
    idCliente: '',
    desde: '',
    hasta: '',
  });
  const [aplicados, setAplicados] = useState({});
  const [accesos, setAccesos] = useState([]);
  const [error, setError] = useState('');

  const cargar = useCallback(async (filtrosAplicados) => {
    try {
      setError('');
      const respuesta = await pedir(construirRutaAccesos(filtrosAplicados));
      setAccesos(respuesta.accesos ?? []);
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
    setAplicados(filtros);
    cargar(filtros);
  }

  function limpiar() {
    setFiltros({ resultado: '', idCliente: '', desde: '', hasta: '' });
    setAplicados({});
    cargar({});
  }

  const hayFiltros = Object.values(aplicados).some((valor) => valor !== '');

  return (
    <>
      <section className="tarjeta">
        <h2>Accesos registrados</h2>
        <p className="textosuave">
          Se listan todos los intentos de acceso, autorizados y rechazados. Los filtros se aplican en
          el backend.
        </p>

        {error && <div className="mensaje-error">{error}</div>}

        <form className="rejilla-filtros" onSubmit={aplicar}>
          <div className="campo">
            <label htmlFor="acceso-resultado">Resultado</label>
            <select
              id="acceso-resultado"
              value={filtros.resultado}
              onChange={(evento) => cambiar('resultado', evento.target.value)}
            >
              <option value="">Todos</option>
              <option value="autorizado">Autorizado</option>
              <option value="rechazado">Rechazado</option>
            </select>
          </div>
          <div className="campo">
            <label htmlFor="acceso-cliente">ID del cliente</label>
            <input
              id="acceso-cliente"
              type="number"
              min="1"
              value={filtros.idCliente}
              onChange={(evento) => cambiar('idCliente', evento.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className="campo">
            <label htmlFor="acceso-desde">Desde</label>
            <input
              id="acceso-desde"
              type="date"
              value={filtros.desde}
              onChange={(evento) => cambiar('desde', evento.target.value)}
            />
          </div>
          <div className="campo">
            <label htmlFor="acceso-hasta">Hasta</label>
            <input
              id="acceso-hasta"
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

        {hayFiltros && (
          <p className="textosuave" data-testid="filtros-activos-accesos">
            Filtros activos:{' '}
            {Object.entries(aplicados)
              .filter(([, valor]) => valor)
              .map(([campo, valor]) => `${campo}: ${valor}`)
              .join(' · ')}
          </p>
        )}
      </section>

      <section className="tarjeta">
        <h3>Historial</h3>
        {accesos.length === 0 ? (
          <p className="textosuave">No hay accesos registrados para los filtros seleccionados.</p>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Resultado</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {accesos.map((acceso) => (
                <tr key={acceso.id ?? `${acceso.fechaHora}-${acceso.idCliente}`}>
                  <td>{formatearFechaHora(acceso.fechaHora)}</td>
                  <td>{acceso.cliente || 'No reconocido'}</td>
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
    </>
  );
}
