// Pruebas de la pantalla de reportes por rol y de las exportaciones (US-S4-04).

import { describe, it, expect, afterEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { SesionProvider } from '../context/SesionContext.jsx';
import Reportes from '../pages/Reportes.jsx';
import { simularServidor } from './servidorFalso.js';

function aInputFecha(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function rangoActual() {
  const hoy = new Date();
  return {
    fechaInicio: aInputFecha(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
    fechaFin: aInputFecha(hoy),
  };
}

function autenticar(rol) {
  localStorage.setItem(
    'gymaccess_usuario',
    JSON.stringify({ id: 1, nombre: 'Usuario Prueba', correo: 'prueba@local', rol })
  );
  localStorage.setItem('gymaccess_token', 'token-de-prueba');
}

function pintar(rol) {
  autenticar(rol);
  return render(
    <SesionProvider>
      <Reportes />
    </SesionProvider>
  );
}

function reporteFinanciero(filtros) {
  return {
    fechaInicio: filtros.fechaInicio,
    fechaFin: filtros.fechaFin,
    filtros,
    resumen: { totalRecaudado: 150, totalTransacciones: 2 },
    porMetodoPago: [{ metodoPago: 'efectivo', totalTransacciones: 2, ingresos: 150 }],
    porTipoMembresia: [{ tipoMembresia: 'Mensual', totalTransacciones: 2, ingresos: 150 }],
  };
}

function reporteAccesos(filtros) {
  return {
    fechaInicio: filtros.fechaInicio,
    fechaFin: filtros.fechaFin,
    filtros,
    resumen: { totalAccesos: 4, autorizados: 1, rechazados: 3 },
    porHora: [
      { fecha: filtros.fechaInicio, hora: 9, total: 4, autorizados: 1, rechazados: 3 },
    ],
    porMotivoRechazo: [{ motivo: 'Membresía vencida', total: 3 }],
  };
}

function reporteVencidos(filtros) {
  return {
    fechaInicio: filtros.fechaInicio,
    fechaFin: filtros.fechaFin,
    filtros,
    total: 1,
    clientes: [
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

function rutasAdmin(filtros) {
  const base = new URLSearchParams(filtros).toString();
  return [
    { ruta: '/api/clientes', cuerpo: { clientes: [] } },
    {
      ruta: `/api/reports/financial?${base}`,
      cuerpo: { reporte: reporteFinanciero(filtros) },
    },
    {
      ruta: `/api/reports/access?${base}`,
      cuerpo: { reporte: reporteAccesos(filtros) },
    },
    {
      ruta: `/api/reports/expired-clients?${base}`,
      cuerpo: { reporte: reporteVencidos(filtros) },
    },
  ];
}

function esperarReportes() {
  return screen.findByRole('heading', { name: 'Reporte financiero' });
}

function seccionDe(titulo) {
  return screen.getByRole('heading', { name: titulo }).closest('section');
}

afterEach(() => {
  delete global.fetch;
  vi.restoreAllMocks();
});

describe('Pantalla de reportes', () => {
  it('el administrador genera los tres reportes y aplica los filtros', async () => {
    const filtros = rangoActual();
    const fetchSimulado = simularServidor(rutasAdmin(filtros));
    pintar('administrador');

    fireEvent.click(screen.getByRole('button', { name: 'Generar reportes' }));

    await esperarReportes();
    expect(screen.getByRole('heading', { name: 'Reporte de accesos' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Clientes vencidos' })).toBeInTheDocument();
    expect(screen.getByText('Ana Vencida')).toBeInTheDocument();
    expect(screen.getByText('Membresía vencida')).toBeInTheDocument();

    const rutas = fetchSimulado.mock.calls.map(([ruta]) => ruta);
    expect(rutas).toContain('/api/clientes');
    expect(rutas.some((ruta) => ruta.startsWith('/api/reports/financial?'))).toBe(true);
    expect(rutas.some((ruta) => ruta.startsWith('/api/reports/access?'))).toBe(true);
    expect(rutas.some((ruta) => ruta.startsWith('/api/reports/expired-clients?'))).toBe(true);
  });

  it('el recepcionista solo consulta el reporte de vencidos', async () => {
    const filtros = rangoActual();
    const fetchSimulado = simularServidor([
      {
        ruta: `/api/reports/expired-clients?${new URLSearchParams(filtros).toString()}`,
        cuerpo: { reporte: reporteVencidos(filtros) },
      },
    ]);
    pintar('recepcionista');

    fireEvent.click(screen.getByRole('button', { name: 'Generar reportes' }));

    expect(await screen.findByText('Ana Vencida')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Reporte financiero' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Reporte de accesos' })).not.toBeInTheDocument();

    const rutas = fetchSimulado.mock.calls.map(([ruta]) => ruta);
    expect(rutas).not.toContain('/api/clientes');
    expect(rutas.some((ruta) => ruta.startsWith('/api/reports/financial?'))).toBe(false);
    expect(rutas.some((ruta) => ruta.startsWith('/api/reports/access?'))).toBe(false);
  });

  it('exporta el reporte financiero a CSV y registra la auditoría', async () => {
    const filtros = rangoActual();
    const fetchSimulado = simularServidor([
      ...rutasAdmin(filtros),
      { metodo: 'POST', ruta: '/api/reports/exports', cuerpo: { auditoria: 1 } },
    ]);
    URL.createObjectURL = vi.fn(() => 'blob:financiero');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    pintar('administrador');

    fireEvent.click(screen.getByRole('button', { name: 'Generar reportes' }));
    await esperarReportes();

    const seccion = seccionDe('Reporte financiero');
    fireEvent.click(within(seccion).getByRole('button', { name: 'Exportar CSV' }));

    await waitFor(() => {
      const llamada = fetchSimulado.mock.calls.find(
        ([ruta, opciones]) =>
          ruta === '/api/reports/exports' && (opciones?.method || 'GET') === 'POST'
      );
      expect(llamada).toBeDefined();
      expect(JSON.parse(llamada[1].body)).toMatchObject({
        reporte: 'financiero',
        formato: 'csv',
      });
    });
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(within(seccion).getByRole('button', { name: 'Exportar CSV' })).toBeEnabled();
  });

  it('abre la impresión del navegador para exportar PDF y registra la auditoría', async () => {
    const filtros = rangoActual();
    const fetchSimulado = simularServidor([
      ...rutasAdmin(filtros),
      { metodo: 'POST', ruta: '/api/reports/exports', cuerpo: { auditoria: 1 } },
    ]);
    const imprimir = vi.spyOn(window, 'print').mockImplementation(() => {});
    pintar('administrador');

    fireEvent.click(screen.getByRole('button', { name: 'Generar reportes' }));
    await esperarReportes();

    const seccion = seccionDe('Reporte financiero');
    fireEvent.click(within(seccion).getByRole('button', { name: 'Exportar PDF' }));

    await waitFor(() => {
      expect(imprimir).toHaveBeenCalledTimes(1);
      const llamada = fetchSimulado.mock.calls.find(
        ([ruta, opciones]) =>
          ruta === '/api/reports/exports' && (opciones?.method || 'GET') === 'POST'
      );
      expect(JSON.parse(llamada[1].body)).toMatchObject({
        reporte: 'financiero',
        formato: 'pdf',
      });
    });
  });
});
