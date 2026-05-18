import { body } from 'express-validator';
import { checkValidators } from "./check-validators.js";
 
export const validateExtraFinancing = [
    body('creditCard', 'ID de tarjeta inválido').isMongoId(),
 
    body('totalAmount', 'El monto debe ser mayor a 0')
        .isFloat({ min: 1 }),

    body('installments', 'Plazo no permitido')
        .toInt()
        .isIn([12, 24, 36, 48]),
 
    body('description', 'La descripción es requerida').notEmpty(),

    body('interestRate')
        .optional()
        .toFloat()
        .isFloat({ min: 0 }),
 
    checkValidators,
];
 
