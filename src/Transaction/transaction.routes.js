'use strict';

import { Router } from 'express';
import {
    getTransactions,
    createTransaction,
    getAccountHistory,
    revertDeposit
} from '../Transaction/transaction.controller.js';

import { validateJWT, hasRole } from '../../middlewares/validate-jwt.js';

import {
    validateCreateTransaction,
    validateHistoryId
} from '../../middlewares/transaction.validator.js';

const router = Router();

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