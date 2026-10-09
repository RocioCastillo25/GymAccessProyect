// Registro de clientes (HU2, FR-014, FR-018).

import { useState } from 'react';
import { pedir } from '../services/api.js';

const ESTADO_INICIAL = {
  nombre: '',
  apellido: '',
  correo: '',
  telefono: '',
  direccion: '',
};

export default function ClientesRegistro() {
  const [datos, setDatos] = useState(ESTADO_INICIAL);
  const [exito, setExito] = useState('');
  const [error, setError] = useState('');
  const [erroresCampo, setErroresCampo] = useState({});
  const [cargando, setCargando] = useState(false);

  function cambiar(campo) {
    return (evento) => setDatos({ ...datos, [campo]: evento.target.value });
  }

  // Validación espejo: el backend sigue siendo la autoridad (FR-018).
  function validarLocal() {
    const locales = {};
    if (!datos.nombre.trim()) locales.nombre = 'El campo nombre es obligatorio.';
    if (!datos.apellido.trim()) locales.apellido = 'El campo apellido es obligatorio.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(datos.correo.trim())) {
      locales.correo = 'El correo no tiene un formato válido.';
    }
    return locales;
  }

  async function enviar(evento) {
    evento.preventDefault();
    setExito('');
    setError('');
    setErroresCampo({});

    const locales = validarLocal();
    if (Object.keys(locales).length > 0) {
      setErroresCampo(locales);
      return;
    }

    setCargando(true);
    try {
      const respuesta = await pedir('/api/clientes', {
        method: 'POST',
        body: JSON.stringify({
          nombre: datos.nombre.trim(),
          apellido: datos.apellido.trim(),
          correo: datos.correo.trim().toLowerCase(),
          telefono: datos.telefono.trim() || undefined,
          direccion: datos.direccion.trim() || undefined,
        }),
      });
      setExito(respuesta.mensaje);
      setDatos(ESTADO_INICIAL);
    } catch (err) {
      if (err.errores) {
        const porCampo = Object.fromEntries(err.errores.map((item) => [item.campo, item.error]));
        setErroresCampo(porCampo);
        setError(err.message);
      } else {
        setError(err.message);
      }
    } finally {
      setCargando(false);
    }
  }

  return (
    <section className="tarjeta formulario">
      <h2>Registrar cliente</h2>

      {exito && <div className="mensaje-exito">{exito}</div>}
      {error && <div className="mensaje-error">{error}</div>}

      <form onSubmit={enviar}>
        <div className="campo">
          <label htmlFor="nombre">Nombre *</label>
          <input id="nombre" value={datos.nombre} onChange={cambiar('nombre')} />
          {erroresCampo.nombre && <small className="texto-error">{erroresCampo.nombre}</small>}
        </div>

        <div className="campo">
          <label htmlFor="apellido">Apellido *</label>
          <input id="apellido" value={datos.apellido} onChange={cambiar('apellido')} />
          {erroresCampo.apellido && (
            <small className="texto-error">{erroresCampo.apellido}</small>
          )}
        </div>

        <div className="campo">
          <label htmlFor="correo">Correo *</label>
          <input id="correo" type="email" value={datos.correo} onChange={cambiar('correo')} />
          {erroresCampo.correo && <small className="texto-error">{erroresCampo.correo}</small>}
        </div>

        <div className="campo">
          <label htmlFor="telefono">Teléfono</label>
          <input id="telefono" value={datos.telefono} onChange={cambiar('telefono')} />
          {erroresCampo.telefono && (
            <small className="texto-error">{erroresCampo.telefono}</small>
          )}
        </div>

        <div className="campo">
          <label htmlFor="direccion">Dirección</label>
          <input id="direccion" value={datos.direccion} onChange={cambiar('direccion')} />
          {erroresCampo.direccion && (
            <small className="texto-error">{erroresCampo.direccion}</small>
          )}
        </div>

        <div className="acciones">
          <button type="submit" disabled={cargando}>
            {cargando ? 'Guardando…' : 'Registrar cliente'}
          </button>
        </div>
      </form>
    </section>
  );
}
