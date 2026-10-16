// Códigos de error y constructores de errores nuevos del Sprint 2
// (contracts/formato-errores.md). Mantiene el mismo cuerpo `{ mensaje, codigo }`.

import { ErrorAplicacion } from './errores.js';

export const CODIGOS = {
  VALIDACION: 'VALIDACION',
  DESCRIPTOR_INVALIDO: 'DESCRIPTOR_INVALIDO',
  SIN_MEMBRESIA: 'SIN_MEMBRESIA',
  ROSTRO_YA_REGISTRADO: 'ROSTRO_YA_REGISTRADO',
  DUPLICADO: 'DUPLICADO',
  AUTORIZACION: 'AUTORIZACION',
  NO_ENCONTRADO: 'NO_ENCONTRADO',
  ENTRENADOR_INACTIVO: 'ENTRENADOR_INACTIVO',
  CLIENTE_INACTIVO: 'CLIENTE_INACTIVO',
  ENTRENADOR_NO_ASIGNADO: 'ENTRENADOR_NO_ASIGNADO',
  SIN_RUTINA: 'SIN_RUTINA',
  SIN_ASIGNACION: 'SIN_ASIGNACION',
};

/** Descriptor facial ausente, no numérico o con longitud distinta de 128 (FR-029). */
export const errorDescriptorInvalido = (
  mensaje = 'No se recibió una captura facial válida.'
) => new ErrorAplicacion(400, mensaje, CODIGOS.DESCRIPTOR_INVALIDO);

/** El cliente no tiene una membresía para renovar o validar (FR-008, FR-023). */
export const errorSinMembresia = (
  mensaje = 'El cliente no tiene una membresía registrada.'
) => new ErrorAplicacion(404, mensaje, CODIGOS.SIN_MEMBRESIA);

/** El cliente ya tiene información facial registrada (HU6, FR-017). */
export const errorRostroYaRegistrado = (
  mensaje = 'El cliente ya tiene información facial registrada.'
) => new ErrorAplicacion(409, mensaje, CODIGOS.ROSTRO_YA_REGISTRADO);

/** El entrenador no está activo y no puede recibir asignaciones (FR-007). */
export const errorEntrenadorInactivo = (
  mensaje = 'El entrenador no está activo.'
) => new ErrorAplicacion(409, mensaje, CODIGOS.ENTRENADOR_INACTIVO);

/** El cliente no está activo y no puede recibir un entrenador (FR-007). */
export const errorClienteInactivo = (
  mensaje = 'El cliente no está activo.'
) => new ErrorAplicacion(409, mensaje, CODIGOS.CLIENTE_INACTIVO);

/** El entrenador intenta gestionar un cliente que no está a su cargo (FR-012). */
export const errorEntrenadorNoAsignado = (
  mensaje = 'El cliente no está asignado a su carga.'
) => new ErrorAplicacion(403, mensaje, CODIGOS.ENTRENADOR_NO_ASIGNADO);

/** El cliente no tiene una rutina vigente (FR-017). */
export const errorSinRutina = (
  mensaje = 'El cliente no tiene una rutina asignada.'
) => new ErrorAplicacion(404, mensaje, CODIGOS.SIN_RUTINA);

/** El cliente no tiene un entrenador principal activo (FR-006). */
export const errorSinAsignacion = (
  mensaje = 'El cliente no tiene un entrenador asignado.'
) => new ErrorAplicacion(404, mensaje, CODIGOS.SIN_ASIGNACION);

export default CODIGOS;
