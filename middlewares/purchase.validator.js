'use strict';

import { body } from 'express-validator';
import { validateErrors } from './validate-errors.js';

export const validatePurchase = [
    body('description', 'La descripción es obligatoria').notEmpty(),
    body('amount', 'Monto inválido').isFloat({ min: 0.01 }),
    body('type', 'Tipo de compra inválido').isIn(['CREDIT', 'DEBIT']),
    body('cardId', 'ID de tarjeta o cuenta inválido').isMongoId(),
    validateErrors
];