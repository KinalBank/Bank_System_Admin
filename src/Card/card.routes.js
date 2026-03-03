import { Router } from 'express';
import { 
    getCards, 
    createCard, 
    updateCard, 
    changeCardStatus, 
    approveCard 
} from './card.controller.js';

import { 
    validateCreateCard, 
    validateCardId 
} from '../../middlewares/card.validator.js';

import { uploadCardImage } from '../../middlewares/file-uploader.js'; 
// Importamos los protectores
import { validateJWT, isAdmin } from "../../middlewares/validate-jwt.js";

const router = Router();

// 1. Ver todas las tarjetas (Solo ADMIN puede ver el catálogo completo)
router.get('/', 
    validateJWT, 
    isAdmin, 
    getCards
);

// 2. Crear tarjeta (Cualquiera logueado, pero el controlador valida si es su cuenta o si es Admin)
router.post(
    '/',
    validateJWT,
    uploadCardImage.single('image'), 
    validateCreateCard,
    createCard
);

// 3. Actualizar tarjeta (Solo el dueño o Admin)
router.put('/:id', 
    validateJWT,
    validateCardId, 
    uploadCardImage.single('image'), 
    updateCard
);

// 4. Activar/Desactivar tarjeta (ADMIN)
router.put('/:id/status', 
    validateJWT,
    isAdmin,
    validateCardId, 
    changeCardStatus
);

// 5. Aprobar tarjeta de CRÉDITO (ADMIN)
router.put('/:id/approve', 
    validateJWT,
    isAdmin,
    validateCardId,
    approveCard
);

export default router;