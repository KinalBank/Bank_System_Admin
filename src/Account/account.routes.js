'use strict';

import { Router } from 'express';
import { 
    createAccount, 
    getAccounts, 
    changeAccountStatus, 
    getAccountRanking, 
    getAccountDetails 
} from './account.controller.js';
import { validateJWT, isAdmin } from '../../middlewares/validate-jwt.js';

const router = Router();

// GET - Obtener todas las cuentas (Se ve pro con validateJWT)
router.get('/', [validateJWT], getAccounts);

// POST - Crear cuenta (Aquí es donde te daba el 401)
router.post('/', [validateJWT], createAccount);

// PUT - Cambiar estado
router.put('/:id/status', [validateJWT, isAdmin], changeAccountStatus);

// GET - Ranking de movimientos
router.get('/movements/ranking', [validateJWT], getAccountRanking);

// GET - Detalles de cuenta
router.get('/:id/details', [validateJWT], getAccountDetails);

export default router;