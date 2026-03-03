'use strict';

import Product from './product.model.js';

// 1. Ver catálogo completo (Para todos los usuarios)
export const getProducts = async (req, res) => {
    try {
        const { page = 1, limit = 10, type } = req.query;
        
        // Solo mostramos los que están activos
        const filter = { isActive: true };
        if (type) filter.type = type.toUpperCase(); // Por si quieren filtrar solo SERVICIOS o PRODUCTOS

        const products = await Product.find(filter)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .sort({ createdAt: -1 });

        const total = await Product.countDocuments(filter);

        res.status(200).json({
            success: true,
            total: products.length,
            data: products,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener el catálogo', error: error.message });
    }
};

// 2. Crear producto/servicio (SOLO ADMIN)
export const createProduct = async (req, res) => {
    try {
        const product = new Product(req.body);
        await product.save();

        res.status(201).json({
            success: true,
            message: 'Producto/Servicio agregado al catálogo exitosamente',
            data: product
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al crear', error: error.message });
    }
};

// 3. Actualizar producto/servicio (SOLO ADMIN)
export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndUpdate(id, req.body, { new: true });

        if (!product) return res.status(404).json({ success: false, message: 'Elemento no encontrado' });

        res.status(200).json({ success: true, message: 'Actualizado exitosamente', data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al actualizar', error: error.message });
    }
};

// 4. Desactivar producto (SOLO ADMIN - Soft Delete)
export const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findByIdAndUpdate(id, { isActive: false }, { new: true });

        if (!product) return res.status(404).json({ success: false, message: 'Elemento no encontrado' });

        res.status(200).json({ success: true, message: 'Producto/Servicio retirado del catálogo', data: product });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al eliminar', error: error.message });
    }
};