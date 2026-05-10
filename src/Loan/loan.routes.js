'use strict';

import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';
import { createLoan, getAllLoans, getLoanById } from './loan.controller.js';

const router = Router();

// Admin: crear préstamo directo
router.post('/', [validateJWT, hasRole('ADMIN_ROLE')], createLoan);

// Admin: todos los préstamos
router.get('/', [validateJWT, hasRole('ADMIN_ROLE')], getAllLoans);

// Cualquiera autenticado: detalle
router.get('/:id', [validateJWT], getLoanById);

export default router;