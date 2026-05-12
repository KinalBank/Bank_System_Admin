import { Router } from 'express';
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    changeUserStatus,
    verifyUser,
    changeUserRole
} from './user.controller.js';

import {
    validateCreateUser,
    validateUpdateUserRequest,
    validateUserStatusChange,
    validateGetUserById
} from '../../middlewares/user-validator.js';

import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';


const router = Router();

// Solo el ADMIN puede ver la lista de todos los usuarios
router.get('/', validateJWT, hasRole('ADMIN_ROLE'), getUsers);

// Ambos pueden ver perfiles (El controller valida que el USER solo vea el suyo)
router.get('/:id', validateJWT, validateGetUserById, getUserById);

// Solo el ADMIN puede crear usuarios (Regla del PDF)
router.post('/', validateJWT, hasRole('ADMIN_ROLE'), validateCreateUser, createUser);

// Ambos pueden editar (El controller valida que el USER solo se edite a sí mismo)
router.put('/:id', validateJWT, validateUpdateUserRequest, updateUser);

// Solo el ADMIN puede activar/desactivar usuarios
router.put('/:id/status', validateJWT, hasRole('ADMIN_ROLE'), validateUserStatusChange, changeUserStatus);

router.put('/:id/verify', validateJWT, hasRole('ADMIN_ROLE'), verifyUser);

router.put('/:id/role', validateJWT, hasRole('ADMIN_ROLE'), changeUserRole);


export default router;
