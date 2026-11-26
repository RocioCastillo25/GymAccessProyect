// T032 - Pruebas de exportación CSV/PDF de reportes (US4).

import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { simularServidor } from './servidorFalso.js';
import {
  generarReportes,
  pintarReportes,
  rangoActual,
  rutasAdministrador,
  seccionDe,
} from './helpersReportes.jsx';

const filtros = rangoActual();

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:reporte');
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

afterEach(() => {
  delete global.fetch;
  delete URL.createObjectURL;
  delete URL.revokeObjectURL;
  vi.restoreAllMocks();
});

function auditCall(servidor) {
  return servidor.mock.calls.find(
    ([ruta, opciones]) => ruta === '/api/reports/exports' && opciones?.method === 'POST'
  );
}

describe('Exportación de reportes', () => {
  it('exporta con datos y registra la auditoría con los mismos filtros', async () => {
    const servidor = simularServidor([
      ...rutasAdministrador(filtros),
      { metodo: 'POST', ruta: '/api/reports/exports', cuerpo: { auditoria: 1 } },
    ]);
    pintarReportes('administrador');

    generarReportes();
    expect(await screen.findByRole('heading', { name: 'Reporte financiero' })).toBeInTheDocument();

    const seccion = seccionDe('Reporte financiero');
    fireEvent.click(within(seccion).getByRole('button', { name: 'Exportar CSV' }));

    await waitFor(() => expect(auditCall(servidor)).toBeDefined());
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    const cuerpo = JSON.parse(auditCall(servidor)[1].body);
    expect(cuerpo).toMatchObject({ reporte: 'financiero', formato: 'csv' });
    expect(cuerpo.filtros).toMatchObject(filtros);
    expect(JSON.stringify(cuerpo)).not.toContain('descriptorFacial');
  });

  it('permite exportar un periodo vacío con sus filtros', async () => {
    const servidor = simularServidor([
      ...rutasAdministrador(filtros, { financieroVacio: true }),
      { metodo: 'POST', ruta: '/api/reports/exports', cuerpo: { auditoria: 1 } },
    ]);
    pintarReportes('administrador');

    generarReportes();
    expect(await screen.findByText('No hay registros para este periodo.')).toBeInTheDocument();

    const seccion = seccionDe('Reporte financiero');
    fireEvent.click(within(seccion).getByRole('button', { name: 'Exportar CSV' }));

    await waitFor(() => expect(auditCall(servidor)).toBeDefined());
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(JSON.parse(auditCall(servidor)[1].body).filtros).toMatchObject(filtros);
  });

  it('no duplica la descarga al presionar dos veces el botón', async () => {
    const servidor = simularServidor([
      ...rutasAdministrador(filtros),
      { metodo: 'POST', ruta: '/api/reports/exports', cuerpo: { auditoria: 1 } },
    ]);
    pintarReportes('administrador');

    generarReportes();
    expect(await screen.findByRole('heading', { name: 'Reporte de accesos' })).toBeInTheDocument();

    const boton = within(seccionDe('Reporte de accesos')).getByRole('button', {
      name: 'Exportar CSV',
    });
    fireEvent.click(boton);
    fireEvent.click(boton);

    await waitFor(() => expect(auditCall(servidor)).toBeDefined());
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    const auditorias = servidor.mock.calls.filter(
      ([ruta, opciones]) => ruta === '/api/reports/exports' && opciones?.method === 'POST'
    );
    expect(auditorias).toHaveLength(1);
  });
});
