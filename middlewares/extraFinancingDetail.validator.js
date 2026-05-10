'use strict';

import { param } from 'express-validator';
import { validateErrors } from './validate-errors.js';

export const validateGetFinancingDetails = [
    param('financingId', 'El ID del financiamiento no es un ID de MongoDB válido')
        .isMongoId(),
    validateErrors
];