// Componente reutilizable de captura facial (HU6 y HU8, research R4/R11).
// Muestra video, canvas y guía de encuadre; entrega solo el descriptor al
// componente que decide registrar el rostro o validar el acceso.

import { useCallback, useEffect, useRef, useState } from 'react';
import { FACIAL_MAX_INTENTOS } from '../config/facial.js';
import {
  abrirCamara,
  capturarDescriptor,
  detenerCamara,
  dibujarGuia,
} from '../facerecognition/descriptor.js';

/**
 * @param {Object} props
 * @param {(descriptor: Array<number>) => void|Promise<void>} props.onCaptura
 * @param {string} [props.etiquetaBoton]
 * @param {boolean} [props.deshabilitado]
 * @param {number} [props.maxIntentos]
 */
export default function CapturaFacial({
  onCaptura,
  etiquetaBoton = 'Capturar rostro',
  deshabilitado = false,
  maxIntentos = FACIAL_MAX_INTENTOS,
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [camaraActiva, setCamaraActiva] = useState(false);
  const [capturando, setCapturando] = useState(false);
  const [intentos, setIntentos] = useState(0);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  const detener = useCallback(() => {
    detenerCamara(streamRef.current, videoRef.current);
    streamRef.current = null;
    setCamaraActiva(false);
  }, []);

  useEffect(() => detener, [detener]);

  async function iniciar() {
    setError('');
    setMensaje('');
    setIntentos(0);
    try {
      const stream = await abrirCamara(videoRef.current);
      streamRef.current = stream;
      setCamaraActiva(true);
    } catch (err) {
      setError(err.message);
    }
  }

  async function capturar() {
    if (!camaraActiva || !streamRef.current) {
      setError('Inicie la cámara antes de capturar el rostro.');
      return;
    }

    setError('');
    setMensaje('');
    setCapturando(true);
    try {
      const descriptor = await capturarDescriptor(videoRef.current);
      dibujarGuia(canvasRef.current, videoRef.current);

      if (!descriptor) {
        const siguientes = intentos + 1;
        setIntentos(siguientes);
        if (siguientes >= maxIntentos) {
          setError(
            `No se detectó un rostro. Se alcanzó el máximo de ${maxIntentos} intentos. Detenga la cámara y vuelva a intentar.`
          );
        } else {
          setError(
            `No se detectó un rostro. Intento ${siguientes} de ${maxIntentos}. Acérquese a la cámara e intente de nuevo.`
          );
        }
        return;
      }

      setIntentos(0);
      setMensaje('Rostro capturado correctamente.');
      if (typeof onCaptura === 'function') await onCaptura(descriptor);
    } catch (err) {
      setError(err.message);
    } finally {
      setCapturando(false);
    }
  }

  const agotado = intentos >= maxIntentos;

  return (
    <div className="captura-facial">
      <div className="visor-camera">
        <video ref={videoRef} playsInline muted aria-label="Vista de la cámara" />
        <div className="guia-rostro" aria-hidden="true" />
        <canvas ref={canvasRef} className="lienzo-captura" aria-hidden="true" />
        {!camaraActiva && <p className="textosuave">{mensaje || 'Cámara apagada'}</p>}
      </div>

      <div className="acciones">
        {camaraActiva ? (
          <button type="button" className="secundario" onClick={detener}>
            Detener cámara
          </button>
        ) : (
          <button type="button" className="secundario" onClick={iniciar}>
            Iniciar cámara
          </button>
        )}
        <button
          type="button"
          onClick={capturar}
          disabled={!camaraActiva || capturando || deshabilitado || agotado}
        >
          {capturando ? 'Capturando…' : etiquetaBoton}
        </button>
      </div>

      <p className="textosuave" role="status">
        Intentos: {intentos} de {maxIntentos}
      </p>
      {error && (
        <div className="mensaje-error" role="alert">
          {error}
        </div>
      )}
      {mensaje && camaraActiva && <div className="mensaje-exito">{mensaje}</div>}
    </div>
  );
}
