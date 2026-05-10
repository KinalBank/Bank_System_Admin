import { Router } from 'express';
import {
    getUsers,
    getUserById,
    createUser,
    updateUser,
    changeUserStatus
} from './user.controller.js';

import {
    validateCreateUser,
    validateUpdateUserRequest,
    validateUserStatusChange,
    validateGetUserById
} from '../../middlewares/user-validator.js';

import { validateJWT, hasRole } from '../../middlewares/validate-jwt.js';

const router = Router();

// Solo el ADMIN puede ver la lista de todos los usuarios
router.get('/', validateJWT, hasRole('ADMIN'), getUsers);

// Ambos pueden ver perfiles (El controller valida que el USER solo vea el suyo)
router.get('/:id', validateJWT, validateGetUserById, getUserById);

// Solo el ADMIN puede crear usuarios (Regla del PDF)
router.post('/', validateJWT, hasRole('ADMIN'), validateCreateUser, createUser);

// Ambos pueden editar (El controller valida que el USER solo se edite a sí mismo)
router.put('/:id', validateJWT, validateUpdateUserRequest, updateUser);

// Solo el ADMIN puede activar/desactivar usuarios
router.put('/:id/status', validateJWT, hasRole('ADMIN'), validateUserStatusChange, changeUserStatus);


export default router;
