'use strict';

import { Router } from 'express';
import {
    getTransactions,
    createTransaction,
    getAccountHistory,
    revertDeposit
} from '../Transaction/transaction.controller.js';

// IMPORTACIONES DE SEGURIDAD CORREGIDAS
import { validateJWT, hasRole } from '../../middlewares/validate-jwt.js';

import {
    validateCreateTransaction,
    validateHistoryId
} from '../../middlewares/transaction.validator.js';

const router = Router();

// Usamos tu función unificada createTransaction que maneja depósitos y transferencias
router.post('/',
    validateJWT,
    validateCreateTransaction,
    createTransaction
);

router.put('/revert/:id',
    validateJWT,
    hasRole('ADMIN'),
    revertDeposit
);

router.get('/account/:id/history', 
    validateJWT,
    validateHistoryId, 
    getAccountHistory
);

router.get('/', 
    validateJWT, 
    getTransactions
);

export default router;