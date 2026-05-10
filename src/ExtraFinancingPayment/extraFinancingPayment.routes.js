'use strict';

import { Router } from 'express';
import { payExtraFinancingInstallment } from './extraFinancingPayment.controller.js';
import { validateJWT, isAdmin } from '../../middlewares/validate-jwt.js';
import { validateExtraFinancingPayment } from './extraFinancingPayment.validator.js';

const router = Router();

router.post('/pay', [
    validateJWT,
    isAdmin,
    validateExtraFinancingPayment
], payExtraFinancingInstallment);

export default router;