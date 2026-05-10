'use strict';

import { Router } from 'express';
import { getLoanDetails, payInstallment } from './loanDetail.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';

const router = Router();

router.get('/:loanId', validateJWT, getLoanDetails);

router.post('/pay', validateJWT, payInstallment);

export default router;