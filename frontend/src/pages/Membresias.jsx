// Gestión de membresías (HU2, FR-005 a FR-007, FR-010).

import { useCallback, useEffect, useState } from 'react';
import { pedir } from '../services/api.js';

export default function Membresias() {
  const [membresias, setMembresias] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [idCliente, setIdCliente] = useState('');
  const [idTipoMembresia, setIdTipoMembresia] = useState('');
  const [exito, setExito] = useState('');
  const [error, setError] = useState('');

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

  return (
    <>
      <section className="tarjeta formulario">
        <h2>Asignar membresía</h2>

        {exito && <div className="mensaje-exito">{exito}</div>}
        {error && <div className="mensaje-error">{error}</div>}

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
                  {tipo.nombre} ({tipo.duracion} días)
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
                <tr key={membresia.id}>
                  <td>{membresia.id}</td>
                  <td>{nombreCliente(membresia.idCliente)}</td>
                  <td>{nombreTipo(membresia.idTipoMembresia)}</td>
                  <td>{membresia.fechaInicio}</td>
                  <td>{membresia.fechaFin}</td>
                  <td>
                    <span className={`etiqueta-estado ${membresia.estado}`}>
                      {membresia.estado}
                    </span>
                  </td>
                  <td className="acciones">
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
