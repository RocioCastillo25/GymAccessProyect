// Pagos del cliente autenticado (005-FR-002, 005-FR-006).
// No existe selector de cliente: la API resuelve al usuario por su token.

import { useCallback, useEffect, useState } from 'react';
import { pedir } from '../services/api.js';

const FILTROS_INICIALES = { fechaInicio: '', fechaFin: '', estado: '' };
const OPCIONES_LIMITE = [10, 25, 50, 100, 200];

/**
 * Construye la URL de consulta omitiendo los filtros vacíos.
 * @returns {string}
 */
function construirRuta(filtros, limite, offset) {
  const parametros = new URLSearchParams();
  if (filtros.fechaInicio) parametros.set('fechaInicio', filtros.fechaInicio);
  if (filtros.fechaFin) parametros.set('fechaFin', filtros.fechaFin);
  if (filtros.estado) parametros.set('estado', filtros.estado);
  parametros.set('limite', String(limite));
  parametros.set('offset', String(offset));
  return `/api/pagos/mios?${parametros.toString()}`;
}

export default function MisPagos() {
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
      <h2>Mis pagos</h2>

      <form onSubmit={aplicar} className="filtros">
        <div className="campo">
          <label htmlFor="mios-inicio">Fecha inicio</label>
          <input
            id="mios-inicio"
            type="date"
            value={filtros.fechaInicio}
            onChange={cambiar('fechaInicio')}
          />
        </div>
        <div className="campo">
          <label htmlFor="mios-fin">Fecha fin</label>
          <input
            id="mios-fin"
            type="date"
            value={filtros.fechaFin}
            onChange={cambiar('fechaFin')}
          />
        </div>
        <div className="campo">
          <label htmlFor="mios-estado">Estado</label>
          <select id="mios-estado" value={filtros.estado} onChange={cambiar('estado')}>
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
        <label htmlFor="mios-limite">Registros por página</label>
        <select
          id="mios-limite"
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
