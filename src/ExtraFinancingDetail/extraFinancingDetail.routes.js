'use strict';

import { Router } from 'express';
import { getFinancingDetails } from './extraFinancingDetail.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';
import { validateGetFinancingDetails } from '../../middlewares/extraFinancingDetail.validator.js';

const router = Router();

router.get('/:financingId', [validateJWT, hasRole('ADMIN_ROLE'), validateGetFinancingDetails], getFinancingDetails);

export default router;