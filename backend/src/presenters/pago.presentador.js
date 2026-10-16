// Presentador de pagos: adapta la fila de `pagos` al formato del contrato
// (contracts/api-rest.md §3) con camelCase.

/**
 * @param {Object} pago - Fila de la tabla pagos.
 * @returns {Object|null}
 */
export function presentarPago(pago) {
  if (!pago) return null;
  return {
    id: pago.id_pago,
    idCliente: pago.id_cliente,
    idMembresia: pago.id_membresia ?? null,
    monto: Number(pago.monto),
    fechaPago:
      pago.fecha_pago instanceof Date ? pago.fecha_pago.toISOString() : pago.fecha_pago,
    metodoPago: pago.metodo_pago,
    estado: pago.estado,
  };
}

/**
 * @param {Array} pagos - Filas de la tabla pagos.
 * @returns {Array}
 */
export function presentarListaPagos(pagos = []) {
  return pagos.map(presentarPago);
}
