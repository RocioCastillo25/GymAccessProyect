// Dashboard administrativo (HU6, FR-019 a FR-021).

import { useCallback, useEffect, useState } from 'react';
import { pedir } from '../services/api.js';
import { useSesion } from '../context/SesionContext.jsx';

const ETIQUETAS = {
  clientesActivos: 'Clientes activos',
  clientesInactivos: 'Clientes inactivos',
  entrenadoresActivos: 'Entrenadores activos',
  clientesConEntrenador: 'Clientes con entrenador',
  clientesSinEntrenador: 'Clientes sin entrenador',
  asignacionesActivas: 'Clientes con entrenador',
  rutinasActivas: 'Rutinas activas',
  objetivosEnProgreso: 'Objetivos en progreso',
  membresiasActivas: 'Membresías activas',
  membresiasVencidas: 'Membresías vencidas',
  accesosRecientes: 'Accesos recientes',
  accesosRechazados: 'Accesos rechazados',
};

export default function Dashboard() {
  const { rol } = useSesion();
  const [resumen, setResumen] = useState(null);
  const [alertas, setAlertas] = useState([]);
  const [error, setError] = useState('');
  const [errorAlertas, setErrorAlertas] = useState('');
  const esAdministrador = rol === 'administrador';
  const puedeVerAlertas = rol === 'administrador' || rol === 'recepcionista';

  const cargar = useCallback(async () => {
    try {
      const ruta = rol === 'administrador' ? '/api/dashboard' : '/api/dashboard/personal';
      const respuesta = await pedir(ruta);
      setResumen(respuesta.resumen);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  }, [rol]);

  const cargarAlertas = useCallback(async () => {
    if (!puedeVerAlertas) return;
    try {
      const respuesta = await pedir('/api/reports/expiring-memberships');
      setAlertas(Array.isArray(respuesta.alertas) ? respuesta.alertas : []);
      setErrorAlertas('');
    } catch (err) {
      setErrorAlertas(err.message);
    }
  }, [puedeVerAlertas]);

  useEffect(() => {
    cargar();
    cargarAlertas();
  }, [cargar, cargarAlertas]);

  return (
    <>
      <section className="tarjeta">
        <h2>{esAdministrador ? 'Dashboard administrativo' : 'Resumen operativo'}</h2>

        {error && <div className="mensaje-error">{error}</div>}

        {resumen && Object.keys(resumen).length === 0 && (
          <p className="textosuave">No hay indicadores disponibles por el momento.</p>
        )}

        {resumen && Object.keys(resumen).length > 0 && (
          <div className="rejilla-kpi">
            {Object.entries(resumen).map(([clave, valor]) => (
              <article className="kpi" key={clave}>
                <span className="kpi-etiqueta">{ETIQUETAS[clave] || clave}</span>
                <span className="kpi-valor">{valor}</span>
              </article>
            ))}
          </div>
        )}
      </section>

      {puedeVerAlertas && (
        <section className="tarjeta">
          <h2>Alertas de vencimiento próximo</h2>
          <p className="textosuave">
            Membresías activas que vencen en los próximos 5 días.
          </p>

          {errorAlertas && <div className="mensaje-error">{errorAlertas}</div>}

          {!errorAlertas && alertas.length === 0 && (
            <p className="textosuave">No hay membresías por vencer en los próximos 5 días.</p>
          )}

          {alertas.length > 0 && (
            <table className="tabla">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Membresía</th>
                  <th>Vence</th>
                  <th>Días restantes</th>
                </tr>
              </thead>
              <tbody>
                {alertas.map((alerta) => (
                  <tr key={alerta.idMembresia} className="fila-alerta">
                    <td>{alerta.cliente}</td>
                    <td>{alerta.tipoMembresia}</td>
                    <td>{alerta.fechaFin}</td>
                    <td>
                      <span className="etiqueta-estado advertencia">{alerta.diasRestantes}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      )}
    </>
  );
}
