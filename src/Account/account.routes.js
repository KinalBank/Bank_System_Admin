'use strict';

import { Router } from 'express';
import { 
    createAccount, 
    getAccounts, 
    changeAccountStatus, 
    getAccountRanking, 
    getAccountDetails 
} from './account.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

// GET - Obtener todas las cuentas (Se ve pro con validateJWT)
router.get('/', [validateJWT, hasRole('ADMIN_ROLE')], getAccounts);

// POST - Crear cuenta (Aquí es donde te daba el 401)
router.post('/', [validateJWT, hasRole('ADMIN_ROLE')], createAccount);

// PUT - Cambiar estado
router.put('/:id/status', [validateJWT, hasRole('ADMIN_ROLE')], changeAccountStatus);

// GET - Ranking de movimientos
router.get('/movements/ranking', [validateJWT, hasRole('ADMIN_ROLE')], getAccountRanking);

// GET - Detalles de cuenta
router.get('/:id/details', [validateJWT], getAccountDetails);

export default router;