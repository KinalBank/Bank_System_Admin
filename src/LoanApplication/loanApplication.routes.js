'use strict';

import { Router } from "express";
import { validateJWT, isAdmin } from "../../middlewares/validate-jwt.js";

import {
    validateLoanApplicationId
} from "../../middlewares/loanApplication.validator.js";

import {
    approveLoanApplication,
    rejectLoanApplication,
    getLoanApplications
} from "./loanApplication.controller.js";

const router = Router();



// Aprobar solicitud (ADMIN)
router.put(
    '/:id/approve',
    validateJWT,
    isAdmin,
    validateLoanApplicationId,
    approveLoanApplication
);
// Rechazar solicitud (ADMIN)
router.put(
    '/:id/reject',
    validateJWT,
    isAdmin,
    validateLoanApplicationId,
    rejectLoanApplication
);
// Listar todas las solicitudes (ADMIN)
router.get(
    '/',
    validateJWT,
    isAdmin,
    getLoanApplications
);

export default router;