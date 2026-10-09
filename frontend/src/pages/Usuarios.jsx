// Gestión de usuarios del administrador (HU3, FR-007 a FR-013).

import { useCallback, useEffect, useState } from 'react';
import { pedir } from '../services/api.js';
import ControlesUsuario from '../components/ControlesUsuario.jsx';

const ESTADO_INICIAL = { nombre: '', correo: '', password: '', rol: 'recepcionista' };

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState([]);
  const [datos, setDatos] = useState(ESTADO_INICIAL);
  const [editando, setEditando] = useState(null);
  const [exito, setExito] = useState('');
  const [error, setError] = useState('');
  const [erroresCampo, setErroresCampo] = useState({});

  const cargar = useCallback(async () => {
    try {
      const respuesta = await pedir('/api/usuarios');
      setUsuarios(respuesta.usuarios);
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

  async function enviar(evento) {
    evento.preventDefault();
    limpiarMensajes();

    try {
      if (editando) {
        await pedir(`/api/usuarios/${editando}`, {
          method: 'PATCH',
          body: JSON.stringify({ nombre: datos.nombre, correo: datos.correo }),
        });
        setExito('Usuario actualizado correctamente.');
      } else {
        await pedir('/api/usuarios', {
          method: 'POST',
          body: JSON.stringify(datos),
        });
        setExito('Usuario creado correctamente.');
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

  async function restablecer(id) {
    limpiarMensajes();
    const password = window.prompt(
      'Nueva contraseña para el usuario (mínimo 8 caracteres):'
    );
    if (!password) return;
    try {
      const respuesta = await pedir(`/api/usuarios/${id}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ password }),
      });
      setExito(respuesta.mensaje);
    } catch (err) {
      if (err.errores) {
        setErroresCampo(Object.fromEntries(err.errores.map((item) => [item.campo, item.error])));
      }
      setError(err.message);
    }
  }

  function iniciarEdicion(usuario) {
    limpiarMensajes();
    setEditando(usuario.id);
    setDatos({ nombre: usuario.nombre, correo: usuario.correo, password: '', rol: usuario.rol });
  }

  async function cambiarRolOPassword(id, cuerpo) {
    limpiarMensajes();
    try {
      const ruta = cuerpo.rol !== undefined ? `/api/usuarios/${id}/rol` : `/api/usuarios/${id}/estado`;
      const respuesta = await pedir(ruta, { method: 'PATCH', body: JSON.stringify(cuerpo) });
      setExito(respuesta.mensaje);
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <section className="tarjeta formulario">
        <h2>{editando ? 'Modificar usuario' : 'Registrar usuario'}</h2>

        {exito && <div className="mensaje-exito">{exito}</div>}
        {error && <div className="mensaje-error">{error}</div>}

        <form onSubmit={enviar}>
          <div className="campo">
            <label htmlFor="nombre-usuario">Nombre *</label>
            <input id="nombre-usuario" value={datos.nombre} onChange={cambiar('nombre')} />
            {erroresCampo.nombre && <small className="texto-error">{erroresCampo.nombre}</small>}
          </div>

          <div className="campo">
            <label htmlFor="correo-usuario">Correo *</label>
            <input
              id="correo-usuario"
              type="email"
              value={datos.correo}
              onChange={cambiar('correo')}
            />
            {erroresCampo.correo && <small className="texto-error">{erroresCampo.correo}</small>}
          </div>

          {!editando && (
            <div className="campo">
              <label htmlFor="password-usuario">Contraseña * (mínimo 8 caracteres)</label>
              <input
                id="password-usuario"
                type="password"
                value={datos.password}
                onChange={cambiar('password')}
              />
              {erroresCampo.password && (
                <small className="texto-error">{erroresCampo.password}</small>
              )}
            </div>
          )}

          <div className="campo">
            <label htmlFor="rol-usuario">Rol *</label>
            <select
              id="rol-usuario"
              value={datos.rol}
              onChange={cambiar('rol')}
              disabled={Boolean(editando)}
            >
              <option value="administrador">Administrador</option>
              <option value="recepcionista">Recepcionista</option>
              <option value="entrenador">Entrenador</option>
              <option value="cliente">Cliente</option>
            </select>
            {erroresCampo.rol && <small className="texto-error">{erroresCampo.rol}</small>}
          </div>

          <div className="acciones">
            <button type="submit">{editando ? 'Guardar cambios' : 'Crear usuario'}</button>
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

      <section className="tarjeta">
        <h2>Usuarios registrados</h2>
        <table className="tabla">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {usuarios.map((usuario) => (
              <tr key={usuario.id}>
                <td>{usuario.nombre}</td>
                <td>{usuario.correo}</td>
                <td>{usuario.rol}</td>
                <td>
                  <span className={`etiqueta-estado ${usuario.estado}`}>{usuario.estado}</span>
                </td>
                <td className="acciones">
                  <button type="button" className="secundario" onClick={() => iniciarEdicion(usuario)}>
                    Editar
                  </button>
                  <button type="button" className="secundario" onClick={() => restablecer(usuario.id)}>
                    Restablecer contraseña
                  </button>
                  <ControlesUsuario
                    usuario={usuario}
                    onCambiar={cambiarRolOPassword}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {usuarios.length === 0 && <p className="textosuave">No hay usuarios registrados.</p>}
      </section>
    </>
  );
}
