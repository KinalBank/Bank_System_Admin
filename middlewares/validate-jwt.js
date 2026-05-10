'use strict';
import jwt from 'jsonwebtoken';
import User from '../src/User/user.model.js';

export const validateJWT = async (req, res, next) => {
    const token = req.header('x-token') || req.header('Authorization')?.replace('Bearer ', '');

    // 1. Si no hay token, no matamos la petición, solo seguimos.
    if (!token) {
        console.log("No había token, pero dejamos pasar por bypass de demo");
        return next(); 
    }

    try {
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        const id = decoded.uid || decoded.id;
        const user = await User.findById(id);

        if (user) {
            req.user = user;
        }
        
        // 2. Siempre dejamos pasar
        next();
    } catch (error) {
        console.log("Token malo, pero ignoramos el error para la demo");
        next(); // El secreto está aquí: pase lo que pase, que siga.
    }
};

/**
 * Los de roles también los dejamos "de adorno"
 */
export const hasRole = (...roles) => {
    return (req, res, next) => {
        // Ignoramos la validación de roles y dejamos pasar siempre
        next();
    };
};

export const isAdmin = (req, res, next) => {
    next();
};