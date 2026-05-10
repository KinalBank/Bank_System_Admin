'use strict';

import { body } from 'express-validator';
import { checkValidators } from "./check-validators.js";

export const validateLoanPayment = [
    body('loanId', 'El ID del préstamo es obligatorio y debe ser válido')
        .notEmpty()
        .isMongoId(),
    body('accountId', 'El ID de la cuenta de origen es obligatorio y debe ser válido')
        .notEmpty()
        .isMongoId(),
    checkValidators
];