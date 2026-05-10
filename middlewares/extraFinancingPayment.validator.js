'use strict';

import { body } from 'express-validator';
import { checkValidators } from "./check-validators.js";

export const validateExtraFinancingPayment = [
    body('extraFinancingId', 'ID de extrafinanciamiento inválido').isMongoId(),
    body('accountId', 'ID de cuenta inválido').isMongoId(),
    checkValidators
];