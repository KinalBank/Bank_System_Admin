import { body } from 'express-validator';
import { validateErrors } from './validate-errors.js';

export const validateExtraFinancing = [
    body('creditCard', 'ID de tarjeta inválido').isMongoId(),
    body('totalAmount', 'El monto debe ser mayor a 0').isFloat({ min: 1 }),
    body('installments', 'Plazo no permitido').isIn([12, 24, 36, 48]),
    body('description', 'La descripción es requerida').notEmpty(),
    validateErrors
];