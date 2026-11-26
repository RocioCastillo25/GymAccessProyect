// Reportes financieros, de accesos y de clientes vencidos del Sprint 4
// (US-S4-01, US-S4-02, US-S4-04 y US-S4-07).

import { useCallback, useEffect, useRef, useState } from 'react';
import { pedir } from '../services/api.js';
import { useSesion } from '../context/SesionContext.jsx';
import {
  descargarCsv,
  filasAccesosCsv,
  filasFinancieroCsv,
  filasVencidosCsv,
  formatearFiltrosActivos,
  generarNombreArchivo,
} from '../utils/reportes.js';

function aInputFecha(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

function rangoMesActual() {
  const hoy = new Date();
  return {
    fechaInicio: aInputFecha(new Date(hoy.getFullYear(), hoy.getMonth(), 1)),
    fechaFin: aInputFecha(hoy),
  };
}

function formatearMoneda(valor) {
  return Number(valor ?? 0).toLocaleString('es-GT', {
    style: 'currency',
    currency: 'GTQ',
    minimumFractionDigits: 2,
  });
}

function FiltrosActivos({ filtros }) {
  const etiquetas = formatearFiltrosActivos(filtros);
  if (etiquetas.length === 0) return null;
  return (
    <p className="filtros-activos no-imprimir">
      {etiquetas.map((etiqueta) => (
        <span className="chip-filtro" key={etiqueta}>
          {etiqueta}
        </span>
      ))}
    </p>
  );
}

function CabeceraImpresion({ titulo, filtros }) {
  return (
    <div className="solo-impresion cabecera-impresion">
      <strong>GymAccess</strong>
      <span>{titulo}</span>
      <span>{formatearFiltrosActivos(filtros).join(' · ')}</span>
    </div>
  );
}

export default function Reportes() {
  const { rol } = useSesion();
  const inicial = rangoMesActual();
  const [fechaInicio, setFechaInicio] = useState(inicial.fechaInicio);
  const [fechaFin, setFechaFin] = useState(inicial.fechaFin);
  const [metodoPago, setMetodoPago] = useState('');
  const [resultado, setResultado] = useState('');
  const [idCliente, setIdCliente] = useState('');
  const [buscar, setBuscar] = useState('');
  const [clientes, setClientes] = useState([]);
  const [financiero, setFinanciero] = useState(null);
  const [accesos, setAccesos] = useState(null);
  const [vencidos, setVencidos] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);
  const [exportando, setExportando] = useState('');
  const exportandoRef = useRef(false);
  const reporteImprimibleRef = useRef(null);

  const esAdministrador = rol === 'administrador';
  const puedeVerReportes = esAdministrador || rol === 'recepcionista';

  const cargarClientes = useCallback(async () => {
    if (!esAdministrador) return;
    try {
      const respuesta = await pedir('/api/clientes');
      setClientes(respuesta.clientes);
    } catch {
      setClientes([]);
    }
  }, [esAdministrador]);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  function filtrosVencidos() {
    const filtros = { fechaInicio, fechaFin };
    if (buscar.trim()) filtros.buscar = buscar.trim();
    return filtros;
  }

  async function generar(evento) {
    evento.preventDefault();
    setError('');
    setCargando(true);

    try {
      const base = new URLSearchParams({ fechaInicio, fechaFin });

      if (esAdministrador) {
        const financieroParams = new URLSearchParams(base);
        if (metodoPago) financieroParams.set('metodoPago', metodoPago);

        const accesosParams = new URLSearchParams(base);
        if (idCliente) accesosParams.set('idCliente', idCliente);
        if (resultado) accesosParams.set('resultado', resultado);

        const [respuestaFinanciero, respuestaAccesos] = await Promise.all([
          pedir(`/api/reports/financial?${financieroParams.toString()}`),
          pedir(`/api/reports/access?${accesosParams.toString()}`),
        ]);
        setFinanciero(respuestaFinanciero.reporte);
        setAccesos(respuestaAccesos.reporte);
      } else {
        setFinanciero(null);
        setAccesos(null);
      }

      const paramsVencidos = new URLSearchParams(filtrosVencidos());
      const respuestaVencidos = await pedir(
        `/api/reports/expired-clients?${paramsVencidos.toString()}`
      );
      setVencidos(respuestaVencidos.reporte);
    } catch (err) {
      setError(err.message);
      setFinanciero(null);
      setAccesos(null);
      setVencidos(null);
    } finally {
      setCargando(false);
    }
  }

  async function auditarExportacion(reporte, formato, filtros) {
    try {
      await pedir('/api/reports/exports', {
        method: 'POST',
        body: JSON.stringify({ reporte, formato, filtros }),
      });
    } catch {
      // La descarga no debe fallar si la auditoría no está disponible.
    }
  }

  function iniciarExportacion(clave) {
    if (exportandoRef.current) return false;
    exportandoRef.current = true;
    setExportando(clave);
    return true;
  }

  function terminarExportacion() {
    exportandoRef.current = false;
    setExportando('');
  }

  async function exportarFinancieroCsv() {
    if (!financiero || !iniciarExportacion('financiero-csv')) return;
    try {
      const nombre = generarNombreArchivo('financiero', financiero.filtros, 'csv');
      descargarCsv(nombre, filasFinancieroCsv(financiero));
      await auditarExportacion('financiero', 'csv', financiero.filtros);
    } finally {
      terminarExportacion();
    }
  }

  async function exportarAccesosCsv() {
    if (!accesos || !iniciarExportacion('accesos-csv')) return;
    try {
      const nombre = generarNombreArchivo('accesos', accesos.filtros, 'csv');
      descargarCsv(nombre, filasAccesosCsv(accesos));
      await auditarExportacion('accesos', 'csv', accesos.filtros);
    } finally {
      terminarExportacion();
    }
  }

  async function exportarVencidosCsv() {
    if (!vencidos || !iniciarExportacion('vencidos-csv')) return;
    try {
      const nombre = generarNombreArchivo('vencidos', vencidos.filtros, 'csv');
      descargarCsv(nombre, filasVencidosCsv(vencidos));
      await auditarExportacion('vencidos', 'csv', vencidos.filtros);
    } finally {
      terminarExportacion();
    }
  }

  async function exportarPdf(reporte, datos) {
    if (!datos || !iniciarExportacion(`${reporte}-pdf`)) return;
    try {
      const contenedor = reporteImprimibleRef.current;
      if (contenedor) contenedor.dataset.reportePdf = reporte;
      window.print();
      if (contenedor) delete contenedor.dataset.reportePdf;
      await auditarExportacion(reporte, 'pdf', datos.filtros);
    } finally {
      terminarExportacion();
    }
  }

  return (
    <>
      <section className="tarjeta formulario no-imprimir">
        <h2>Reportes y analítica</h2>
        <p className="textosuave">
          {esAdministrador
            ? 'Consulte ingresos, concurrencia y clientes vencidos por rango de fechas. Los reportes financieros y de accesos son exclusivos del administrador.'
            : 'Consulte los clientes con membresía vencida o sin membresía activa. Los reportes financieros y de accesos son exclusivos del administrador.'}
        </p>

        {error && <div className="mensaje-error">{error}</div>}

        <form onSubmit={generar}>
          <div className="campo">
            <label htmlFor="reporte-inicio">Fecha de inicio *</label>
            <input
              id="reporte-inicio"
              type="date"
              value={fechaInicio}
              onChange={(evento) => setFechaInicio(evento.target.value)}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="reporte-fin">Fecha de fin *</label>
            <input
              id="reporte-fin"
              type="date"
              value={fechaFin}
              onChange={(evento) => setFechaFin(evento.target.value)}
              required
            />
          </div>

          {esAdministrador && (
            <>
              <div className="campo">
                <label htmlFor="reporte-metodo">Método de pago (opcional)</label>
                <select
                  id="reporte-metodo"
                  value={metodoPago}
                  onChange={(evento) => setMetodoPago(evento.target.value)}
                >
                  <option value="">Todos los métodos</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                  <option value="transferencia">Transferencia</option>
                </select>
              </div>

              <div className="campo">
                <label htmlFor="reporte-resultado">Resultado de acceso (opcional)</label>
                <select
                  id="reporte-resultado"
                  value={resultado}
                  onChange={(evento) => setResultado(evento.target.value)}
                >
                  <option value="">Todos los resultados</option>
                  <option value="autorizado">Autorizado</option>
                  <option value="rechazado">Rechazado</option>
                </select>
              </div>

              <div className="campo">
                <label htmlFor="reporte-cliente">Cliente (opcional, accesos)</label>
                <select
                  id="reporte-cliente"
                  value={idCliente}
                  onChange={(evento) => setIdCliente(evento.target.value)}
                >
                  <option value="">Todos los clientes</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre} {cliente.apellido}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="campo">
            <label htmlFor="reporte-buscar">Buscar cliente vencido (opcional)</label>
            <input
              id="reporte-buscar"
              type="search"
              value={buscar}
              maxLength={100}
              onChange={(evento) => setBuscar(evento.target.value)}
              placeholder="Nombre, correo o identificador"
            />
          </div>

          <div className="acciones">
            <button
              type="submit"
              disabled={cargando || !puedeVerReportes || !fechaInicio || !fechaFin}
            >
              {cargando ? 'Generando...' : 'Generar reportes'}
            </button>
          </div>
        </form>
      </section>

      <div className="reporte-imprimible" ref={reporteImprimibleRef}>
        {financiero && (
          <section className="tarjeta reporte-financiero">
            <CabeceraImpresion titulo="Reporte financiero" filtros={financiero.filtros} />
            <div className="cabecera-reporte">
              <div>
                <h2>Reporte financiero</h2>
                <p className="textosuave">
                  Del {financiero.fechaInicio} al {financiero.fechaFin}
                </p>
                <FiltrosActivos filtros={financiero.filtros} />
              </div>
              <div className="acciones no-imprimir">
                <button
                  type="button"
                  className="secundario"
                  onClick={exportarFinancieroCsv}
                  disabled={Boolean(exportando)}
                >
                  {exportando === 'financiero-csv' ? 'Exportando...' : 'Exportar CSV'}
                </button>
                <button
                  type="button"
                  className="secundario"
                  onClick={() => exportarPdf('financiero', financiero)}
                  disabled={Boolean(exportando)}
                >
                  Exportar PDF
                </button>
              </div>
            </div>

            <div className="rejilla-kpi">
              <article className="kpi">
                <span className="kpi-etiqueta">Total recaudado</span>
                <span className="kpi-valor">
                  {formatearMoneda(financiero.resumen.totalRecaudado)}
                </span>
              </article>
              <article className="kpi">
                <span className="kpi-etiqueta">Transacciones</span>
                <span className="kpi-valor">{financiero.resumen.totalTransacciones}</span>
              </article>
            </div>

            {financiero.resumen.totalTransacciones === 0 ? (
              <p className="textosuave">No hay registros para este periodo.</p>
            ) : (
              <>
                <h3>Ingresos por método de pago</h3>
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Método</th>
                      <th>Transacciones</th>
                      <th>Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financiero.porMetodoPago.map((fila) => (
                      <tr key={fila.metodoPago}>
                        <td>{fila.metodoPago}</td>
                        <td>{fila.totalTransacciones}</td>
                        <td>{formatearMoneda(fila.ingresos)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <h3>Ingresos por tipo de membresía</h3>
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Transacciones</th>
                      <th>Ingresos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financiero.porTipoMembresia.map((fila) => (
                      <tr key={fila.tipoMembresia}>
                        <td>{fila.tipoMembresia}</td>
                        <td>{fila.totalTransacciones}</td>
                        <td>{formatearMoneda(fila.ingresos)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </section>
        )}

        {accesos && (
          <section className="tarjeta reporte-accesos">
            <CabeceraImpresion titulo="Reporte de accesos" filtros={accesos.filtros} />
            <div className="cabecera-reporte">
              <div>
                <h2>Reporte de accesos</h2>
                <p className="textosuave">
                  Del {accesos.fechaInicio} al {accesos.fechaFin}
                </p>
                <FiltrosActivos filtros={accesos.filtros} />
              </div>
              <div className="acciones no-imprimir">
                <button
                  type="button"
                  className="secundario"
                  onClick={exportarAccesosCsv}
                  disabled={Boolean(exportando)}
                >
                  {exportando === 'accesos-csv' ? 'Exportando...' : 'Exportar CSV'}
                </button>
                <button
                  type="button"
                  className="secundario"
                  onClick={() => exportarPdf('accesos', accesos)}
                  disabled={Boolean(exportando)}
                >
                  Exportar PDF
                </button>
              </div>
            </div>

            <div className="rejilla-kpi">
              <article className="kpi">
                <span className="kpi-etiqueta">Total accesos</span>
                <span className="kpi-valor">{accesos.resumen.totalAccesos}</span>
              </article>
              <article className="kpi">
                <span className="kpi-etiqueta">Autorizados</span>
                <span className="kpi-valor">{accesos.resumen.autorizados}</span>
              </article>
              <article className="kpi">
                <span className="kpi-etiqueta">Rechazados</span>
                <span className="kpi-valor">{accesos.resumen.rechazados}</span>
              </article>
            </div>

            {accesos.resumen.totalAccesos === 0 ? (
              <p className="textosuave">No hay registros para este periodo.</p>
            ) : (
              <>
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Hora</th>
                      <th>Total</th>
                      <th>Autorizados</th>
                      <th>Rechazados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {accesos.porHora.map((fila) => (
                      <tr key={`${fila.fecha}-${fila.hora}`}>
                        <td>{fila.fecha}</td>
                        <td>{String(fila.hora).padStart(2, '0')}:00</td>
                        <td>{fila.total}</td>
                        <td>{fila.autorizados}</td>
                        <td>{fila.rechazados}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {accesos.porMotivoRechazo.length > 0 && (
                  <>
                    <h3>Motivos de rechazo</h3>
                    <table className="tabla">
                      <thead>
                        <tr>
                          <th>Motivo</th>
                          <th>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accesos.porMotivoRechazo.map((fila) => (
                          <tr key={fila.motivo}>
                            <td>{fila.motivo}</td>
                            <td>{fila.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </>
                )}
              </>
            )}
          </section>
        )}

        {vencidos && puedeVerReportes && (
          <section className="tarjeta reporte-vencidos">
            <CabeceraImpresion titulo="Reporte de clientes vencidos" filtros={vencidos.filtros} />
            <div className="cabecera-reporte">
              <div>
                <h2>Clientes vencidos</h2>
                <p className="textosuave">
                  Clientes con membresía vencida o sin membresía activa. No se calculan adeudos.
                </p>
                <FiltrosActivos filtros={vencidos.filtros} />
              </div>
              <div className="acciones no-imprimir">
                <button
                  type="button"
                  className="secundario"
                  onClick={exportarVencidosCsv}
                  disabled={Boolean(exportando)}
                >
                  {exportando === 'vencidos-csv' ? 'Exportando...' : 'Exportar CSV'}
                </button>
                <button
                  type="button"
                  className="secundario"
                  onClick={() => exportarPdf('vencidos', vencidos)}
                  disabled={Boolean(exportando)}
                >
                  Exportar PDF
                </button>
              </div>
            </div>

            {vencidos.total === 0 ? (
              <p className="textosuave">No hay clientes vencidos para este periodo.</p>
            ) : (
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Correo</th>
                    <th>Teléfono</th>
                    <th>Tipo de membresía</th>
                    <th>Fecha de fin</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {vencidos.clientes.map((cliente) => (
                    <tr key={cliente.idCliente}>
                      <td>{cliente.cliente}</td>
                      <td>{cliente.correo}</td>
                      <td>{cliente.telefono || 'Sin teléfono'}</td>
                      <td>{cliente.tipoMembresia || 'Sin membresía'}</td>
                      <td>{cliente.fechaFin || 'Sin fecha'}</td>
                      <td>
                        <span className={`etiqueta-estado ${cliente.estado}`}>
                          {cliente.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}
      </div>
    </>
  );
}
