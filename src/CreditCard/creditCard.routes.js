'use strict';

import { Router } from 'express';
import { 
    createCreditCard, 
    getAllCreditCards, 
    getCardsByUser,
} from './creditCard.controller.js';

// Importamos la nueva lógica
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';
import { validateCreateCreditCard } from '../../middlewares/creditCard.validator.js';

const router = Router();

// Listar todas (ADMIN)
router.get('/', [validateJWT, hasRole('ADMIN_ROLE')], getAllCreditCards);

// Por usuario
router.get('/user/:userId', [validateJWT, hasRole('ADMIN_ROLE')], getCardsByUser);

// Crear (ADMIN)
router.post(
    '/', 
    [validateJWT, hasRole('ADMIN_ROLE')], 
    createCreditCard
);

export default router;