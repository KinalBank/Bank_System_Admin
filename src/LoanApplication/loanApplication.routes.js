'use strict';

import { Router } from "express";
import { validateJWT } from "../../middlewares/validate-jwt.js";
import { hasRole } from "../../middlewares/role-validator.js";

import {
    validateCreateLoanApplication,
    validateUpdateLoanApplication,
    validateLoanApplicationId
} from "../../middlewares/loanApplication.validator.js";

import {
    createLoanApplication,
    updateLoanApplication,
    cancelLoanApplication,
    approveLoanApplication,
    rejectLoanApplication,
    getLoanApplications
} from "./loanApplication.controller.js";

const router = Router();

// Crear solicitud (cliente)
router.post(
    '/',
    validateJWT,
    validateCreateLoanApplication,
    createLoanApplication
);
// Editar solicitud (cliente)
router.put(
    '/:id',
    validateJWT,
    validateLoanApplicationId,
    validateUpdateLoanApplication,
    updateLoanApplication
);
// Cancelar solicitud (cliente)
router.put(
    '/:id/cancel',
    validateJWT,
    validateLoanApplicationId,
    cancelLoanApplication
);


// Aprobar solicitud (ADMIN)
router.put(
    '/:id/approve',
    validateJWT,
    hasRole('ADMIN_ROLE'),
    validateLoanApplicationId,
    approveLoanApplication
);
// Rechazar solicitud (ADMIN)
router.put(
    '/:id/reject',
    validateJWT,
    hasRole('ADMIN_ROLE'),
    validateLoanApplicationId,
    rejectLoanApplication
);
// Listar todas las solicitudes (ADMIN)
router.get(
    '/',
    validateJWT,
    hasRole('ADMIN_ROLE'),
    getLoanApplications
);

export default router;