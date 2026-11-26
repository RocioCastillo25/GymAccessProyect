// Captura facial en el navegador: abre la cámara, toma un fotograma y
// devuelve únicamente el descriptor de 128 números (R2, R11, FR-020).
// La imagen nunca se persiste ni se envía al backend.

import { cargarModelos, obtenerFaceApi } from './modelo.js';

/**
 * Abre la cámara frontal y la asocia al elemento de video.
 * @param {HTMLVideoElement} video
 * @returns {Promise<MediaStream>}
 */
export async function abrirCamara(video) {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('Este navegador no permite acceder a la cámara.');
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
    if (video) {
      video.srcObject = stream;
      await video.play();
    }
    return stream;
  } catch {
    throw new Error('No se pudo acceder a la cámara. Verifique los permisos del navegador.');
  }
}

/**
 * Detiene las pistas de la cámara y libera el elemento de video.
 * @param {MediaStream|null} stream
 * @param {HTMLVideoElement|null} video
 */
export function detenerCamara(stream, video) {
  stream?.getTracks().forEach((pista) => pista.stop());
  if (video) video.srcObject = null;
}

/**
 * Dibuja el fotograma actual en el canvas solo como guía visual local.
 * @param {HTMLCanvasElement|null} canvas
 * @param {HTMLVideoElement|null} video
 */
export function dibujarGuia(canvas, video) {
  if (!canvas || !video || !video.videoWidth || !video.videoHeight) return;
  if (typeof canvas.getContext !== 'function') return;

  const contexto = canvas.getContext('2d');
  if (!contexto) return;
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  contexto.drawImage(video, 0, 0, canvas.width, canvas.height);
}

/**
 * Detecta un rostro y devuelve su descriptor de 128 valores, o `null`.
 * @param {HTMLVideoElement} video
 * @returns {Promise<Array<number>|null>}
 */
export async function capturarDescriptor(video) {
  await cargarModelos();
  const faceapi = obtenerFaceApi();
  const deteccion = await faceapi
    .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({ inputSize: 320 }))
    .withFaceLandmarks()
    .withFaceDescriptor();

  return deteccion ? Array.from(deteccion.descriptor) : null;
}
