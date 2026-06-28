import { Router } from 'express';
import {
    getAllCreditCardRequests,
    approveCreditCardRequest,
    rejectCreditCardRequest
} from './creditCardRequest.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

router.use(validateJWT, hasRole('ADMIN_ROLE'));

// GET  /bankSystem/v1/creditCardRequests
router.get('/', getAllCreditCardRequests);

// PATCH /bankSystem/v1/creditCardRequests/:id/approve
router.patch('/:id/approve', approveCreditCardRequest);

// PATCH /bankSystem/v1/creditCardRequests/:id/reject
router.patch('/:id/reject', rejectCreditCardRequest);

export default router;