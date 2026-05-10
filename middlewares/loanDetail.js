'use strict';

import { body, param } from 'express-validator';
import { checkValidators } from "./check-validators.js";

export const validateGetLoanDetails = [
    param('loanId', 'El ID del préstamo no es válido').isMongoId(),
    checkValidators
];

export const validateInstallmentPayment = [
    body('loanId', 'El ID del préstamo es obligatorio').notEmpty().isMongoId(),
    body('accountId', 'La cuenta para debitar es obligatoria').notEmpty().isMongoId(),
    checkValidators
];