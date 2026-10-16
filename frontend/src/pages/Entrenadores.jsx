// Gestión de entrenadores (HU1, FR-001 a FR-004).

import { useCallback, useEffect, useState } from 'react';
import { pedir } from '../services/api.js';

const FORMULARIO_INICIAL = { idUsuario: '', especialidad: '', telefono: '' };

export default function Entrenadores() {
  const [entrenadores, setEntrenadores] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [datos, setDatos] = useState(FORMULARIO_INICIAL);
  const [edicion, setEdicion] = useState(null);
  const [exito, setExito] = useState('');
  const [error, setError] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [respuestaEntrenadores, respuestaUsuarios] = await Promise.all([
        pedir('/api/entrenadores'),
        pedir('/api/usuarios'),
      ]);
      setEntrenadores(respuestaEntrenadores.entrenadores);
      setUsuarios(respuestaUsuarios.usuarios);
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

  async function registrar(evento) {
    evento.preventDefault();
    setExito('');
    setError('');
    try {
      const respuesta = await pedir('/api/entrenadores', {
        method: 'POST',
        body: JSON.stringify({
          idUsuario: Number(datos.idUsuario),
          especialidad: datos.especialidad,
          telefono: datos.telefono,
        }),
      });
      setExito(respuesta.mensaje);
      setDatos(FORMULARIO_INICIAL);
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function guardarEdicion(evento) {
    evento.preventDefault();
    setExito('');
    setError('');
    try {
      const respuesta = await pedir(`/api/entrenadores/${edicion.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          especialidad: edicion.especialidad,
          telefono: edicion.telefono,
        }),
      });
      setExito(respuesta.mensaje);
      setEdicion(null);
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function cambiarEstado(entrenador) {
    setExito('');
    setError('');
    const nuevo = entrenador.estado === 'activo' ? 'inactivo' : 'activo';
    try {
      const respuesta = await pedir(`/api/entrenadores/${entrenador.id}/estado`, {
        method: 'PATCH',
        body: JSON.stringify({ estado: nuevo }),
      });
      setExito(respuesta.mensaje);
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  const usuariosEntrenadores = usuarios.filter(
    (usuario) => usuario.rol === 'entrenador' && usuario.estado === 'activo'
  );

  return (
    <>
      <section className="tarjeta formulario">
        <h2>Registrar entrenador</h2>

        {exito && <div className="mensaje-exito">{exito}</div>}
        {error && <div className="mensaje-error">{error}</div>}

        <form onSubmit={registrar}>
          <div className="campo">
            <label htmlFor="usuario-entrenador">Usuario con rol entrenador *</label>
            <select id="usuario-entrenador" value={datos.idUsuario} onChange={cambiar('idUsuario')}>
              <option value="">Seleccione un usuario</option>
              {usuarios
                .filter((usuario) => usuario.rol === 'entrenador')
                .map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>
                    {usuario.nombre} ({usuario.correo}){usuario.estado !== 'activo' ? ' · inactivo' : ''}
                  </option>
                ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="especialidad-entrenador">Especialidad</label>
            <input
              id="especialidad-entrenador"
              value={datos.especialidad}
              maxLength={100}
              onChange={cambiar('especialidad')}
            />
          </div>

          <div className="campo">
            <label htmlFor="telefono-entrenador">Teléfono</label>
            <input id="telefono-entrenador" value={datos.telefono} onChange={cambiar('telefono')} />
          </div>

          <div className="acciones">
            <button type="submit" disabled={!datos.idUsuario}>
              Registrar entrenador
            </button>
          </div>
        </form>
      </section>

      {edicion && (
        <section className="tarjeta formulario">
          <h2>Modificar entrenador</h2>
          <form onSubmit={guardarEdicion}>
            <div className="campo">
              <label htmlFor="editar-especialidad">Especialidad</label>
              <input
                id="editar-especialidad"
                value={edicion.especialidad}
                onChange={(evento) => setEdicion({ ...edicion, especialidad: evento.target.value })}
              />
            </div>
            <div className="campo">
              <label htmlFor="editar-telefono">Teléfono</label>
              <input
                id="editar-telefono"
                value={edicion.telefono}
                onChange={(evento) => setEdicion({ ...edicion, telefono: evento.target.value })}
              />
            </div>
            <div className="acciones">
              <button type="submit">Guardar</button>
              <button type="button" className="secundario" onClick={() => setEdicion(null)}>
                Cancelar
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="tarjeta">
        <h2>Entrenadores registrados</h2>

        {entrenadores.length === 0 && (
          <p className="textosuave">No hay entrenadores registrados todavía.</p>
        )}

        {entrenadores.length > 0 && (
          <table className="tabla">
            <thead>
              <tr>
                <th>Id</th>
                <th>Nombre</th>
                <th>Correo</th>
                <th>Especialidad</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {entrenadores.map((entrenador) => (
                <tr key={entrenador.id}>
                  <td>{entrenador.id}</td>
                  <td>{entrenador.nombre}</td>
                  <td>{entrenador.correo}</td>
                  <td>{entrenador.especialidad || '—'}</td>
                  <td>{entrenador.telefono || '—'}</td>
                  <td>
                    <span className={`etiqueta-estado ${entrenador.estado}`}>
                      {entrenador.estado}
                    </span>
                  </td>
                  <td className="acciones">
                    <button
                      type="button"
                      className="secundario"
                      onClick={() =>
                        setEdicion({
                          id: entrenador.id,
                          especialidad: entrenador.especialidad || '',
                          telefono: entrenador.telefono || '',
                        })
                      }
                    >
                      Modificar
                    </button>
                    <button
                      type="button"
                      className="secundario"
                      onClick={() => cambiarEstado(entrenador)}
                    >
                      {entrenador.estado === 'activo' ? 'Desactivar' : 'Activar'}
                    </button>
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
