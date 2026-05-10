import { body, param } from 'express-validator';
import { checkValidators } from './check-validators.js';


export const validateCreateCard = [
    body('holderName')
        .notEmpty().withMessage('El nombre del titular es obligatorio'),
    body('brand')
        .isIn(['VISA', 'MASTERCARD', 'AMEX']).withMessage('Marca de tarjeta no soportada'),
    body('account')
        .notEmpty().withMessage('El ID de la cuenta es obligatorio')
        .isMongoId().withMessage('No es un ID de cuenta válido'),
    checkValidators
];