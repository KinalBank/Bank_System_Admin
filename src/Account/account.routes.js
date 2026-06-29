'use strict';

import { Router } from 'express';
import {
    createAccount,
    getAccounts,
    changeAccountStatus,
    getAccountRanking,
    getAccountDetails,
    getPendingRequests,        
    approveAccountRequest,    
    rejectAccountRequest       
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

router.get('/requests', [validateJWT, hasRole('ADMIN_ROLE')], getPendingRequests);
router.patch('/:id/approve', [validateJWT, hasRole('ADMIN_ROLE')], approveAccountRequest);
router.patch('/:id/reject', [validateJWT, hasRole('ADMIN_ROLE')], rejectAccountRequest);

export default router;