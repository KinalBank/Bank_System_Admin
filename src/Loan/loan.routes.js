'use strict';

import { Router } from 'express';
// Importamos validateJWT y el nuevo validador de roles
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

import {
    getMyLoans,
    getAllLoans,
    getLoanById
} from './loan.controller.js';

const router = Router();

/**
 * GET - Obtener mis préstamos (Cliente)
 * El usuario solo ve los préstamos asociados a su ID de SQL.
 */
router.get(
    '/my',
    [validateJWT],
    getMyLoans
);

/**
 * GET - Obtener préstamo por ID
 * Requiere estar autenticado.
 */
router.get(
    '/:id',
    [validateJWT],
    getLoanById
);

/**
 * GET - Obtener todos los préstamos (ADMIN)
 * Solo accesible para usuarios con el rol 'ADMIN_ROLE' definido en SQL.
 */
router.get(
    '/',
    [validateJWT, hasRole('ADMIN_ROLE')],
    getAllLoans
);

export default router;