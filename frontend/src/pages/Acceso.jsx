// Reconocimiento facial y control de acceso (FR-018 a FR-024).
// El navegador solo captura el descriptor facial; la decisión de acceso la toma
// el backend al comparar con los rostros registrados y la membresía vigente.

import { useCallback, useEffect, useState } from 'react';
import CapturaFacial from '../components/CapturaFacial.jsx';
import { pedir } from '../services/api.js';

function formatearFechaHora(valor) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleString('es-GT');
}

export default function Acceso() {
  const [accion, setAccion] = useState('validar');
  const [evaluando, setEvaluando] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [clientes, setClientes] = useState([]);
  const [idClienteRostro, setIdClienteRostro] = useState('');
  const [accesos, setAccesos] = useState([]);

  const cargarClientes = useCallback(async () => {
    try {
      const respuesta = await pedir('/api/clientes');
      setClientes(respuesta.clientes ?? []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  const cargarAccesos = useCallback(async () => {
    try {
      const respuesta = await pedir('/api/accesos');
      setAccesos(respuesta.accesos ?? []);
    } catch (err) {
      setError(err.message);
    }
  }, []);

  useEffect(() => {
    cargarClientes();
    cargarAccesos();
  }, [cargarClientes, cargarAccesos]);

  async function validarAcceso(descriptorFacial) {
    setError('');
    setExito('');
    setResultado(null);
    setEvaluando(true);
    try {
      const respuesta = await pedir('/api/accesos/validar', {
        method: 'POST',
        body: JSON.stringify({ descriptorFacial }),
      });

      setResultado({
        estado: respuesta.resultado,
        cliente: respuesta.cliente || null,
        membresia: respuesta.membresia || null,
        motivo: respuesta.motivo || null,
      });
      await cargarAccesos();
    } catch (err) {
      setError(err.message);
    } finally {
      setEvaluando(false);
    }
  }

  async function registrarRostro(descriptorFacial) {
    setError('');
    setExito('');
    if (!idClienteRostro) {
      setError('Seleccione el cliente al que pertenece el rostro.');
      return;
    }

    setRegistrando(true);
    try {
      const estado = await pedir(`/api/rostros/${idClienteRostro}`);
      const actualiza = Boolean(estado.tieneRostro);
      const respuesta = await pedir(
        actualiza ? `/api/rostros/${idClienteRostro}` : '/api/rostros',
        {
          method: actualiza ? 'PUT' : 'POST',
          body: JSON.stringify({
            idCliente: Number(idClienteRostro),
            descriptorFacial,
          }),
        }
      );

      setExito(respuesta.mensaje);
      setIdClienteRostro('');
    } catch (err) {
      setError(err.message);
    } finally {
      setRegistrando(false);
    }
  }

  function seleccionarAccion(nuevaAccion) {
    setAccion(nuevaAccion);
    setError('');
    setExito('');
  }

  const etiquetaBoton = accion === 'registrar' ? 'Registrar rostro' : 'Validar acceso';
  const alCapturar = accion === 'registrar' ? registrarRostro : validarAcceso;

  return (
    <>
      <section className="tarjeta">
        <h2>Reconocimiento facial y control de acceso</h2>
        <p className="textosuave">
          Elija la acción, capture el rostro y el sistema registrará el resultado. Todo intento de
          acceso queda guardado con su motivo.
        </p>

        {exito && <div className="mensaje-exito">{exito}</div>}
        {error && <div className="mensaje-error">{error}</div>}

        <div className="campo">
          <label htmlFor="cliente-rostro">Cliente para registrar su rostro</label>
          <select
            id="cliente-rostro"
            value={idClienteRostro}
            onChange={(evento) => setIdClienteRostro(evento.target.value)}
          >
            <option value="">Seleccione un cliente</option>
            {clientes.map((cliente) => (
              <option key={cliente.id} value={cliente.id}>
                {cliente.nombre} {cliente.apellido}
              </option>
            ))}
          </select>
        </div>

        <div className="acciones" aria-label="Acción de la cámara">
          <button
            type="button"
            className={accion === 'validar' ? '' : 'secundario'}
            onClick={() => seleccionarAccion('validar')}
          >
            Modo: validar acceso
          </button>
          <button
            type="button"
            className={accion === 'registrar' ? '' : 'secundario'}
            onClick={() => seleccionarAccion('registrar')}
          >
            Modo: registrar rostro
          </button>
        </div>

        <div className="panel-acceso">
          <CapturaFacial
            key={accion}
            onCaptura={alCapturar}
            etiquetaBoton={etiquetaBoton}
            deshabilitado={evaluando || registrando}
          />

          <div>
            {resultado ? (
              <div
                className={`resultado-acceso ${
                  resultado.estado === 'autorizado' ? 'autorizado' : 'rechazado'
                }`}
              >
                <h3>
                  {resultado.estado === 'autorizado' ? 'Acceso autorizado' : 'Acceso rechazado'}
                </h3>

                {resultado.cliente && (
                  <p>
                    Cliente identificado:{' '}
                    <strong>
                      {resultado.cliente.nombre} {resultado.cliente.apellido}
                    </strong>
                  </p>
                )}

                {resultado.membresia && (
                  <p className="textosuave">
                    Membresía {resultado.membresia.estado} hasta{' '}
                    {resultado.membresia.fechaFin}
                  </p>
                )}

                {resultado.motivo && <p className="textosuave">Motivo: {resultado.motivo}</p>}
              </div>
            ) : (
              <p className="textosuave">
                El resultado de la validación aparecerá aquí junto con el cliente identificado y el
                motivo en caso de rechazo.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="tarjeta">
        <h2>Accesos recientes</h2>
        <p className="textosuave">
          Se muestran los últimos intentos registrados, autorizados y rechazados.
        </p>

        {accesos.length === 0 ? (
          <p className="textosuave">Todavía no hay accesos registrados.</p>
        ) : (
          <table className="tabla">
            <thead>
              <tr>
                <th>Fecha y hora</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Resultado</th>
                <th>Motivo</th>
              </tr>
            </thead>
            <tbody>
              {accesos.slice(0, 10).map((acceso) => (
                <tr key={acceso.id}>
                  <td>{formatearFechaHora(acceso.fechaHora)}</td>
                  <td>{acceso.cliente || 'No reconocido'}</td>
                  <td>{acceso.tipo}</td>
                  <td>
                    <span className={`etiqueta-estado ${acceso.resultado}`}>
                      {acceso.resultado}
                    </span>
                  </td>
                  <td>{acceso.motivoRechazo || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </>
  );
}
