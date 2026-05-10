'use strict';

import { body } from 'express-validator';
import { validateErrors } from './validate-errors.js';

export const validateExtraFinancingPayment = [
    body('extraFinancingId', 'ID de extrafinanciamiento inválido').isMongoId(),
    body('accountId', 'ID de cuenta inválido').isMongoId(),
    validateErrors
];