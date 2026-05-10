'use strict';

import { Router } from "express";
// Cambiamos isAdmin por hasRole
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

// ================= RUTAS DE CLIENTE =================

// Crear solicitud
router.post(
    '/',
    [validateJWT, validateCreateLoanApplication],
    createLoanApplication
);

// Editar solicitud
router.put(
    '/:id',
    [validateJWT, validateLoanApplicationId, validateUpdateLoanApplication],
    updateLoanApplication
);

// Cancelar solicitud
router.put(
    '/:id/cancel',
    [validateJWT, validateLoanApplicationId],
    cancelLoanApplication
);


// ================= RUTAS DE ADMIN (ADMIN_ROLE) =================

// Aprobar solicitud
router.put(
    '/:id/approve',
    [validateJWT, hasRole('ADMIN_ROLE'), validateLoanApplicationId],
    approveLoanApplication
);

// Rechazar solicitud
router.put(
    '/:id/reject',
    [validateJWT, hasRole('ADMIN_ROLE'), validateLoanApplicationId],
    rejectLoanApplication
);

// Listar todas las solicitudes
router.get(
    '/',
    [validateJWT, hasRole('ADMIN_ROLE')],
    getLoanApplications
);

export default router;