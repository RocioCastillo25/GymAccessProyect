// Objetivos y progresos del entrenador (HU4, FR-013 a FR-016).

import { useCallback, useEffect, useState } from 'react';
import { pedir } from '../services/api.js';

const OBJETIVO_VACIO = { descripcion: '', valorObjetivo: '', unidad: '', fechaObjetivo: '' };
const PROGRESO_VACIO = { idObjetivo: '', valor: '', unidad: '', observaciones: '' };

export default function Progreso() {
  const [clientes, setClientes] = useState([]);
  const [idCliente, setIdCliente] = useState('');
  const [objetivos, setObjetivos] = useState([]);
  const [progresos, setProgresos] = useState([]);
  const [datosObjetivo, setDatosObjetivo] = useState(OBJETIVO_VACIO);
  const [datosProgreso, setDatosProgreso] = useState(PROGRESO_VACIO);
  const [exito, setExito] = useState('');
  const [error, setError] = useState('');

  const cargarClientes = useCallback(async () => {
    try {
      const respuesta = await pedir('/api/asignaciones/yo');
      const activas = respuesta.asignaciones.filter((asignacion) => asignacion.estado === 'activa');
      const unicos = [];
      for (const asignacion of activas) {
        if (!unicos.some((item) => item.id === asignacion.idCliente)) {
          unicos.push({ id: asignacion.idCliente, nombre: asignacion.cliente });
        }
      }
      setClientes(unicos);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const cargarDatos = useCallback(async (id) => {
    if (!id) {
      setObjetivos([]);
      setProgresos([]);
      return;
    }
    try {
      const [respuestaObjetivos, respuestaProgresos] = await Promise.all([
        pedir(`/api/objetivos/cliente/${id}`),
        pedir(`/api/progresos/cliente/${id}`),
      ]);
      setObjetivos(respuestaObjetivos.objetivos);
      setProgresos(respuestaProgresos.progresos);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  useEffect(() => {
    cargarDatos(idCliente);
  }, [idCliente, cargarDatos]);

  async function registrarObjetivo(evento) {
    evento.preventDefault();
    setExito('');
    setError('');
    try {
      const respuesta = await pedir('/api/objetivos', {
        method: 'POST',
        body: JSON.stringify({
          idCliente: Number(idCliente),
          descripcion: datosObjetivo.descripcion,
          valorObjetivo: datosObjetivo.valorObjetivo === '' ? null : Number(datosObjetivo.valorObjetivo),
          unidad: datosObjetivo.unidad || null,
          fechaObjetivo: datosObjetivo.fechaObjetivo || null,
        }),
      });
      setExito(respuesta.mensaje);
      setDatosObjetivo(OBJETIVO_VACIO);
      await cargarDatos(idCliente);
    } catch (err) {
      setError(err.message);
    }
  }

  async function registrarProgreso(evento) {
    evento.preventDefault();
    setExito('');
    setError('');
    try {
      const respuesta = await pedir('/api/progresos', {
        method: 'POST',
        body: JSON.stringify({
          idCliente: Number(idCliente),
          idObjetivo: datosProgreso.idObjetivo ? Number(datosProgreso.idObjetivo) : null,
          valor: Number(datosProgreso.valor),
          unidad: datosProgreso.unidad || null,
          observaciones: datosProgreso.observaciones || null,
        }),
      });
      setExito(respuesta.mensaje);
      setDatosProgreso(PROGRESO_VACIO);
      await cargarDatos(idCliente);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <section className="tarjeta formulario">
        <h2>Objetivos y progreso</h2>

        {exito && <div className="mensaje-exito">{exito}</div>}
        {error && <div className="mensaje-error">{error}</div>}

        <div className="campo">
          <label htmlFor="cliente-progreso">Cliente *</label>
          <select
            id="cliente-progreso"
            value={idCliente}
            onChange={(evento) => setIdCliente(evento.target.value)}
          >
            <option value="">Seleccione un cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre}
              </option>
            ))}
          </select>
        </div>
      </section>

      {idCliente && (
        <>
          <section className="tarjeta formulario">
            <h3>Registrar objetivo</h3>
            <form onSubmit={registrarObjetivo}>
              <div className="campo">
                <label htmlFor="descripcion-objetivo">Descripción *</label>
                <input
                  id="descripcion-objetivo"
                  value={datosObjetivo.descripcion}
                  onChange={(e) => setDatosObjetivo({ ...datosObjetivo, descripcion: e.target.value })}
                />
              </div>
              <div className="campo">
                <label htmlFor="valor-objetivo">Valor objetivo</label>
                <input
                  id="valor-objetivo"
                  type="number"
                  value={datosObjetivo.valorObjetivo}
                  onChange={(e) => setDatosObjetivo({ ...datosObjetivo, valorObjetivo: e.target.value })}
                />
              </div>
              <div className="campo">
                <label htmlFor="unidad-objetivo">Unidad</label>
                <input
                  id="unidad-objetivo"
                  value={datosObjetivo.unidad}
                  onChange={(e) => setDatosObjetivo({ ...datosObjetivo, unidad: e.target.value })}
                />
              </div>
              <div className="acciones">
                <button type="submit" disabled={!datosObjetivo.descripcion}>
                  Registrar objetivo
                </button>
              </div>
            </form>
          </section>

          <section className="tarjeta formulario">
            <h3>Registrar progreso</h3>
            <form onSubmit={registrarProgreso}>
              <div className="campo">
                <label htmlFor="objetivo-progreso">Objetivo</label>
                <select
                  id="objetivo-progreso"
                  value={datosProgreso.idObjetivo}
                  onChange={(e) => setDatosProgreso({ ...datosProgreso, idObjetivo: e.target.value })}
                >
                  <option value="">Sin objetivo asociado</option>
                  {objetivos.map((objetivo) => (
                    <option key={objetivo.id} value={objetivo.id}>
                      {objetivo.descripcion}
                    </option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label htmlFor="valor-progreso">Valor *</label>
                <input
                  id="valor-progreso"
                  type="number"
                  value={datosProgreso.valor}
                  onChange={(e) => setDatosProgreso({ ...datosProgreso, valor: e.target.value })}
                />
              </div>
              <div className="acciones">
                <button type="submit" disabled={datosProgreso.valor === ''}>
                  Registrar progreso
                </button>
              </div>
            </form>
          </section>

          <section className="tarjeta">
            <h2>Historial</h2>
            {objetivos.length > 0 && (
              <>
                <h3>Objetivos</h3>
                <ul>
                  {objetivos.map((objetivo) => (
                    <li key={objetivo.id}>
                      {objetivo.descripcion} ({objetivo.estado})
                    </li>
                  ))}
                </ul>
              </>
            )}
            {progresos.length === 0 && (
              <p className="textosuave">No hay progresos registrados todavía.</p>
            )}
            {progresos.length > 0 && (
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Id</th>
                    <th>Valor</th>
                    <th>Unidad</th>
                    <th>Observaciones</th>
                    <th>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {progresos.map((progreso) => (
                    <tr key={progreso.id}>
                      <td>{progreso.id}</td>
                      <td>{progreso.valor}</td>
                      <td>{progreso.unidad || '—'}</td>
                      <td>{progreso.observaciones || '—'}</td>
                      <td>{progreso.fechaRegistro}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}
    </>
  );
}
