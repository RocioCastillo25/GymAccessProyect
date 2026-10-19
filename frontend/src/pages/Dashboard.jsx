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
  const [error, setError] = useState('');
  const esAdministrador = rol === 'administrador';

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

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
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
  );
}
