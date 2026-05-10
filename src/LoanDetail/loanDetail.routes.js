'use strict';

import { Router } from 'express';
import { getLoanDetails, payInstallment } from './loanDetail.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { validateGetLoanDetails, validateInstallmentPayment } from '../../middlewares/loanDetail.validator.js';

const router = Router();

router.get('/:loanId', [validateJWT, validateGetLoanDetails], getLoanDetails);
router.post('/pay', [validateJWT, validateInstallmentPayment], payInstallment);
export default router;