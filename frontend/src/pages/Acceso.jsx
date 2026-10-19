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

export default function Acceso() {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [evaluando, setEvaluando] = useState(false);
  const [mensajeCamara, setMensajeCamara] = useState('');
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');

  const detenerCamara = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((pista) => pista.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamaraActiva(false);
  }, []);

  useEffect(() => detenerCamara, [detenerCamara]);

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

  async function validarAcceso() {
    setError('');
    setResultado(null);

    if (!streamRef.current) {
      setError('Inicie la cámara antes de validar el acceso.');
      return;
    }

    setEvaluando(true);
    try {
      await cargarModelos();
      const deteccion = await faceapi
        .detectSingleFace(videoRef.current, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

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
    } catch (err) {
      setError(err.message);
    } finally {
      setEvaluando(false);
    }
  }

  return (
    <section className="tarjeta">
      <h2>Reconocimiento facial y control de acceso</h2>
      <p className="textosuave">
        Capture el rostro del cliente para identificarlo y validar su membresía vigente. Todo
        intento de acceso queda registrado.
      </p>

      {error && <div className="mensaje-error">{error}</div>}

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
            <button type="button" onClick={validarAcceso} disabled={!camaraActiva || evaluando}>
              {evaluando ? 'Validando…' : 'Validar acceso'}
            </button>
          </div>
        </div>

        <div>
          {resultado ? (
            <div className={`resultado-acceso ${resultado.estado === 'autorizado' ? 'autorizado' : 'rechazado'}`}>
              <h3>{resultado.estado === 'autorizado' ? 'Acceso autorizado' : 'Acceso rechazado'}</h3>

              {resultado.cliente && (
                <p>
                  Cliente identificado: <strong>{resultado.cliente.nombre} {resultado.cliente.apellido}</strong>
                </p>
              )}

              {resultado.membresia && (
                <p className="textosuave">
                  Membresía {resultado.membresia.estado} hasta {resultado.membresia.fechaFin}
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
  );
}
