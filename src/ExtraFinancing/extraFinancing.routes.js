'use strict';

import { Router } from 'express';
import { createExtraFinancing, getAllFinancings, getFinancingsByCard } from './extraFinancing.controller.js';

import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';
import { validateExtraFinancing } from '../../middlewares/extraFinancing.validator.js';

const router = Router();

router.post('/', [validateJWT, hasRole('ADMIN_ROLE'), validateExtraFinancing], createExtraFinancing);
router.get('/', [validateJWT, hasRole('ADMIN_ROLE')], getAllFinancings);
router.get('/card/:creditCardId', [validateJWT, hasRole('ADMIN_ROLE')], getFinancingsByCard);
export default router;