'use strict';

import CreditCard from './creditCard.model.js';

/**
 * Obtener todas las tarjetas de credito
 */
export const getAllCreditCards = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;

        const cards = await CreditCard.find()
            .populate('user', 'UserName UserSurname UserEmail')
            .populate('account', 'accountNumber balance')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await CreditCard.countDocuments();

        res.status(200).json({ 
            success: true, 
            total,
            data: cards 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener el listado general', error: error.message });
    }
};

/**
 * Obtener tarjetas de credito por medio del usuario
 */
export const getCardsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const cards = await CreditCard.find({ user: userId })
            .populate('account', 'accountNumber balance');

        res.status(200).json({ success: true, data: cards });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al buscar tarjetas del usuario', error: error.message });
    }
};

const generatePAN = () => {
    const prefix = "4213"; // Prefijo Visa ficticio
    const random = Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
    return prefix + random;
};

/**
 * Crear tarjeta de credito
 */
export const createCreditCard = async (req, res) => {
    try {
        // El frontend ahora solo envía lo estrictamente necesario
        const { user, account, type, creditLimit } = req.body;

        // Lógica de negocio automática en el Backend
        const cardNumber = generatePAN();
        
        // Definimos fechas por defecto si no vienen
        // Día de corte: hoy o un día estándar (ej. 15)
        const cutoffDate = 15; 
        
        // Fecha límite de pago: 20 días después del corte
        const paymentDeadline = 20;

        // Tasa de interés según el tipo de tarjeta (Lógica de Negocio)
        let interestRate = 2.5;
        if (type === 'GOLD') interestRate = 2.2;
        if (type === 'PLATINUM') interestRate = 1.8;
        if (type === 'BLACK') interestRate = 1.5;

        const newCard = new CreditCard({
            cardNumber,
            user,
            account: account || null, // Independencia total si no viene
            type: type || 'CLASSIC',
            creditLimit,
            totalDebt: 0,
            availableCredit: creditLimit,
            cutoffDate,
            paymentDeadline,
            interestRate,
            status: 'ACTIVE'
        });

        await newCard.save();

        res.status(201).json({ 
            success: true, 
            message: 'Tarjeta emitida exitosamente por el servidor', 
            data: newCard 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Error al emitir tarjeta', 
            error: error.message 
        });
    }
};