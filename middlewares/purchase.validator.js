'use strict';

import { body, query } from 'express-validator';
import { checkValidators } from "./check-validators.js";

export const validateGetPurchases = [
    query('cardId').optional().isMongoId().withMessage('cardId inválido'),
    query('debitCardId').optional().isMongoId().withMessage('debitCardId inválido'),
    checkValidators
];

export const validatePurchase = [
    body('description', 'La descripción es obligatoria').notEmpty(),
    body('amount', 'Monto inválido').isFloat({ min: 0.01 }),
    body('type', 'Tipo de compra inválido').isIn(['CREDIT', 'DEBIT']),
    body('cardId', 'ID de tarjeta o cuenta inválido').isMongoId(),
    body('debitCard').optional({ nullable: true }).isMongoId().withMessage('debitCard inválido'),
    checkValidators
];