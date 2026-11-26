// Adeudos agrupados por cliente (005-FR-009, 005-FR-011, 005-FR-012).
// Solo consume la API REST; la suma de pagos pendientes se calcula en el backend.

import { useCallback, useEffect, useState } from 'react';
import { pedir } from '../services/api.js';

const OPCIONES_LIMITE = [10, 25, 50, 100, 200];

/**
 * Construye la URL de consulta omitiendo el filtro vacío.
 * @returns {string}
 */
function construirRuta(idCliente, limite, offset) {
  const parametros = new URLSearchParams();
  if (idCliente) parametros.set('idCliente', idCliente);
  parametros.set('limite', String(limite));
  parametros.set('offset', String(offset));
  return `/api/pagos/adeudos?${parametros.toString()}`;
}

export default function Adeudos() {
  const [idCliente, setIdCliente] = useState('');
  const [limite, setLimite] = useState(50);
  const [offset, setOffset] = useState(0);
  const [respuesta, setRespuesta] = useState(null);
  const [error, setError] = useState('');

  const cargar = useCallback(async (cliente, cantidad, desplazamiento) => {
    try {
      setError('');
      const datos = await pedir(construirRuta(cliente, cantidad, desplazamiento));
      setRespuesta(datos);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    cargar('', 50, 0);
  }, [cargar]);

  function aplicar(evento) {
    evento.preventDefault();
    setOffset(0);
    cargar(idCliente, limite, 0);
  }

  function cambiarPagina(nuevoOffset) {
    setOffset(nuevoOffset);
    cargar(idCliente, limite, nuevoOffset);
  }

  const adeudos = respuesta?.adeudos ?? [];
  const total = respuesta?.total ?? 0;

  return (
    <section className="tarjeta">
      <h2>Adeudos</h2>

      <form onSubmit={aplicar} className="filtros">
        <div className="campo">
          <label htmlFor="adeudos-cliente">Cliente</label>
          <input
            id="adeudos-cliente"
            type="number"
            min="1"
            placeholder="Todos"
            value={idCliente}
            onChange={(evento) => setIdCliente(evento.target.value)}
          />
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

      <div className="grupos-adeudo">
        {adeudos.map((adeudo) => (
          <article key={adeudo.cliente.id} className="tarjeta-adeudo">
            <h3>
              {adeudo.cliente.nombre} {adeudo.cliente.apellido}
            </h3>
            <p>{adeudo.cliente.correo}</p>
            <p>Total adeudado: {adeudo.totalAdeudado}</p>

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
                {adeudo.pagos.map((pago) => (
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
          </article>
        ))}
      </div>

      <p>Clientes con adeudo: {total}</p>

      <div className="paginacion">
        <label htmlFor="adeudos-limite">Registros por página</label>
        <select
          id="adeudos-limite"
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
