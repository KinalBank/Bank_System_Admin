'use strict';

import { Router } from 'express';
import { validateJWT, isAdmin } from '../../middlewares/validate-jwt.js';
import { getProducts, createProduct, updateProduct, deleteProduct } from './product.controller.js';
import { validateCreateProduct, validateUpdateProduct, validateProductId } from '../../middlewares/product.validator.js';

const router = Router();
  
// Ruta de lectura: Cualquier usuario logueado puede ver el catálogo
router.get('/', validateJWT, getProducts);

// Rutas de administración: Protegidas con isAdmin y Validadores
router.post('/', [validateJWT, isAdmin, validateCreateProduct], createProduct);
router.put('/:id', [validateJWT, isAdmin, validateUpdateProduct], updateProduct);
router.delete('/:id', [validateJWT, isAdmin, validateProductId], deleteProduct);

export default router;