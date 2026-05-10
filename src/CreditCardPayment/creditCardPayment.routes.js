'use strict';

import { Router } from 'express';
import { payCreditCard } from './creditCardPayment.controller.js';
import { validateJWT, isAdmin } from '../../middlewares/validate-jwt.js';
import { validateCreditCardPayment } from '../../middlewares/creditCardPayment.validator.js';

const router = Router();

router.post('/', [
    validateJWT,
    isAdmin,
    validateCreditCardPayment
], payCreditCard);

export default router;