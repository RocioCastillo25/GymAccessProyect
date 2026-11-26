// Reconocimiento facial y control de acceso (FR-018 a FR-024).
// El navegador solo captura el descriptor facial; la decisión de acceso la toma
// el backend al comparar con los rostros registrados y la membresía vigente.

import { useCallback, useEffect, useRef, useState } from 'react';
import { pedir } from '../services/api.js';

let promesaModelos = null;
let faceapi = null;

// La librería de visión se carga bajo demanda para no penalizar el arranque.
function cargarModelos() {
  if (!promesaModelos) {
    promesaModelos = import('@vladmandic/face-api').then((mod) => {
      faceapi = mod;
      return Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
      ]);
    });
  }
  return promesaModelos;
}

function formatearFechaHora(valor) {
  if (!valor) return '—';
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return String(valor);
  return fecha.toLocaleString('es-GT');
}

export default function Acceso() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [evaluando, setEvaluando] = useState(false);
  const [registrando, setRegistrando] = useState(false);
  const [mensajeCamara, setMensajeCamara] = useState('');
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

  const detenerCamara = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((pista) => pista.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamaraActiva(false);
  }, []);

  useEffect(() => detenerCamara, [detenerCamara]);

  useEffect(() => {
    if (!camaraActiva || !videoRef.current || !streamRef.current) return;
    videoRef.current.srcObject = streamRef.current;
    const reproduccion = videoRef.current.play();
    if (reproduccion?.catch) reproduccion.catch(() => {});
  }, [camaraActiva]);

  async function iniciarCamara() {
    setError('');
    setMensajeCamara('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamaraActiva(true);
    } catch {
      setMensajeCamara('No se pudo acceder a la cámara. Verifique los permisos del navegador.');
    }
  }

  async function capturarDescriptor() {
    await cargarModelos();
    return faceapi
      .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
      .withFaceLandmarks()
      .withFaceDescriptor();
  }

  async function validarAcceso() {
    setError('');
    setExito('');
    setResultado(null);

    if (!streamRef.current) {
      setError('Inicie la cámara antes de validar el acceso.');
      return;
    }

    setEvaluando(true);
    try {
      const deteccion = await capturarDescriptor();

      if (!deteccion) {
        setError('No se detectó un rostro. Acérquese a la cámara e intente de nuevo.');
        return;
      }

      const respuesta = await pedir('/api/accesos/validar', {
        method: 'POST',
        body: JSON.stringify({ descriptorFacial: Array.from(deteccion.descriptor) }),
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

  async function registrarRostro() {
    setError('');
    setExito('');

    if (!streamRef.current) {
      setError('Inicie la cámara antes de registrar un rostro.');
      return;
    }
    if (!idClienteRostro) {
      setError('Seleccione el cliente al que pertenece el rostro.');
      return;
    }

    setRegistrando(true);
    try {
      const deteccion = await capturarDescriptor();
      if (!deteccion) {
        setError('No se detectó un rostro. Acérquese a la cámara e intente de nuevo.');
        return;
      }

      const estado = await pedir(`/api/rostros/${idClienteRostro}`);
      const actualiza = Boolean(estado.tieneRostro);
      const respuesta = await pedir(
        actualiza ? `/api/rostros/${idClienteRostro}` : '/api/rostros',
        {
          method: actualiza ? 'PUT' : 'POST',
          body: JSON.stringify({
            idCliente: Number(idClienteRostro),
            descriptorFacial: Array.from(deteccion.descriptor),
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

  return (
    <>
      <section className="tarjeta">
        <h2>Reconocimiento facial y control de acceso</h2>
        <p className="textosuave">
          Registre primero el rostro del cliente y luego valide su acceso. Todo intento queda
          registrado con su resultado y motivo.
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

        <div className="panel-acceso">
          <div>
            <div className="visor-camera">
              {camaraActiva ? (
                <video ref={videoRef} playsInline muted />
              ) : (
                <p className="textosuave">{mensajeCamara || 'Cámara apagada'}</p>
              )}
            </div>

            <div className="acciones">
              {camaraActiva ? (
                <button type="button" className="secundario" onClick={detenerCamara}>
                  Detener cámara
                </button>
              ) : (
                <button type="button" className="secundario" onClick={iniciarCamara}>
                  Iniciar cámara
                </button>
              )}
              <button
                type="button"
                className="secundario"
                onClick={registrarRostro}
                disabled={!camaraActiva || registrando || !idClienteRostro}
              >
                {registrando ? 'Registrando…' : 'Registrar rostro'}
              </button>
              <button type="button" onClick={validarAcceso} disabled={!camaraActiva || evaluando}>
                {evaluando ? 'Validando…' : 'Validar acceso'}
              </button>
            </div>
          </div>

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
