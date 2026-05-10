import { body } from 'express-validator';
import { checkValidators } from "./check-validators.js";
 
export const validateExtraFinancing = [
    body('creditCard', 'ID de tarjeta inválido').isMongoId(),
 
    body('totalAmount', 'El monto debe ser mayor a 0')
        .isFloat({ min: 1 }),
 
    // ── FIX: convertir a entero ANTES de validar el enum ──────────────────
    // express-validator trata los valores del body como strings internamente.
    // Sin .toInt(), "12" !== 12 y .isIn([12,24,36,48]) siempre falla → 400.
    body('installments', 'Plazo no permitido')
        .toInt()
        .isIn([12, 24, 36, 48]),
 
    body('description', 'La descripción es requerida').notEmpty(),
 
    // interestRate es opcional (el modelo tiene default: 1.5),
    // pero si viene, debe ser un número positivo
    body('interestRate')
        .optional()
        .toFloat()
        .isFloat({ min: 0 }),
 
    checkValidators,
];
 
