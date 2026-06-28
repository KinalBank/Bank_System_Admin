'use strict';
import { Router } from 'express';
import {
    getAllExtraFinancingRequests,
    approveExtraFinancingRequest,
    rejectExtraFinancingRequest
} from './extraFinancingRequest.controller.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';
import { validateCreateExtraFinancingRequest, validateRejectExtraFinancingRequest } from '../../middlewares/extraFinancingRequest.validator.js';

const router = Router();

// ── Rutas de admin ────────────────────────────────────────────────────────────
router.get('/admin', [validateJWT, hasRole('ADMIN_ROLE')], getAllExtraFinancingRequests);
router.patch('/:id/approve', [validateJWT, hasRole('ADMIN_ROLE')], approveExtraFinancingRequest);
router.patch('/:id/reject', [validateJWT, hasRole('ADMIN_ROLE'), validateRejectExtraFinancingRequest], rejectExtraFinancingRequest);

export default router;