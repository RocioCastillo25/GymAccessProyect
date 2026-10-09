// Punto de entrada de la aplicación Express (FR-031, FR-032).

import express from 'express';
import cors from 'cors';
import rutasApi from './routes/index.js';
import { manejarErrores, recursoNoEncontrado } from './middlewares/manejoErrores.js';

const app = express();

app.use(cors());
app.use(express.json());

// Registro de rutas bajo el prefijo /api (contrato en contracts/api-rest.md).
app.use('/api', rutasApi);

// Ruta inexistente y manejo centralizado de errores (siempre al final).
app.use(recursoNoEncontrado);
app.use(manejarErrores);

export default app;
