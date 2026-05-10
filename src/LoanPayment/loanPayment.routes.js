'use strict';

import { Router } from 'express';
import { payLoanInstallment } from './loanPayment.controller.js';
import { validateJWT, isAdmin } from '../../middlewares/validate-jwt.js';
import { validateLoanPayment } from '../../middlewares/loanPayment.validator.js';

const router = Router();

router.post('/pay', [
    validateJWT, 
    isAdmin, 
    validateLoanPayment
], payLoanInstallment);

export default router;