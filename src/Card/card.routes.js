import { Router } from 'express';
import { getCards, createCard, updateCard, changeCardStatus } from './card.controller.js';
import { validateCreateCard } from '../../middlewares/card.validator.js';
import { uploadCardImage } from '../../middlewares/file-uploader.js';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';

const router = Router();

router.get('/', validateJWT, hasRole('ADMIN_ROLE'), getCards);

router.post(
    '/',
    validateJWT,
    hasRole('ADMIN_ROLE'),
    uploadCardImage.single('image'),
    validateCreateCard,
    createCard
);

router.put('/:id', validateJWT, hasRole('ADMIN_ROLE'), uploadCardImage.single('image'), updateCard);
router.put('/:id/status', validateJWT, hasRole('ADMIN_ROLE'), changeCardStatus);

export default router;