'use strict';

import { Router } from 'express';
import { processPurchase, getPurchases } from './purchase.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';
import { validatePurchase, validateGetPurchases } from '../../middlewares/purchase.validator.js';

const router = Router();

router.get('/', [validateJWT, hasRole('ADMIN_ROLE'), validateGetPurchases], getPurchases);
router.post('/', [validateJWT, hasRole('ADMIN_ROLE'), validatePurchase], processPurchase);

export default router;