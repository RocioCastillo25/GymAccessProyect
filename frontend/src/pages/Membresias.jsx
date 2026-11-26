// Gestión de membresías (HU2, FR-005 a FR-007, FR-010).

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { pedir } from '../services/api.js';

function formatearMoneda(valor) {
  return Number(valor ?? 0).toLocaleString('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
  });
}

function estaPorVencer(membresia) {
  if (membresia.estado !== 'activa') return false;
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fin = new Date(`${membresia.fechaFin}T00:00:00`);
  const dias = Math.round((fin.getTime() - hoy.getTime()) / 86400000);
  return dias >= 0 && dias <= 5;
}

export default function Membresias() {
  const [membresias, setMembresias] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [idCliente, setIdCliente] = useState('');
  const [idTipoMembresia, setIdTipoMembresia] = useState('');
  const [exito, setExito] = useState('');
  const [error, setError] = useState('');
  const [renovacion, setRenovacion] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const [respuestaMembresias, respuestaClientes, respuestaTipos] = await Promise.all([
        pedir('/api/membresias'),
        pedir('/api/clientes'),
        pedir('/api/tipos-membresia'),
      ]);
      setMembresias(respuestaMembresias.membresias);
      setClientes(respuestaClientes.clientes);
      setTipos(respuestaTipos.tiposMembresia);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const nombreCliente = (id) => {
    const cliente = clientes.find((item) => item.id === id);
    return cliente ? `${cliente.nombre} ${cliente.apellido}` : `Cliente ${id}`;
  };

  const nombreTipo = (id) => {
    const tipo = tipos.find((item) => item.id === id);
    return tipo ? tipo.nombre : `Tipo ${id}`;
  };

  async function asignar(evento) {
    evento.preventDefault();
    setExito('');
    setError('');
    try {
      const respuesta = await pedir('/api/membresias', {
        method: 'POST',
        body: JSON.stringify({
          idCliente: Number(idCliente),
          idTipoMembresia: Number(idTipoMembresia),
        }),
      });
      setExito(respuesta.mensaje);
      setIdCliente('');
      setIdTipoMembresia('');
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  function seleccionarTipo(id) {
    setIdTipoMembresia(String(id));
    const selector = document.getElementById('tipo-membresia');
    if (typeof selector?.scrollIntoView === 'function') {
      selector.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    selector?.focus();
  }

  async function cambiarEstado(membresia, estado) {
    setExito('');
    setError('');
    try {
      const respuesta = await pedir(`/api/membresias/${membresia.id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado }),
      });
      setExito(respuesta.mensaje);
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  const tiposActivos = tipos.filter((tipo) => tipo.estado === 'activo');

  function iniciarRenovacion(membresia) {
    setExito('');
    setError('');
    setRenovacion({
      idMembresia: membresia.id,
      idCliente: membresia.idCliente,
      idTipoMembresia: tiposActivos[0]?.id ?? '',
    });
  }

  async function confirmarRenovacion() {
    setExito('');
    setError('');
    try {
      const respuesta = await pedir(`/api/membresias/${renovacion.idMembresia}/renovar`, {
        method: 'POST',
        body: JSON.stringify({ idTipoMembresia: Number(renovacion.idTipoMembresia) }),
      });
      setExito(respuesta.mensaje);
      setRenovacion(null);
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <section className="tarjeta formulario">
        <h2>Asignar membresía</h2>

        {exito && <div className="mensaje-exito">{exito}</div>}
        {error && <div className="mensaje-error">{error}</div>}

        {renovacion && (
          <div
            className="mensaje-confirmacion"
            role="dialog"
            aria-label="Confirmar renovación"
          >
            <p>
              ¿Renovar la membresía {renovacion.idMembresia} de{' '}
              {nombreCliente(renovacion.idCliente)}? La membresía anterior se conservará en el
              historial.
            </p>
            <div className="campo">
              <label htmlFor="tipo-renovacion">Tipo para la renovación</label>
              <select
                id="tipo-renovacion"
                value={renovacion.idTipoMembresia}
                onChange={(evento) =>
                  setRenovacion({ ...renovacion, idTipoMembresia: evento.target.value })
                }
              >
                {tiposActivos.map((tipo) => (
                  <option key={tipo.id} value={tipo.id}>
                    {tipo.nombre} ({tipo.duracion} días)
                  </option>
                ))}
              </select>
            </div>
            <div className="acciones">
              <button
                type="button"
                onClick={confirmarRenovacion}
                disabled={!renovacion.idTipoMembresia}
              >
                Confirmar renovación
              </button>
              <button
                type="button"
                className="secundario"
                onClick={() => setRenovacion(null)}
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        <form onSubmit={asignar}>
          <div className="campo">
            <label htmlFor="cliente-membresia">Cliente *</label>
            <select
              id="cliente-membresia"
              value={idCliente}
              onChange={(evento) => setIdCliente(evento.target.value)}
            >
              <option value="">Seleccione un cliente</option>
              {clientes.map((cliente) => (
                <option key={cliente.id} value={cliente.id}>
                  {cliente.nombre} {cliente.apellido}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="tipo-membresia">Tipo de membresía *</label>
            <select
              id="tipo-membresia"
              value={idTipoMembresia}
              onChange={(evento) => setIdTipoMembresia(evento.target.value)}
            >
              <option value="">Seleccione un tipo</option>
              {tiposActivos.map((tipo) => (
                <option key={tipo.id} value={tipo.id}>
                  {tipo.nombre} ({tipo.duracion} días) - {formatearMoneda(tipo.precio)}
                </option>
              ))}
            </select>
          </div>

          <div className="acciones">
            <button type="submit" disabled={!idCliente || !idTipoMembresia}>
              Asignar membresía
            </button>
          </div>
        </form>
      </section>

      <section className="tarjeta">
        <div className="cabecera-reporte">
          <div>
            <h2>Tipos de membresía disponibles</h2>
            <p className="textosuave">
              Elige un tipo en el formulario para asignarlo al cliente. Hay{' '}
              {tiposActivos.length} tipo{tiposActivos.length === 1 ? '' : 's'} activo
              {tiposActivos.length === 1 ? '' : 's'}.
            </p>
          </div>
          <div className="acciones no-imprimir">
            <Link className="boton-enlace" to="/memberships/types">
              Gestionar tipos
            </Link>
          </div>
        </div>

        {tiposActivos.length === 0 && (
          <div className="mensaje-error">
            No hay tipos activos. Un administrador debe crear o activar un tipo en{' '}
            <Link to="/memberships/types">Tipos de membresía</Link>.
          </div>
        )}

        {tiposActivos.length > 0 && (
          <div className="rejilla-tipos">
            {tiposActivos.map((tipo) => (
              <article
                className={`tipo-card ${
                  String(tipo.id) === idTipoMembresia ? 'seleccionado' : ''
                }`}
                key={tipo.id}
              >
                <div className="tipo-card-cabecera">
                  <h3>{tipo.nombre}</h3>
                  <span className="etiqueta-estado activo">{tipo.duracion} días</span>
                </div>
                <p className="textosuave">{tipo.descripcion || 'Sin descripción.'}</p>
                <span className="tipo-precio">{formatearMoneda(tipo.precio)}</span>
                <button
                  type="button"
                  className="secundario"
                  onClick={() => seleccionarTipo(tipo.id)}
                >
                  {String(tipo.id) === idTipoMembresia ? 'Tipo seleccionado' : 'Usar este tipo'}
                </button>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="tarjeta">
        <h2>Membresías registradas</h2>

        {membresias.length === 0 && (
          <p className="textosuave">No hay membresías registradas todavía.</p>
        )}

        {membresias.length > 0 && (
          <table className="tabla">
            <thead>
              <tr>
                <th>Id</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Inicio</th>
                <th>Fin</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {membresias.map((membresia) => (
                <tr
                  key={membresia.id}
                  className={estaPorVencer(membresia) ? 'fila-alerta' : undefined}
                >
                  <td>{membresia.id}</td>
                  <td>{nombreCliente(membresia.idCliente)}</td>
                  <td>{nombreTipo(membresia.idTipoMembresia)}</td>
                  <td>{membresia.fechaInicio}</td>
                  <td>{membresia.fechaFin}</td>
                  <td>
                    <span className={`etiqueta-estado ${membresia.estado}`}>
                      {membresia.estado}
                    </span>
                    {estaPorVencer(membresia) && (
                      <span className="etiqueta-estado advertencia">Por vencer</span>
                    )}
                  </td>
                  <td className="acciones">
                    <button
                      type="button"
                      className="secundario"
                      onClick={() => iniciarRenovacion(membresia)}
                      disabled={tiposActivos.length === 0}
                    >
                      Renovar
                    </button>
                    {membresia.estado === 'activa' && (
                      <button
                        type="button"
                        className="secundario"
                        onClick={() => cambiarEstado(membresia, 'suspendida')}
                      >
                        Suspender
                      </button>
                    )}
                    {(membresia.estado === 'activa' || membresia.estado === 'suspendida') && (
                      <button
                        type="button"
                        className="secundario"
                        onClick={() => cambiarEstado(membresia, 'cancelada')}
                      >
                        Cancelar
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
