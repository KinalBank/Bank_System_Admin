'use strict';

import { body, param } from 'express-validator';
import { checkValidators } from "./check-validators.js";

export const validateCreateCreditCard = [
    // 1. Validamos solo lo que enviamos desde el Modal
    body('user', 'El ID del usuario es obligatorio').notEmpty().isMongoId(),
    body('type', 'Tipo de tarjeta no válido').notEmpty().isIn(['CLASSIC', 'GOLD', 'PLATINUM', 'BLACK']),
    body('creditLimit', 'El límite debe ser un número').isNumeric(),
    
    // 2. La cuenta la ponemos como opcional porque ahora es independiente
    body('account')
        .optional({ checkFalsy: true })
        .isMongoId().withMessage('ID de cuenta no válido'),

    // 3. ¡IMPORTANTE! Elimina de aquí: cardNumber, cvv, expirationDate, holderName
    // Si los dejas aquí como obligatorios, Node dará 400 antes de llegar al controlador.

    checkValidators
];