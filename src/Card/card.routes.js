import { Router } from 'express';
import { getCards, createCard, updateCard, changeCardStatus } from './card.controller.js';
import { validateCreateCard } from '../../middlewares/card.validator.js';
import { uploadCardImage } from '../../middlewares/file-uploader.js'; // Asegúrate de definir esto en tus helpers

const router = Router();

router.get('/', getCards);

router.post(
    '/',
    uploadCardImage.single('image'), 
    validateCreateCard,
    createCard
);
router.put('/:id', uploadCardImage.single('image'), updateCard);
router.put('/:id/status', changeCardStatus);
export default router;