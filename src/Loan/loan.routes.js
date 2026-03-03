'use strict';

import { Router } from 'express';

// IMPORTACIÓN CORREGIDA
import { validateJWT, hasRole } from '../../middlewares/validate-jwt.js';

import {
    getAllLoans,
    getLoanById
} from './loan.controller.js';

const router = Router();

router.get('/',
    validateJWT,
    hasRole('ADMIN'),
    getAllLoans 
);


router.get('/:id',
    validateJWT,
    getLoanById
);

export default router;