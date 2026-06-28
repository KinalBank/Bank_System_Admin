import { body, param, validationResult } from 'express-validator';

const validateFields = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array().map(err => ({ field: err.path, message: err.msg }))
        });
    }
    next();
};

export const validateCardRequestIdParam = [
    param('id')
        .isMongoId().withMessage('El ID de la solicitud no es válido'),
    validateFields
];

export const validateRejectCardRequest = [
    body('rejectionReason')
        .optional()
        .isString().withMessage('El motivo debe ser texto')
        .isLength({ max: 500 }).withMessage('El motivo no puede superar los 500 caracteres'),
    validateFields
];