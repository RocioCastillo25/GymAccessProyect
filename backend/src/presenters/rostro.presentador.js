// Presentador de rostros: adapta la fila de `rostros` al contrato
// (contracts/api-rest.md §4) sin incluir nunca el descriptor facial (FR-020).

/**
 * @param {Object} rostro - Fila de la tabla rostros.
 * @returns {Object|null}
 */
export function presentarRostro(rostro) {
  if (!rostro) return null;
  return {
    id: rostro.id_rostro,
    idCliente: rostro.id_cliente,
    fechaRegistro:
      rostro.fecha_registro instanceof Date
        ? rostro.fecha_registro.toISOString()
        : rostro.fecha_registro,
    estado: rostro.estado,
  };
}
