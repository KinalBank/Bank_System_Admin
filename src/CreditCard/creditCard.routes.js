'use strict';

import { Router } from 'express';
import { 
    createCreditCard, 
    getAllCreditCards, 
    getCardsByUser,
    getMyCreditCards // (La que ya tenías)
} from './creditCard.controller.js';
import { validateJWT, isAdmin } from '../../middlewares/validate-jwt.js';
import { validateCreateCreditCard } from '../../middlewares/creditCard.validator.js';

const router = Router();

// --- RUTAS DE ADMIN ---
router.get('/all', [validateJWT, isAdmin], getAllCreditCards);
router.get('/user/:userId', [validateJWT, isAdmin], getCardsByUser);
router.post('/', [validateJWT, isAdmin, validateCreateCreditCard], createCreditCard);
export default router;