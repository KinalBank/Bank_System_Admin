'use strict';

import { Router } from 'express';
import { processPurchase } from './purchase.controller.js';
import { validateJWT, isAdmin } from '../../middlewares/validate-jwt.js';
import { validatePurchase } from '../../middlewares/purchase.validator.js';

const router = Router();

router.post('/', [validateJWT, isAdmin, validatePurchase], processPurchase);

export default router;