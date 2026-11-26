// Comparación de descriptores faciales (HU7, FR-018, FR-019, R4/R14).
// Se usa distancia euclídea sobre vectores de 128 dimensiones; la decisión
// final aplica el umbral configurado en el backend.

/**
 * Normaliza el valor almacenado en MySQL a un arreglo numérico.
 * @param {unknown} valor
 * @returns {Array<number>|null}
 */
function normalizarDescriptor(valor) {
  if (Array.isArray(valor)) return valor;
  if (typeof valor === 'string') {
    try {
      const analizado = JSON.parse(valor);
      return Array.isArray(analizado) ? analizado : null;
    } catch {
      return null;
    }
  }
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(valor)) {
    try {
      const analizado = JSON.parse(valor.toString('utf8'));
      return Array.isArray(analizado) ? analizado : null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Calcula la distancia euclídea entre dos descriptores.
 * @param {Array<number>} a
 * @param {Array<number>} b
 * @returns {number} `Infinity` si los vectores no son comparables.
 */
export function distanciaEuclidea(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
    return Infinity;
  }

  let suma = 0;
  for (let i = 0; i < a.length; i += 1) {
    if (!Number.isFinite(a[i]) || !Number.isFinite(b[i])) return Infinity;
    const diferencia = a[i] - b[i];
    suma += diferencia * diferencia;
  }
  return Math.sqrt(suma);
}

/**
 * Devuelve el mejor candidato dentro del umbral, o `null` si no hay coincidencia.
 * @param {Array<number>} descriptor
 * @param {Array<Object>} candidatos - `{ idCliente, descriptorFacial }`.
 * @param {number} umbral
 * @returns {{idCliente: number, distancia: number}|null}
 */
export function mejorCoincidencia(descriptor, candidatos = [], umbral = 0.6) {
  let mejor = null;

  for (const candidato of candidatos) {
    const almacenado = normalizarDescriptor(
      candidato?.descriptorFacial ?? candidato?.descriptor ?? candidato
    );
    const distancia = distanciaEuclidea(descriptor, almacenado);
    if (Number.isFinite(distancia) && (!mejor || distancia < mejor.distancia)) {
      mejor = { idCliente: candidato.idCliente, distancia };
    }
  }

  return mejor && mejor.distancia <= umbral ? mejor : null;
}
