// Registro de pagos (HU4, FR-011).

import { useCallback, useEffect, useState } from 'react';
import { pedir } from '../services/api.js';

const ESTADO_INICIAL = { idCliente: '', idMembresia: '', monto: '', metodoPago: 'efectivo', estado: 'completado' };

export default function PagosRegistro() {
  const [clientes, setClientes] = useState([]);
  const [membresias, setMembresias] = useState([]);
  const [datos, setDatos] = useState(ESTADO_INICIAL);
  const [exito, setExito] = useState('');
  const [error, setError] = useState('');
  const [erroresCampo, setErroresCampo] = useState({});

  const cargar = useCallback(async () => {
    try {
      const [respuestaClientes, respuestaMembresias] = await Promise.all([
        pedir('/api/clientes'),
        pedir('/api/membresias'),
      ]);
      setClientes(respuestaClientes.clientes);
      setMembresias(respuestaMembresias.membresias);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  function cambiar(campo) {
    return (evento) => setDatos({ ...datos, [campo]: evento.target.value });
  }

  const membresiasDelCliente = membresias.filter(
    (membresia) => String(membresia.idCliente) === String(datos.idCliente)
  );

  async function enviar(evento) {
    evento.preventDefault();
    setExito('');
    setError('');
    setErroresCampo({});

    try {
      const respuesta = await pedir('/api/pagos', {
        method: 'POST',
        body: JSON.stringify({
          idCliente: Number(datos.idCliente),
          idMembresia: datos.idMembresia ? Number(datos.idMembresia) : null,
          monto: Number(datos.monto),
          metodoPago: datos.metodoPago,
          estado: datos.estado,
        }),
      });
      setExito(respuesta.mensaje);
      setDatos({ ...datos, idCliente: '', idMembresia: '', monto: '' });
    } catch (err) {
      if (err.errores) {
        setErroresCampo(Object.fromEntries(err.errores.map((item) => [item.campo, item.error])));
      }
      setError(err.message);
    }
  }

  return (
    <section className="tarjeta formulario">
      <h2>Registrar pago</h2>

      {exito && <div className="mensaje-exito">{exito}</div>}
      {error && <div className="mensaje-error">{error}</div>}

      <form onSubmit={enviar}>
        <div className="campo">
          <label htmlFor="cliente-pago">Cliente *</label>
          <select
            id="cliente-pago"
            value={datos.idCliente}
            onChange={(evento) => setDatos({ ...datos, idCliente: evento.target.value, idMembresia: '' })}
          >
            <option value="">Seleccione un cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre} {cliente.apellido}
              </option>
            ))}
          </select>
          {erroresCampo.idCliente && <small className="texto-error">{erroresCampo.idCliente}</small>}
        </div>

        <div className="campo">
          <label htmlFor="membresia-pago">Membresía</label>
          <select
            id="membresia-pago"
            value={datos.idMembresia}
            onChange={cambiar('idMembresia')}
            disabled={!datos.idCliente}
          >
            <option value="">Sin membresía asociada</option>
            {membresiasDelCliente.map((membresia) => (
              <option key={membresia.id} value={membresia.id}>
                {membresia.id} · {membresia.fechaInicio} a {membresia.fechaFin} ({membresia.estado})
              </option>
            ))}
          </select>
          {erroresCampo.idMembresia && (
            <small className="texto-error">{erroresCampo.idMembresia}</small>
          )}
        </div>

        <div className="campo">
          <label htmlFor="monto-pago">Monto *</label>
          <input
            id="monto-pago"
            type="number"
            min="0.01"
            step="0.01"
            value={datos.monto}
            onChange={cambiar('monto')}
          />
          {erroresCampo.monto && <small className="texto-error">{erroresCampo.monto}</small>}
        </div>

        <div className="campo">
          <label htmlFor="metodo-pago">Método de pago *</label>
          <select id="metodo-pago" value={datos.metodoPago} onChange={cambiar('metodoPago')}>
            <option value="efectivo">Efectivo</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="transferencia">Transferencia</option>
          </select>
          {erroresCampo.metodoPago && (
            <small className="texto-error">{erroresCampo.metodoPago}</small>
          )}
        </div>

        <div className="campo">
          <label htmlFor="estado-pago">Estado</label>
          <select id="estado-pago" value={datos.estado} onChange={cambiar('estado')}>
            <option value="completado">Completado</option>
            <option value="pendiente">Pendiente</option>
            <option value="cancelado">Cancelado</option>
          </select>
          {erroresCampo.estado && <small className="texto-error">{erroresCampo.estado}</small>}
        </div>

        <div className="acciones">
          <button type="submit" disabled={!datos.idCliente || !datos.monto}>
            Registrar pago
          </button>
        </div>
      </form>
    </section>
  );
}
