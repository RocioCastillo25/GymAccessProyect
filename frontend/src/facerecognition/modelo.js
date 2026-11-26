// Carga única de los modelos faciales servidos desde /models (R13).
// La librería se importa bajo demanda para no penalizar el arranque de la aplicación.

let promesaModelos = null;
let faceapi = null;

/**
 * Carga los modelos una sola vez y devuelve la librería lista para usar.
 * @returns {Promise<Object>} Librería `@vladmandic/face-api`.
 */
export function cargarModelos() {
  if (!promesaModelos) {
    promesaModelos = import('@vladmandic/face-api')
      .then(async (modulo) => {
        faceapi = modulo;
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
          faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
          faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        ]);
        return faceapi;
      })
      .catch((error) => {
        // Se descarta la promesa fallida para permitir un nuevo intento.
        promesaModelos = null;
        faceapi = null;
        throw new Error('No se pudieron cargar los modelos faciales. Intente de nuevo.');
      });
  }
  return promesaModelos;
}

/**
 * Devuelve la librería ya cargada.
 * @returns {Object}
 */
export function obtenerFaceApi() {
  if (!faceapi) {
    throw new Error('Los modelos faciales todavía no están listos.');
  }
  return faceapi;
}
