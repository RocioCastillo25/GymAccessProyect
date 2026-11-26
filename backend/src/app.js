// Punto de entrada de la aplicación Express (FR-031, FR-032).

import express from 'express';
import cors from 'cors';
import rutasApi from './routes/index.js';
import { manejarErrores, recursoNoEncontrado } from './middlewares/manejoErrores.js';
import { config } from './config/entorno.js';

const app = express();

// En desarrollo se mantiene abierto; con CORS_ORIGIN definido se restringe a
// los orígenes permitidos separados por comas (US-S4-06).
app.use(cors(config.corsOrigen.length > 0 ? { origin: config.corsOrigen } : undefined));
app.use(express.json());

// Registro de rutas bajo el prefijo /api (contrato en contracts/api-rest.md).
app.use('/api', rutasApi);

// Ruta inexistente y manejo centralizado de errores (siempre al final).
app.use(recursoNoEncontrado);
app.use(manejarErrores);

export default app;
