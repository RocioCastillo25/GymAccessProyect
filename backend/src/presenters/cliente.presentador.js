// Presentador de clientes: adapta la fila de la tabla `clientes` al formato
// del contrato (contracts/api-rest.md §3): el identificador se expone como `id`.

/**
 * Devuelve el cliente en formato de la API. Las filas con selección de campos
 * limitada (rol entrenador) solo incluyen nombre, apellido y estado (FR-016).
 * @param {Object} cliente - Fila de la tabla clientes.
 * @returns {Object|null}
 */
export function presentarCliente(cliente) {
  if (!cliente) return null;

  const salida = {
    id: cliente.id_cliente,
    nombre: cliente.nombre,
    apellido: cliente.apellido,
  };

  if ('correo' in cliente) {
    salida.correo = cliente.correo;
    salida.telefono = cliente.telefono ?? null;
    salida.direccion = cliente.direccion ?? null;
    salida.fecha_registro = cliente.fecha_registro;
  }

  salida.estado = cliente.estado;
  return salida;
}

/**
 * Devuelve el resumen de cliente permitido en los adeudos (contracts/api-rest.md §6).
 * Excluye teléfono, dirección y fecha de registro.
 * @param {Object} cliente - Fila de `clientes` o del JOIN de adeudos.
 * @returns {{id: number, nombre: string, apellido: string, correo: string}|null}
 */
export function presentarClienteResumen(cliente) {
  if (!cliente) return null;
  return {
    id: cliente.id_cliente,
    nombre: cliente.nombre,
    apellido: cliente.apellido,
    correo: cliente.correo,
  };
}

/**
 * @param {Array} clientes - Filas de la tabla clientes.
 * @returns {Array} Lista en formato de la API.
 */
export function presentarListaClientes(clientes = []) {
  return clientes.map(presentarCliente);
}
