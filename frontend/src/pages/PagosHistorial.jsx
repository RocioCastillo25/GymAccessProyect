// Historial general de pagos (005-FR-001, 005-FR-003, 005-FR-008).
// Solo consume la API REST; nunca accede a la base de datos directamente.

import { useCallback, useEffect, useState } from 'react';
import { pedir } from '../services/api.js';

const FILTROS_INICIALES = { fechaInicio: '', fechaFin: '', idCliente: '', estado: '' };
const OPCIONES_LIMITE = [10, 25, 50, 100, 200];

/**
 * Construye la URL de consulta omitiendo los filtros vacíos.
 * @returns {string}
 */
function construirRuta(filtros, limite, offset) {
  const parametros = new URLSearchParams();
  if (filtros.fechaInicio) parametros.set('fechaInicio', filtros.fechaInicio);
  if (filtros.fechaFin) parametros.set('fechaFin', filtros.fechaFin);
  if (filtros.idCliente) parametros.set('idCliente', filtros.idCliente);
  if (filtros.estado) parametros.set('estado', filtros.estado);
  parametros.set('limite', String(limite));
  parametros.set('offset', String(offset));
  return `/api/pagos?${parametros.toString()}`;
}

export default function PagosHistorial() {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [limite, setLimite] = useState(50);
  const [offset, setOffset] = useState(0);
  const [respuesta, setRespuesta] = useState(null);
  const [error, setError] = useState('');

  const cargar = useCallback(async (filtrosActuales, limiteActual, offsetActual) => {
    try {
      setError('');
      const datos = await pedir(construirRuta(filtrosActuales, limiteActual, offsetActual));
      setRespuesta(datos);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    cargar(FILTROS_INICIALES, 50, 0);
  }, [cargar]);

  function cambiar(campo) {
    return (evento) => setFiltros({ ...filtros, [campo]: evento.target.value });
  }

  function aplicar(evento) {
    evento.preventDefault();
    setOffset(0);
    cargar(filtros, limite, 0);
  }

  function cambiarPagina(nuevoOffset) {
    setOffset(nuevoOffset);
    cargar(filtros, limite, nuevoOffset);
  }

  const pagos = respuesta?.pagos ?? [];
  const total = respuesta?.total ?? 0;

  return (
    <section className="tarjeta">
      <h2>Historial de pagos</h2>

      <form onSubmit={aplicar} className="filtros">
        <div className="campo">
          <label htmlFor="historial-inicio">Fecha inicio</label>
          <input
            id="historial-inicio"
            type="date"
            value={filtros.fechaInicio}
            onChange={cambiar('fechaInicio')}
          />
        </div>
        <div className="campo">
          <label htmlFor="historial-fin">Fecha fin</label>
          <input
            id="historial-fin"
            type="date"
            value={filtros.fechaFin}
            onChange={cambiar('fechaFin')}
          />
        </div>
        <div className="campo">
          <label htmlFor="historial-cliente">Cliente</label>
          <input
            id="historial-cliente"
            type="number"
            min="1"
            placeholder="Todos"
            value={filtros.idCliente}
            onChange={cambiar('idCliente')}
          />
        </div>
        <div className="campo">
          <label htmlFor="historial-estado">Estado</label>
          <select id="historial-estado" value={filtros.estado} onChange={cambiar('estado')}>
            <option value="">Todos</option>
            <option value="pendiente">Pendiente</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        <div className="acciones">
          <button type="submit">Aplicar filtros</button>
        </div>
      </form>

      {error && <div className="mensaje-error">{error}</div>}
      {respuesta?.mensaje && (
        <p className="mensaje-vacio" role="status">
          {respuesta.mensaje}
        </p>
      )}

      <div className="tabla-contenedor">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Cliente</th>
              <th>Membresía</th>
              <th>Monto</th>
              <th>Fecha</th>
              <th>Método</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {pagos.map((pago) => (
              <tr key={pago.id}>
                <td>{pago.id}</td>
                <td>{pago.idCliente}</td>
                <td>{pago.idMembresia ?? '—'}</td>
                <td>{pago.monto}</td>
                <td>{pago.fechaPago}</td>
                <td>{pago.metodoPago}</td>
                <td>{pago.estado}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p>Total de registros: {total}</p>
      <p>Monto total de la página: {respuesta?.montoTotal ?? 0}</p>

      <div className="paginacion">
        <label htmlFor="historial-limite">Registros por página</label>
        <select
          id="historial-limite"
          value={limite}
          onChange={(evento) => setLimite(Number(evento.target.value))}
        >
          {OPCIONES_LIMITE.map((cantidad) => (
            <option key={cantidad} value={cantidad}>
              {cantidad}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => cambiarPagina(Math.max(0, offset - limite))} disabled={offset === 0}>
          Anterior
        </button>
        <button
          type="button"
          onClick={() => cambiarPagina(offset + limite)}
          disabled={offset + limite >= total}
        >
          Siguiente
        </button>
      </div>
    </section>
  );
}
