'use strict';

import { Router } from 'express';
import {
    getTransactions,
    getAllTransactions,
    createTransaction,
    getAccountHistory,
    revertDeposit
} from '../Transaction/transaction.controller.js';

import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';
import { validateCreateTransaction, validateHistoryId } from '../../middlewares/transaction.validator.js';

const router = Router();

// Admin: ver todas las transacciones
router.get('/all', [validateJWT, hasRole('ADMIN_ROLE')], getAllTransactions);

// Admin: crear transacción (depósito, retiro, etc.)
router.post('/', [validateJWT, hasRole('ADMIN_ROLE'), validateCreateTransaction], createTransaction);

// Admin: revertir depósito
router.put('/revert/:id', [validateJWT, hasRole('ADMIN_ROLE')], revertDeposit);

// Cualquier usuario autenticado: historial de una cuenta
router.get('/account/:id/history', [validateJWT, validateHistoryId], getAccountHistory);

// Cualquier usuario autenticado: sus propias transacciones
router.get('/', [validateJWT], getTransactions);

export default router;