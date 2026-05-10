import { Router } from 'express';
import { getCards, createCard, updateCard, changeCardStatus, payCreditCard } from './card.controller.js';
import { validateCreateCard } from '../../middlewares/card.validator.js';
import { uploadCardImage } from '../../middlewares/file-uploader.js'; // Asegúrate de definir esto en tus helpers

const router = Router();

// 1. Ver todas las tarjetas (Solo ADMIN puede ver el catálogo completo)
router.get('/', 
    validateJWT, 
    isAdmin, 
    getCards
);

// 2. Crear tarjeta (Cualquiera logueado)
router.post(
    '/',
    validateJWT,
    uploadCardImage.single('image'), 
    validateCreateCard,
    createCard
);
router.put('/:id', uploadCardImage.single('image'), updateCard);
router.put('/:id/status', changeCardStatus);
router.post('/:id/pay', payCreditCard);
export default router;