// Gestión de tipos de membresía (HU1, FR-001 a FR-004).
// El entrenador solo ve id, nombre y duración; el precio nunca llega a su rol.

import { useCallback, useEffect, useState } from 'react';
import { pedir } from '../services/api.js';
import { useSesion } from '../context/SesionContext.jsx';

const ESTADO_INICIAL = { nombre: '', descripcion: '', duracion: '', precio: '' };

export default function TiposMembresia() {
  const { rol } = useSesion();
  const esAdministrador = rol === 'administrador';
  const esEntrenador = rol === 'entrenador';

  const [tipos, setTipos] = useState([]);
  const [datos, setDatos] = useState(ESTADO_INICIAL);
  const [editando, setEditando] = useState(null);
  const [exito, setExito] = useState('');
  const [error, setError] = useState('');
  const [erroresCampo, setErroresCampo] = useState({});

  const cargar = useCallback(async () => {
    try {
      const respuesta = await pedir('/api/tipos-membresia');
      setTipos(respuesta.tiposMembresia);
      setError('');
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

  function limpiarMensajes() {
    setExito('');
    setError('');
    setErroresCampo({});
  }

  function iniciarEdicion(tipo) {
    setExito('');
    setError('');
    setErroresCampo({});
    setEditando(tipo.id);
    setDatos({
      nombre: tipo.nombre,
      descripcion: tipo.descripcion || '',
      duracion: String(tipo.duracion),
      precio: String(tipo.precio ?? ''),
    });
  }

  async function enviar(evento) {
    evento.preventDefault();
    setExito('');
    setError('');
    setErroresCampo({});

    const cuerpo = {
      nombre: datos.nombre,
      descripcion: datos.descripcion,
      duracion: Number(datos.duracion),
      precio: Number(datos.precio),
    };

    try {
      if (editando) {
        const respuesta = await pedir(`/api/tipos-membresia/${editando}`, {
          method: 'PATCH',
          body: JSON.stringify(cuerpo),
        });
        setExito(respuesta.mensaje);
      } else {
        const respuesta = await pedir('/api/tipos-membresia', {
          method: 'POST',
          body: JSON.stringify(cuerpo),
        });
        setExito(respuesta.mensaje);
      }
      setDatos(ESTADO_INICIAL);
      setEditando(null);
      await cargar();
    } catch (err) {
      if (err.errores) {
        setErroresCampo(Object.fromEntries(err.errores.map((item) => [item.campo, item.error])));
      }
      setError(err.message);
    }
  }

  async function cambiarEstado(tipo) {
    setExito('');
    setError('');
    const nuevoEstado = tipo.estado === 'activo' ? 'inactivo' : 'activo';
    try {
      const respuesta = await pedir(`/api/tipos-membresia/${tipo.id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: nuevoEstado }),
      });
      setExito(respuesta.mensaje);
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      {esAdministrador && (
        <section className="tarjeta formulario">
          <h2>{editando ? 'Modificar tipo de membresía' : 'Registrar tipo de membresía'}</h2>

          {exito && <div className="mensaje-exito">{exito}</div>}
          {error && <div className="mensaje-error">{error}</div>}

          <form onSubmit={enviar}>
            <div className="campo">
              <label htmlFor="nombre-tipo">Nombre *</label>
              <input id="nombre-tipo" value={datos.nombre} onChange={cambiar('nombre')} />
              {erroresCampo.nombre && <small className="texto-error">{erroresCampo.nombre}</small>}
            </div>

            <div className="campo">
              <label htmlFor="descripcion-tipo">Descripción</label>
              <input
                id="descripcion-tipo"
                value={datos.descripcion}
                onChange={cambiar('descripcion')}
              />
              {erroresCampo.descripcion && (
                <small className="texto-error">{erroresCampo.descripcion}</small>
              )}
            </div>

            <div className="campo">
              <label htmlFor="duracion-tipo">Duración en días *</label>
              <input
                id="duracion-tipo"
                type="number"
                min="1"
                value={datos.duracion}
                onChange={cambiar('duracion')}
              />
              {erroresCampo.duracion && (
                <small className="texto-error">{erroresCampo.duracion}</small>
              )}
            </div>

            <div className="campo">
              <label htmlFor="precio-tipo">Precio *</label>
              <input
                id="precio-tipo"
                type="number"
                min="0"
                step="0.01"
                value={datos.precio}
                onChange={cambiar('precio')}
              />
              {erroresCampo.precio && <small className="texto-error">{erroresCampo.precio}</small>}
            </div>

            <div className="acciones">
              <button type="submit">{editando ? 'Guardar cambios' : 'Crear tipo'}</button>
              {editando && (
                <button
                  type="button"
                  className="secundario"
                  onClick={() => {
                    setEditando(null);
                    setDatos(ESTADO_INICIAL);
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </form>
        </section>
      )}

      <section className="tarjeta">
        <h2>Tipos de membresía</h2>

        {!esAdministrador && exito && <div className="mensaje-exito">{exito}</div>}
        {!esAdministrador && error && <div className="mensaje-error">{error}</div>}

        {tipos.length === 0 && <p className="textosuave">No hay tipos de membresía registrados.</p>}

        {tipos.length > 0 && (
          <table className="tabla">
            <thead>
              <tr>
                <th>Id</th>
                <th>Nombre</th>
                {!esEntrenador && <th>Descripción</th>}
                <th>Duración (días)</th>
                {!esEntrenador && <th>Precio</th>}
                {!esEntrenador && <th>Estado</th>}
                {esAdministrador && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {tipos.map((tipo) => (
                <tr key={tipo.id}>
                  <td>{tipo.id}</td>
                  <td>{tipo.nombre}</td>
                  {!esEntrenador && <td>{tipo.descripcion || '—'}</td>}
                  <td>{tipo.duracion}</td>
                  {!esEntrenador && <td>{tipo.precio}</td>}
                  {!esEntrenador && (
                    <td>
                      <span className={`etiqueta-estado ${tipo.estado}`}>{tipo.estado}</span>
                    </td>
                  )}
                  {esAdministrador && (
                    <td className="acciones">
                      <button
                        type="button"
                        className="secundario"
                        onClick={() => iniciarEdicion(tipo)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="secundario"
                        onClick={() => cambiarEstado(tipo)}
                      >
                        {tipo.estado === 'activo' ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
