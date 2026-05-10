'use strict';

import { Router } from 'express';
import { createExtraFinancing, getAllFinancings } from './extraFinancing.controller.js';
import { validateJWT, isAdmin } from '../../middlewares/validate-jwt.js';
import { validateExtraFinancing } from '../../middlewares/extraFinancing.validator.js';

const router = Router();

router.post('/', [validateJWT, isAdmin, validateExtraFinancing], createExtraFinancing);
router.get('/', [validateJWT, isAdmin], getAllFinancings);

export default router;