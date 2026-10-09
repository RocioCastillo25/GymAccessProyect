// Modificación de clientes (HU5, FR-015).

import { useEffect, useState } from 'react';
import { pedir } from '../services/api.js';

const ESTADO_INICIAL = { id: '', nombre: '', apellido: '', correo: '', telefono: '', direccion: '' };

export default function ClientesEdicion() {
  const [busqueda, setBusqueda] = useState('');
  const [cliente, setCliente] = useState(null);
  const [datos, setDatos] = useState(ESTADO_INICIAL);
  const [exito, setExito] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (cliente) {
      setDatos({
        id: cliente.id,
        nombre: cliente.nombre || '',
        apellido: cliente.apellido || '',
        correo: cliente.correo || '',
        telefono: cliente.telefono || '',
        direccion: cliente.direccion || '',
      });
    }
  }, [cliente]);

  function cambiar(campo) {
    return (evento) => setDatos({ ...datos, [campo]: evento.target.value });
  }

  async function buscar(evento) {
    evento.preventDefault();
    setExito('');
    setError('');
    setCliente(null);
    setCargando(true);
    try {
      const respuesta = await pedir(`/api/clientes/${busqueda.trim()}`);
      setCliente(respuesta.cliente);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  async function guardar(evento) {
    evento.preventDefault();
    setExito('');
    setError('');
    setCargando(true);
    try {
      const cuerpo = {
        nombre: datos.nombre.trim(),
        apellido: datos.apellido.trim(),
        correo: datos.correo.trim().toLowerCase(),
        telefono: datos.telefono.trim(),
        direccion: datos.direccion.trim(),
      };
      const respuesta = await pedir(`/api/clientes/${datos.id}`, {
        method: 'PATCH',
        body: JSON.stringify(cuerpo),
      });
      setExito(respuesta.mensaje);
      setCliente(respuesta.cliente);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="tarjeta formulario">
      <h2>Modificar cliente</h2>

      {exito && <div className="mensaje-exito">{exito}</div>}
      {error && <div className="mensaje-error">{error}</div>}

      <form onSubmit={buscar} className="acciones">
        <input
          aria-label="Identificador del cliente"
          placeholder="Id del cliente"
          value={busqueda}
          onChange={(evento) => setBusqueda(evento.target.value)}
        />
        <button type="submit" disabled={cargando || !busqueda.trim()}>
          Buscar
        </button>
      </form>

      {cliente && (
        <form onSubmit={guardar}>
          <div className="campo">
            <label htmlFor="ed-nombre">Nombre *</label>
            <input id="ed-nombre" value={datos.nombre} onChange={cambiar('nombre')} />
          </div>
          <div className="campo">
            <label htmlFor="ed-apellido">Apellido *</label>
            <input id="ed-apellido" value={datos.apellido} onChange={cambiar('apellido')} />
          </div>
          <div className="campo">
            <label htmlFor="ed-correo">Correo *</label>
            <input
              id="ed-correo"
              type="email"
              value={datos.correo}
              onChange={cambiar('correo')}
            />
          </div>
          <div className="campo">
            <label htmlFor="ed-telefono">Teléfono</label>
            <input id="ed-telefono" value={datos.telefono} onChange={cambiar('telefono')} />
          </div>
          <div className="campo">
            <label htmlFor="ed-direccion">Dirección</label>
            <input id="ed-direccion" value={datos.direccion} onChange={cambiar('direccion')} />
          </div>
          <div className="acciones">
            <button type="submit" disabled={cargando}>
              {cargando ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
