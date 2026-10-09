// Arranque del servidor (FR-031).

import app from './app.js';
import { config } from './config/entorno.js';
import { verificarConexion } from './config/baseDatos.js';

const servidor = app.listen(config.puerto, async () => {
  const conexionOk = await verificarConexion();
  console.log(
    `[servidor] API REST escuchando en http://localhost:${config.puerto} | MySQL: ${
      conexionOk ? 'conectada' : 'NO disponible'
    }`
  );
  if (!conexionOk) {
    console.warn(
      '[servidor] Aviso: no se pudo conectar a MySQL. Revise las variables de entorno DB_*.'
    );
  }
});

function apagar(signal) {
  console.log(`[servidor] Recibido ${signal}, cerrando el servidor...`);
  servidor.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', () => apagar('SIGINT'));
process.on('SIGTERM', () => apagar('SIGTERM'));
