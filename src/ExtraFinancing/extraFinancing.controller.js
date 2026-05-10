'use strict';

import ExtraFinancing from './extraFinancing.model.js';
import CreditCard from '../Card/creditCard.model.js';

export const createExtraFinancing = async (req, res) => {
    try {
        const { creditCard, totalAmount, installments, description, interestRate } = req.body;

        // Validar que la tarjeta exista y esté activa
        const card = await CreditCard.findById(creditCard);
        if (!card) return res.status(404).json({ success: false, message: 'Tarjeta de crédito no encontrada' });
        if (card.status !== 'ACTIVE') return res.status(400).json({ success: false, message: 'La tarjeta no está activa para este beneficio' });

        const newFinancing = new ExtraFinancing({
            description,
            creditCard,
            user: card.user, 
            totalAmount,
            installments,
            interestRate
        });

        await newFinancing.save();

        res.status(201).json({
            success: true,
            message: 'Extra-financiamiento otorgado con éxito',
            data: newFinancing
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al procesar el financiamiento', error: error.message });
    }
};

export const getAllFinancings = async (req, res) => {
    try {
        const financings = await ExtraFinancing.find()
            .populate('user', 'UserName UserSurname')
            .populate('creditCard', 'cardNumber');

        res.status(200).json({ success: true, data: financings });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error al obtener datos', error: error.message });
    }
};