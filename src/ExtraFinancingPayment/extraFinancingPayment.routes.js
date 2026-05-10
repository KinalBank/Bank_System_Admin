'use strict';

import { Router } from 'express';
import { payExtraFinancingInstallment } from './extraFinancingPayment.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';
import { validateExtraFinancingPayment } from '../../middlewares/extraFinancingPayment.validator.js';

const router = Router();

router.post('/pay', [
    validateJWT,
    hasRole('ADMIN_ROLE'),
    validateExtraFinancingPayment
], payExtraFinancingInstallment);

export default router;