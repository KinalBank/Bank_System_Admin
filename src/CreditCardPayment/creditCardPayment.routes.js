'use strict';

import { Router } from 'express';
import { payCreditCard, getCreditCardPayments } from './creditCardPayment.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';
import { validateCreditCardPayment } from '../../middlewares/creditCardPayment.validator.js';

const router = Router();

router.get('/', [validateJWT, hasRole('ADMIN_ROLE')], getCreditCardPayments);
router.post('/', [validateJWT, hasRole('ADMIN_ROLE'), validateCreditCardPayment], payCreditCard);

export default router;