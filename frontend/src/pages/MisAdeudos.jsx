// Adeudos del cliente autenticado (005-FR-010, 005-FR-011, 005-FR-013).
// No hay selector de cliente: la API resuelve al usuario por su token.

import { useCallback, useEffect, useState } from 'react';
import { pedir } from '../services/api.js';

export default function MisAdeudos() {
  const [respuesta, setRespuesta] = useState(null);
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      setError('');
      const datos = await pedir('/api/pagos/adeudos/mios');
      setRespuesta(datos);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const pagos = respuesta?.pagos ?? [];

  return (
    <section className="tarjeta">
      <h2>Mis adeudos</h2>

      {error && <div className="mensaje-error">{error}</div>}
      {respuesta?.mensaje && (
        <p className="mensaje-vacio" role="status">
          {respuesta.mensaje}
        </p>
      )}

      {respuesta?.cliente && (
        <div className="resumen-adeudo">
          <p>
            Cliente: {respuesta.cliente.nombre} {respuesta.cliente.apellido}
          </p>
          <p>Total adeudado: {respuesta.totalAdeudado}</p>
        </div>
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
    </section>
  );
}
