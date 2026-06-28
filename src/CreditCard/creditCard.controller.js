'use strict';

import CreditCard from './creditCard.model.js';

/**
 * Obtener todas las tarjetas de credito
 */
export const getAllCreditCards = async (req, res) => {
    try {
        const { page = 1, limit = 50 } = req.query;

        const cards = await CreditCard.find()
            .populate('user', 'UserName UserSurname UserEmail')
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit));

        const total = await CreditCard.countDocuments();

        res.status(200).json({ success: true, total, data: cards });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener el listado general', error: error.message });
    }
};

/**
 * Obtener tarjetas de credito por usuario
 */
export const getCardsByUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const cards = await CreditCard.find({ user: userId })
            .populate('user', 'UserName UserSurname UserEmail');

        res.status(200).json({ success: true, data: cards });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al buscar tarjetas del usuario', error: error.message });
    }
};

const generatePAN = () => {
    const prefix = "4213";
    const random = Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
    return prefix + random;
};

/**
 * Crear tarjeta de credito
 */
export const createCreditCard = async (req, res) => {
    try {
        const { user, type, creditLimit } = req.body;

        const cardNumber = generatePAN();
        const cutoffDate = 15;
        const paymentDeadline = 20;

        let interestRate = 2.5;
        if (type === 'GOLD')     interestRate = 2.2;
        if (type === 'PLATINUM') interestRate = 1.8;
        if (type === 'BLACK')    interestRate = 1.5;

        const newCard = new CreditCard({
            cardNumber,
            user,
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
            message: 'Tarjeta emitida exitosamente',
            data: newCard
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al emitir tarjeta', error: error.message });
    }
};