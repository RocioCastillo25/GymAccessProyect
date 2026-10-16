// Creación de rutinas del entrenador (HU3, FR-009 a FR-012).

import { useCallback, useEffect, useState } from 'react';
import { pedir } from '../services/api.js';

const EJERCICIO_VACIO = { nombre: '', series: '', repeticiones: '', peso: '', descanso: '', orden: '' };

export default function Rutinas() {
  const [clientes, setClientes] = useState([]);
  const [idCliente, setIdCliente] = useState('');
  const [rutinas, setRutinas] = useState([]);
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [ejercicios, setEjercicios] = useState([{ ...EJERCICIO_VACIO }]);
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

  const cargarRutinas = useCallback(async (id) => {
    if (!id) {
      setRutinas([]);
      return;
    }
    try {
      const respuesta = await pedir(`/api/rutinas/cliente/${id}`);
      setRutinas(respuesta.rutinas);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  useEffect(() => {
    cargarRutinas(idCliente);
  }, [idCliente, cargarRutinas]);

  function cambiarEjercicio(indice, campo, valor) {
    setEjercicios((lista) =>
      lista.map((ejercicio, posicion) =>
        posicion === indice ? { ...ejercicio, [campo]: valor } : ejercicio
      )
    );
  }

  function agregarEjercicio() {
    setEjercicios((lista) => [...lista, { ...EJERCICIO_VACIO, orden: String(lista.length + 1) }]);
  }

  function quitarEjercicio(indice) {
    setEjercicios((lista) => lista.filter((_, posicion) => posicion !== indice));
  }

  async function crear(evento) {
    evento.preventDefault();
    setExito('');
    setError('');
    try {
      const respuesta = await pedir('/api/rutinas', {
        method: 'POST',
        body: JSON.stringify({
          idCliente: Number(idCliente),
          nombre,
          descripcion,
          ejercicios: ejercicios
            .filter((ejercicio) => ejercicio.nombre.trim() !== '')
            .map((ejercicio, indice) => ({
              nombre: ejercicio.nombre,
              series: ejercicio.series === '' ? null : Number(ejercicio.series),
              repeticiones: ejercicio.repeticiones || null,
              peso: ejercicio.peso || null,
              descanso: ejercicio.descanso || null,
              orden: ejercicio.orden === '' ? indice + 1 : Number(ejercicio.orden),
            })),
        }),
      });
      setExito(respuesta.mensaje);
      setNombre('');
      setDescripcion('');
      setEjercicios([{ ...EJERCICIO_VACIO }]);
      await cargarRutinas(idCliente);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <section className="tarjeta formulario">
        <h2>Crear rutina</h2>

        {exito && <div className="mensaje-exito">{exito}</div>}
        {error && <div className="mensaje-error">{error}</div>}

        <div className="campo">
          <label htmlFor="cliente-rutina">Cliente a su cargo *</label>
          <select id="cliente-rutina" value={idCliente} onChange={(evento) => setIdCliente(evento.target.value)}>
            <option value="">Seleccione un cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre}
              </option>
            ))}
          </select>
        </div>

        {clientes.length === 0 && (
          <p className="textosuave">No tiene clientes asignados todavía.</p>
        )}

        {idCliente && (
          <form onSubmit={crear}>
            <div className="campo">
              <label htmlFor="nombre-rutina">Nombre *</label>
              <input id="nombre-rutina" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="campo">
              <label htmlFor="descripcion-rutina">Descripción</label>
              <input
                id="descripcion-rutina"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
              />
            </div>

            <h3>Ejercicios</h3>
            {ejercicios.map((ejercicio, indice) => (
              <div className="campo" key={indice}>
                <input
                  placeholder="Nombre del ejercicio"
                  value={ejercicio.nombre}
                  onChange={(e) => cambiarEjercicio(indice, 'nombre', e.target.value)}
                />
                <input
                  type="number"
                  min="1"
                  placeholder="Series"
                  value={ejercicio.series}
                  onChange={(e) => cambiarEjercicio(indice, 'series', e.target.value)}
                />
                <input
                  placeholder="Repeticiones"
                  value={ejercicio.repeticiones}
                  onChange={(e) => cambiarEjercicio(indice, 'repeticiones', e.target.value)}
                />
                <input
                  placeholder="Peso"
                  value={ejercicio.peso}
                  onChange={(e) => cambiarEjercicio(indice, 'peso', e.target.value)}
                />
                <input
                  placeholder="Descanso"
                  value={ejercicio.descanso}
                  onChange={(e) => cambiarEjercicio(indice, 'descanso', e.target.value)}
                />
                <button
                  type="button"
                  className="secundario"
                  onClick={() => quitarEjercicio(indice)}
                  disabled={ejercicios.length === 1}
                >
                  Quitar
                </button>
              </div>
            ))}

            <div className="acciones">
              <button type="button" className="secundario" onClick={agregarEjercicio}>
                Agregar ejercicio
              </button>
              <button type="submit" disabled={!nombre}>
                Crear rutina
              </button>
            </div>
          </form>
        )}
      </section>

      {idCliente && (
        <section className="tarjeta">
          <h2>Rutinas del cliente</h2>
          {rutinas.length === 0 && <p className="textosuave">El cliente no tiene rutinas todavía.</p>}
          {rutinas.map((rutina) => (
            <article key={rutina.id} className="tarjeta">
              <h3>
                {rutina.nombre}{' '}
                <span className={`etiqueta-estado ${rutina.estado}`}>{rutina.estado}</span>
              </h3>
              {rutina.descripcion && <p>{rutina.descripcion}</p>}
              <ul>
                {rutina.ejercicios?.map((ejercicio) => (
                  <li key={ejercicio.id}>
                    {ejercicio.nombre}
                    {ejercicio.series ? ` · ${ejercicio.series} series` : ''}
                    {ejercicio.repeticiones ? ` × ${ejercicio.repeticiones}` : ''}
                    {ejercicio.peso ? ` · ${ejercicio.peso}` : ''}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </section>
      )}
    </>
  );
}
