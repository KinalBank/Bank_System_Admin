'use strict';

import { body, param } from 'express-validator';
import { validateErrors } from './validate-errors.js'; 

export const validateCreateCreditCard = [
    body('user', 'El ID del usuario es obligatorio').notEmpty().isMongoId(),
    body('account', 'El ID de la cuenta asociada es obligatoria').notEmpty().isMongoId(),
    body('type', 'Tipo de tarjeta inválido')
        .optional()
        .isIn(['CLASSIC', 'GOLD', 'PLATINUM', 'BLACK']),
    body('creditLimit', 'El límite debe ser un número positivo')
        .notEmpty()
        .isFloat({ min: 1 }),
    body('cutoffDate', 'La fecha de corte debe ser un día entre 1 y 28')
        .notEmpty()
        .isInt({ min: 1, max: 28 }),
    body('interestRate', 'La tasa de interés debe ser un número')
        .optional()
        .isFloat({ min: 0 }),
    validateErrors
];

export const validateCreditCardId = [
    param('id', 'El ID de la tarjeta no es válido').isMongoId(),
    validateErrors
];