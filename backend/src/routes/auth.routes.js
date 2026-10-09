// Rutas de autenticación (contracts/api-rest.md §1).

import { Router } from 'express';
import { login, yo } from '../controllers/auth.controller.js';
import { autenticar } from '../middlewares/autenticar.js';

const router = Router();

router.post('/auth/login', login);
router.get('/auth/me', autenticar, yo);

export default router;
