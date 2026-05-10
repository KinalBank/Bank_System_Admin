'use strict';

import { body } from 'express-validator';
import { checkValidators } from "./check-validators.js";

export const validateCreditCardPayment = [
    body('creditCardId', 'ID de tarjeta inválido').isMongoId(),
    body('accountId', 'ID de cuenta inválido').isMongoId(),
    body('amount', 'El monto debe ser un número positivo').isFloat({ min: 1 }),
    checkValidators
];