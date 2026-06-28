import { Router } from 'express';
import {
    getAllCardStatusRequests,
    approveCardStatusRequest,
    rejectCardStatusRequest,
} from './cardStatusRequest.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';
import { validateCardStatusRequestIdParam } from '../../middlewares/cardStatusRequest.validator.js';

const router = Router();

router.use(validateJWT, hasRole('ADMIN_ROLE'));

// GET   /bankSystem/v1/admin/cardStatusRequests
router.get('/', getAllCardStatusRequests);

// PATCH /bankSystem/v1/admin/cardStatusRequests/:id/approve
router.patch('/:id/approve', validateCardStatusRequestIdParam, approveCardStatusRequest);

// PATCH /bankSystem/v1/admin/cardStatusRequests/:id/reject
router.patch('/:id/reject', validateCardStatusRequestIdParam, rejectCardStatusRequest);

export default router;