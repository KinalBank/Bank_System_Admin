'use strict';

import { param } from 'express-validator';
import { checkValidators } from "./check-validators.js";

export const validateGetFinancingDetails = [
    param('financingId', 'El ID del financiamiento no es un ID de MongoDB válido')
        .isMongoId(),
    checkValidators
];