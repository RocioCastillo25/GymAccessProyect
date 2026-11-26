// Utilidades compartidas por las pruebas de componentes de reportes del Sprint 4.
// No es un archivo de prueba: centraliza la simulación de API y del contexto.

import { fireEvent, render, screen } from '@testing-library/react';
import { SesionProvider } from '../context/SesionContext.jsx';
import Reportes from '../pages/Reportes.jsx';

/**
 * Convierte una fecha a `YYYY-MM-DD` para inputs de tipo date.
 * @returns {string}
 */
export function aInputFecha(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/** @returns {{fechaInicio: string, fechaFin: string}} */
export function rangoActual() {
  const hoy = new Date();
  return {
    fechaInicio: aInputFecha(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
    fechaFin: aInputFecha(hoy),
  };
}

export function autenticar(rol) {
  localStorage.setItem(
    'gymaccess_usuario',
    JSON.stringify({ id: 1, nombre: 'Usuario Prueba', correo: 'prueba@local', rol })
  );
  localStorage.setItem('gymaccess_token', 'token-de-prueba');
}

export function pintarReportes(rol) {
  autenticar(rol);
  return render(
    <SesionProvider>
      <Reportes />
    </SesionProvider>
  );
}

export function generarReportes() {
  fireEvent.click(screen.getByRole('button', { name: 'Generar reportes' }));
}

export function seccionDe(titulo) {
  return screen.getByRole('heading', { name: titulo }).closest('section');
}

export function datosFinancieros(filtros, { vacio = false } = {}) {
  const total = vacio ? 0 : 150;
  return {
    fechaInicio: filtros.fechaInicio,
    fechaFin: filtros.fechaFin,
    filtros,
    resumen: { totalRecaudado: total, totalTransacciones: vacio ? 0 : 2 },
    porMetodoPago: vacio
      ? []
      : [{ metodoPago: 'tarjeta', totalTransacciones: 2, ingresos: total }],
    porTipoMembresia: vacio
      ? []
      : [{ tipoMembresia: 'Mensual', totalTransacciones: 2, ingresos: total }],
  };
}

export function datosAccesos(filtros, { vacio = false } = {}) {
  return {
    fechaInicio: filtros.fechaInicio,
    fechaFin: filtros.fechaFin,
    filtros,
    resumen: {
      totalAccesos: vacio ? 0 : 4,
      autorizados: vacio ? 0 : 1,
      rechazados: vacio ? 0 : 3,
    },
    porHora: vacio
      ? []
      : [{ fecha: filtros.fechaInicio, hora: 9, total: 4, autorizados: 1, rechazados: 3 }],
    porMotivoRechazo: vacio ? [] : [{ motivo: 'La membresía está vencida.', total: 3 }],
  };
}

export function datosVencidos(filtros, { vacio = false } = {}) {
  return {
    fechaInicio: filtros.fechaInicio,
    fechaFin: filtros.fechaFin,
    filtros,
    total: vacio ? 0 : 1,
    clientes: vacio
      ? []
      : [
          {
            idCliente: 7,
            cliente: 'Ana Vencida',
            correo: 'ana@local',
            telefono: '5555-0000',
            tipoMembresia: 'Mensual',
            fechaFin: filtros.fechaFin,
            estado: 'vencida',
          },
        ],
  };
}

/**
 * Simula las respuestas del administrador para los tres reportes.
 * @param {Object} filtros - `{ fechaInicio, fechaFin }`.
 * @param {Object} [opciones] - Filtros opcionales y banderas de estado vacío.
 */
export function rutasAdministrador(filtros, opciones = {}) {
  const {
    metodoPago = '',
    resultado = '',
    idCliente = '',
    buscar = '',
    financieroVacio = false,
    accesosVacios = false,
    vencidosVacios = false,
  } = opciones;

  const consultaBase = new URLSearchParams(filtros);
  const consultaFinanciero = new URLSearchParams(consultaBase);
  if (metodoPago) consultaFinanciero.set('metodoPago', metodoPago);

  const consultaAccesos = new URLSearchParams(consultaBase);
  if (idCliente) consultaAccesos.set('idCliente', idCliente);
  if (resultado) consultaAccesos.set('resultado', resultado);

  const consultaVencidos = new URLSearchParams(consultaBase);
  if (buscar) consultaVencidos.set('buscar', buscar);

  return [
    { ruta: '/api/clientes', cuerpo: { clientes: [] } },
    {
      ruta: `/api/reports/financial?${consultaFinanciero.toString()}`,
      cuerpo: {
        reporte: datosFinancieros(
          { ...filtros, metodoPago },
          { vacio: financieroVacio }
        ),
      },
    },
    {
      ruta: `/api/reports/access?${consultaAccesos.toString()}`,
      cuerpo: {
        reporte: datosAccesos(
          { ...filtros, idCliente, resultado },
          { vacio: accesosVacios }
        ),
      },
    },
    {
      ruta: `/api/reports/expired-clients?${consultaVencidos.toString()}`,
      cuerpo: {
        reporte: datosVencidos({ ...filtros, buscar }, { vacio: vencidosVacios }),
      },
    },
  ];
}

/** @returns {string} Consulta de vencidos para un recepcionista. */
export function rutaVencidos(filtros, buscar = '') {
  const parametros = new URLSearchParams(filtros);
  if (buscar) parametros.set('buscar', buscar);
  return `/api/reports/expired-clients?${parametros.toString()}`;
}
