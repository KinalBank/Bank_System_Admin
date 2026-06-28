import { Router } from 'express';
import {
    getAllCardRequests,
    getCardRequestById,
    approveCardRequest,
    rejectCardRequest
} from './cardRequest.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';
import { validateCardRequestIdParam, validateRejectCardRequest } from '../../middlewares/cardRequest.validator.js';

const router = Router();

router.use(validateJWT, hasRole('ADMIN_ROLE'));

// GET  /bankSystem/v1/cardRequests
router.get('/', getAllCardRequests);

// GET  /bankSystem/v1/cardRequests/:id
router.get('/:id', validateCardRequestIdParam, getCardRequestById);

// PATCH /bankSystem/v1/cardRequests/:id/approve
router.patch('/:id/approve', validateCardRequestIdParam, approveCardRequest);

// PATCH /bankSystem/v1/cardRequests/:id/reject
router.patch('/:id/reject', validateCardRequestIdParam, validateRejectCardRequest, rejectCardRequest);

export default router;