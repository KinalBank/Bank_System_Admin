'use strict';

import { Router } from 'express';
import { validateJWT } from '../../middlewares/validate-jwt.js';
import { hasRole } from '../../middlewares/role-validator.js';
import { getProducts, createProduct, updateProduct, deleteProduct } from './product.controller.js';
import { validateCreateProduct, validateUpdateProduct, validateProductId } from '../../middlewares/product.validator.js';

const router = Router();
  
router.get('/', validateJWT, getProducts);

router.post('/', [validateJWT, hasRole('ADMIN_ROLE'), validateCreateProduct], createProduct);
router.put('/:id', [validateJWT, hasRole('ADMIN_ROLE'), validateUpdateProduct], updateProduct);
router.delete('/:id', [validateJWT, hasRole('ADMIN_ROLE'), validateProductId], deleteProduct);

export default router;