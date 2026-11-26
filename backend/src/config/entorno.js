// Carga y validación de variables de entorno (FR-025, FR-026, investigación R6 y R10).
// Se carga primero backend/.env y, si no existe, .env de la raíz del repositorio.

import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const raiz = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const archivoBackend = path.join(raiz, 'backend', '.env');
const archivoRaiz = path.join(raiz, '.env');

if (existsSync(archivoBackend)) {
  dotenv.config({ path: archivoBackend });
} else if (existsSync(archivoRaiz)) {
  dotenv.config({ path: archivoRaiz });
}

const obligatorias = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];

/**
 * Devuelve las variables obligatorias que faltan o están vacías.
 * En el entorno de pruebas no se exigen para permitir pruebas aisladas.
 * @param {Object} [entorno] - Variables a validar (por defecto `process.env`).
 * @returns {Array<string>}
 */
export function variablesObligatoriasFaltantes(entorno = process.env) {
  if (entorno.NODE_ENV === 'test') return [];
  return obligatorias.filter(
    (variable) => !entorno[variable] || String(entorno[variable]).trim() === ''
  );
}

/**
 * Normaliza la lista de orígenes permitidos para CORS.
 * @param {string} [valor] - Orígenes separados por comas.
 * @returns {Array<string>}
 */
export function origenesCors(valor = '') {
  return String(valor)
    .split(',')
    .map((origen) => origen.trim())
    .filter(Boolean);
}

const faltantes = variablesObligatoriasFaltantes(process.env);

if (faltantes.length > 0) {
  // En desarrollo y producción ninguna credencial puede faltar ni quedar vacía.
  throw new Error(
    `Faltan variables de entorno: ${faltantes.join(', ')}. Copie .env.example como .env y complételo.`
  );
}

export const config = {
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'gymapp',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'gymaccess',
  },
  jwt: {
    secreto: process.env.JWT_SECRET || 'secreto_de_pruebas',
    expiracion: process.env.JWT_EXPIRES_IN || '60m',
  },
  // Reconocimiento facial: umbral de coincidencia y máximo de intentos (research R4).
  facial: {
    umbral: Number(process.env.FACIAL_UMBRAL || 0.6),
    maxIntentos: Number(process.env.FACIAL_MAX_INTENTOS || 3),
  },
  // Origen(es) permitidos para CORS; vacío mantiene el comportamiento abierto de desarrollo.
  corsOrigen: origenesCors(process.env.CORS_ORIGIN),
  puerto: Number(process.env.PORT || 3000),
  entorno: process.env.NODE_ENV || 'development',
};

export default config;
