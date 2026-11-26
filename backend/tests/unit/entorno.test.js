// Pruebas de validación de variables de entorno y configuración de CORS (T047).

import { describe, it, expect } from 'vitest';
import {
  config,
  origenesCors,
  variablesObligatoriasFaltantes,
} from '../../src/config/entorno.js';

const COMPLETO = {
  NODE_ENV: 'production',
  DB_HOST: 'localhost',
  DB_PORT: '3306',
  DB_USER: 'gymapp',
  DB_PASSWORD: 'secreto',
  DB_NAME: 'gymaccess',
  JWT_SECRET: 'clave',
};

describe('Variables de entorno', () => {
  it('no exige variables en NODE_ENV=test', () => {
    expect(variablesObligatoriasFaltantes({ NODE_ENV: 'test' })).toEqual([]);
  });

  it('enumera las variables faltantes o vacías', () => {
    expect(
      variablesObligatoriasFaltantes({
        NODE_ENV: 'production',
        DB_HOST: 'localhost',
        DB_PORT: ' ',
        DB_USER: 'gymapp',
        DB_PASSWORD: '',
        DB_NAME: 'gymaccess',
      })
    ).toEqual(['DB_PORT', 'DB_PASSWORD', 'JWT_SECRET']);
  });

  it('acepta una configuración completa', () => {
    expect(variablesObligatoriasFaltantes(COMPLETO)).toEqual([]);
  });
});

describe('Configuración de CORS', () => {
  it('normaliza orígenes separados por comas y descarta vacíos', () => {
    expect(origenesCors('http://localhost:5173, https://app.local ,,')).toEqual([
      'http://localhost:5173',
      'https://app.local',
    ]);
    expect(origenesCors('')).toEqual([]);
    expect(origenesCors(undefined)).toEqual([]);
  });

  it('expone CORS como arreglo en la configuración cargada', () => {
    expect(Array.isArray(config.corsOrigen)).toBe(true);
  });
});
