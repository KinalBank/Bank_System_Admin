'use strict';

import { Router } from 'express';
import { getFinancingDetails } from './extraFinancingDetail.controller.js';
import { validateJWT, isAdmin } from '../../middlewares/validate-jwt.js';
import { validateGetFinancingDetails } from '../../middlewares/extraFinancingDetail.validator.js';

const router = Router();

router.get('/:financingId', [validateJWT, isAdmin, validateGetFinancingDetails], getFinancingDetails);

export default router;